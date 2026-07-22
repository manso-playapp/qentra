import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import {
  buildGuestFullName,
  mapGuestStatusToDb,
  normalizeGuestRecord,
} from '@/lib/guest-schema'
import {
  isTableAssignmentColumnMissingError,
  upsertTableAssignmentInNotes,
} from '@/lib/invitation-response'
import type { UpdateGuestForm } from '@/types'

type GuestRouteContext = {
  params: Promise<{
    guestId: string
  }>
}

export const runtime = 'nodejs'

export async function PATCH(request: Request, context: GuestRouteContext) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  try {
    const { guestId } = await context.params
    const body = (await request.json()) as UpdateGuestForm
    const payload: Record<string, string | null> = {}

    // Revertir un ingreso es mas que volver el status a "habilitado": el
    // check-in aprobado consume el token y deja el QR oculto en la invitacion.
    // Conservamos el registro como "denegado" para auditoria, pero deja de
    // contar como ingreso y el token que se uso vuelve a quedar disponible.
    const { data: currentGuest, error: currentGuestError } = await adminClient
      .from('guests')
      .select('status')
      .eq('id', guestId)
      .maybeSingle()

    if (currentGuestError) {
      return Response.json({ error: currentGuestError.message }, { status: 500 })
    }

    if (!currentGuest) {
      return Response.json({ error: 'Invitado inexistente.' }, { status: 404 })
    }

    const isCheckinReversal = body.status === 'confirmed' && currentGuest.status === 'checked_in'

    const restoreAccessAfterCheckinReversal = async () => {
      if (!isCheckinReversal) return null

      const rollbackGuestStatus = async () => {
        await adminClient.from('guests').update({ status: currentGuest.status }).eq('id', guestId)
      }

      const { error: checkinReversalError } = await adminClient
        .from('checkins')
        .update({ result: 'denied', reason: 'Ingreso revertido desde Alista Admin' })
        .eq('guest_id', guestId)
        .eq('result', 'approved')

      if (checkinReversalError) {
        await rollbackGuestStatus()
        return checkinReversalError.message
      }

      const { data: usedToken, error: usedTokenError } = await adminClient
        .from('invitation_tokens')
        .select('id')
        .eq('guest_id', guestId)
        .not('last_used_at', 'is', null)
        .order('last_used_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (usedTokenError) {
        await rollbackGuestStatus()
        return usedTokenError.message
      }

      if (!usedToken) return null

      const { error: restoreTokenError } = await adminClient
        .from('invitation_tokens')
        .update({ used_count: 0, last_used_at: null, is_active: true })
        .eq('id', usedToken.id)

      if (restoreTokenError) {
        await rollbackGuestStatus()
        return restoreTokenError.message
      }

      return null
    }

    if (body.guest_type_id !== undefined) payload.guest_type_id = body.guest_type_id
    if (body.first_name !== undefined) payload.first_name = body.first_name.trim()
    if (body.last_name !== undefined) payload.last_name = body.last_name.trim()
    if (body.email !== undefined) payload.email = body.email?.trim() || null
    if (body.phone !== undefined) payload.phone = body.phone?.trim() || null
    if (body.special_requests !== undefined) payload.notes = body.special_requests?.trim() || null
    if (body.table_assignment !== undefined)
      payload.table_assignment = body.table_assignment?.trim() || null
    if (body.status !== undefined) payload.status = mapGuestStatusToDb(body.status)
    if (
      body.payment_status !== undefined &&
      ['not_required', 'pending', 'approved'].includes(body.payment_status)
    ) {
      payload.payment_status = body.payment_status
    }

    if (body.first_name !== undefined && body.last_name !== undefined) {
      payload.full_name = buildGuestFullName(body.first_name, body.last_name)
    }

    // Si el update incluye table_assignment y la columna no existe en el
    // esquema (migracion pendiente), caemos a un fallback que persiste el
    // valor dentro de notes como "Destino: ...". El read path ya lo lee.
    if (payload.table_assignment !== undefined) {
      const { data, error } = await adminClient
        .from('guests')
        .update(payload)
        .eq('id', guestId)
        .select(`
          *,
          guest_types (
            name,
            description,
            access_policy_label,
            access_start_time,
            access_end_time,
            access_start_day_offset,
            access_end_day_offset
          )
        `)
        .single()

      if (error && isTableAssignmentColumnMissingError(error)) {
        // Reintentar sin la columna nativa: embeber destino en notes.
        const { data: existing } = await adminClient
          .from('guests')
          .select('notes')
          .eq('id', guestId)
          .maybeSingle()

        const fallbackNotes = upsertTableAssignmentInNotes(
          payload.notes !== undefined ? payload.notes : existing?.notes,
          payload.table_assignment
        )
        const fallbackPayload: Record<string, string | null> = { ...payload }
        delete fallbackPayload.table_assignment
        fallbackPayload.notes = fallbackNotes

        const { data: retryData, error: retryError } = await adminClient
          .from('guests')
          .update(fallbackPayload)
          .eq('id', guestId)
          .select(`
            *,
            guest_types (
              name,
              description,
              access_policy_label,
              access_start_time,
              access_end_time,
              access_start_day_offset,
              access_end_day_offset
            )
          `)
          .single()

        if (retryError) {
          return Response.json({ error: retryError.message }, { status: 500 })
        }

        const reversalError = await restoreAccessAfterCheckinReversal()
        if (reversalError) return Response.json({ error: reversalError }, { status: 500 })

        return Response.json({ data: normalizeGuestRecord(retryData) })
      }

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }

      const reversalError = await restoreAccessAfterCheckinReversal()
      if (reversalError) return Response.json({ error: reversalError }, { status: 500 })

      return Response.json({ data: normalizeGuestRecord(data) })
    }

    const { data, error } = await adminClient
      .from('guests')
      .update(payload)
      .eq('id', guestId)
      .select(`
        *,
        guest_types (
          name,
          description,
          access_policy_label,
          access_start_time,
          access_end_time,
          access_start_day_offset,
          access_end_day_offset
        )
      `)
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    const reversalError = await restoreAccessAfterCheckinReversal()
    if (reversalError) return Response.json({ error: reversalError }, { status: 500 })

    return Response.json({ data: normalizeGuestRecord(data) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el invitado.'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: GuestRouteContext) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  try {
    const { guestId } = await context.params

    const { error: checkinsError } = await adminClient
      .from('checkins')
      .delete()
      .eq('guest_id', guestId)

    if (checkinsError) {
      return Response.json({ error: checkinsError.message }, { status: 500 })
    }

    const { error: invitationTokensError } = await adminClient
      .from('invitation_tokens')
      .delete()
      .eq('guest_id', guestId)

    if (invitationTokensError) {
      return Response.json({ error: invitationTokensError.message }, { status: 500 })
    }

    const { error: guestQrCodesError } = await adminClient
      .from('guest_qr_codes')
      .delete()
      .eq('guest_id', guestId)

    if (guestQrCodesError) {
      return Response.json({ error: guestQrCodesError.message }, { status: 500 })
    }

    const { error: guestError } = await adminClient
      .from('guests')
      .delete()
      .eq('id', guestId)

    if (guestError) {
      return Response.json({ error: guestError.message }, { status: 500 })
    }

    return Response.json({ data: { id: guestId } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo borrar el invitado.'
    return Response.json({ error: message }, { status: 500 })
  }
}

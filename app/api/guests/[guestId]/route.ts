import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { performEventCheckin } from '@/lib/server-checkin'
import {
  buildGuestFullName,
  normalizeGuestRecord,
  resolveNextDbStatus,
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

// La autorizacion es por acceso al EVENTO, no por rol: `ensureAuthorizedEventApiAccess`
// ya cubre staff, duena y colaborador invitado, y espeja `can_manage_event()`.
// Exigir ademas perfil de operador dejaba afuera justo a la clienta —el caso
// normal del self-serve—, que recibia "Operator profile not found" sobre su
// propio invitado. Ver decisiones §3 y §7.1.
export async function PATCH(request: Request, context: GuestRouteContext) {
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
    if (body.restore_invitation_access && body.status === 'checked_in') {
      return Response.json({ error: 'No se puede restaurar y registrar el ingreso en la misma acción.' }, { status: 400 })
    }
    const payload: Record<string, string | number | string[] | null> = {}

    // Revertir un ingreso es mas que volver el status a "habilitado": el
    // check-in aprobado consume el token y deja el QR oculto en la invitacion.
    // Conservamos el registro como "denegado" para auditoria, pero deja de
    // contar como ingreso y el token que se uso vuelve a quedar disponible.
    const { data: currentGuest, error: currentGuestError } = await adminClient
      .from('guests')
      .select('status, event_id, plus_ones_allowed, plus_ones_confirmed, companion_names')
      .eq('id', guestId)
      .maybeSingle()

    if (currentGuestError) {
      return Response.json({ error: currentGuestError.message }, { status: 500 })
    }

    if (!currentGuest) {
      return Response.json({ error: 'Invitado inexistente.' }, { status: 404 })
    }

    const { response: eventAuthError } = await ensureAuthorizedEventApiAccess(currentGuest.event_id)
    if (eventAuthError) return eventAuthError

    const isCheckinReversal =
      body.restore_invitation_access === true ||
      (body.status === 'confirmed' && currentGuest.status === 'checked_in')
    const isManualCheckin = body.status === 'checked_in' && currentGuest.status !== 'checked_in'

    // El ingreso es una acción independiente: no registrar primero y descubrir
    // después que otra edición del formulario era inválida.
    if (isManualCheckin) {
      if (Object.keys(body).some((key) => key !== 'status')) {
        return Response.json({ error: 'Guardá los cambios del invitado y después registrá su ingreso desde Recepción.' }, { status: 400 })
      }
      const result = await performEventCheckin(new Request(request.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, method: 'manual' }),
      }), currentGuest.event_id)
      const outcome = await result.json()
      if (!result.ok || outcome.data?.outcome !== 'registered') {
        return Response.json({ error: outcome.error ?? outcome.data?.detail ?? 'No se pudo registrar el ingreso.' }, { status: result.ok ? 409 : result.status })
      }
      const { data, error } = await adminClient.from('guests').select('*, guest_types(*)').eq('id', guestId).single()
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ data: normalizeGuestRecord(data) })
    }

    if (isCheckinReversal) {
      const { error: reversalError } = await adminClient.rpc('revert_guest_checkin', {
        p_guest_id: guestId,
      })

      if (reversalError) return Response.json({ error: reversalError.message }, { status: 500 })
    }

    if (body.guest_type_id !== undefined) payload.guest_type_id = body.guest_type_id
    if (body.first_name !== undefined) payload.first_name = body.first_name.trim()
    if (body.last_name !== undefined) payload.last_name = body.last_name.trim()
    if (body.email !== undefined) payload.email = body.email?.trim() || null
    if (body.phone !== undefined) payload.phone = body.phone?.trim() || null
    if (body.special_requests !== undefined) payload.notes = body.special_requests?.trim() || null
    if (body.table_assignment !== undefined)
      payload.table_assignment = body.table_assignment?.trim() || null
    if (body.plus_ones_allowed !== undefined) {
      const allowed = Math.max(0, Math.floor(body.plus_ones_allowed))
      const confirmed = Math.max(0, Math.floor(body.plus_ones_confirmed ?? currentGuest.plus_ones_confirmed ?? 0))
      if (confirmed > allowed) {
        return Response.json({ error: 'Los acompanantes confirmados no pueden superar el cupo.' }, { status: 400 })
      }
      payload.plus_ones_allowed = allowed
      payload.plus_ones_confirmed = confirmed
    } else if (body.plus_ones_confirmed !== undefined) {
      const confirmed = Math.max(0, Math.floor(body.plus_ones_confirmed))
      const allowed = Math.max(0, Math.floor(currentGuest.plus_ones_allowed ?? 0))
      if (confirmed > allowed) {
        return Response.json({ error: 'Los acompanantes confirmados no pueden superar el cupo.' }, { status: 400 })
      }
      payload.plus_ones_confirmed = confirmed
    }
    if (body.status !== undefined && body.status !== 'checked_in') payload.status = resolveNextDbStatus(currentGuest.status, body.status)
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
          payload.table_assignment as string | null
        )
        const fallbackPayload: Record<string, string | number | string[] | null> = { ...payload }
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

        return Response.json({ data: normalizeGuestRecord(retryData) })
      }

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }

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

    return Response.json({ data: normalizeGuestRecord(data) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el invitado.'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: GuestRouteContext) {
  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  try {
    const { guestId } = await context.params

    const { data: guest, error: guestLookupError } = await adminClient
      .from('guests')
      .select('event_id')
      .eq('id', guestId)
      .maybeSingle()
    if (guestLookupError) return Response.json({ error: guestLookupError.message }, { status: 500 })
    if (!guest) return Response.json({ error: 'Invitado inexistente.' }, { status: 404 })
    const { response: eventAuthError } = await ensureAuthorizedEventApiAccess(guest.event_id)
    if (eventAuthError) return eventAuthError

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

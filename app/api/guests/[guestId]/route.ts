import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import {
  buildGuestFullName,
  mapGuestStatusToDb,
  normalizeGuestRecord,
} from '@/lib/guest-schema'
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

    if (body.guest_type_id !== undefined) payload.guest_type_id = body.guest_type_id
    if (body.first_name !== undefined) payload.first_name = body.first_name.trim()
    if (body.last_name !== undefined) payload.last_name = body.last_name.trim()
    if (body.email !== undefined) payload.email = body.email?.trim() || null
    if (body.phone !== undefined) payload.phone = body.phone?.trim() || null
    if (body.special_requests !== undefined) payload.notes = body.special_requests?.trim() || null
    if (body.status !== undefined) payload.status = mapGuestStatusToDb(body.status)

    if (body.first_name !== undefined && body.last_name !== undefined) {
      payload.full_name = buildGuestFullName(body.first_name, body.last_name)
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

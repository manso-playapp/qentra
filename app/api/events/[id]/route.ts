import { buildInvitationExpiry } from '@/lib/invitation-expiry'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type UpdateEventBody = {
  name?: string
  slug?: string
  event_type?: 'quince' | 'wedding' | 'corporate' | 'private'
  event_date?: string
  confirmation_deadline?: string | null
  start_time?: string
  venue_name?: string
  venue_address?: string
  max_capacity?: number
  description?: string | null
  gift_info?: string | null
  contact_phone?: string | null
  delivery_profile_id?: string | null
  status?: 'active' | 'inactive' | 'cancelled'
}

function isValidDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

function isValidTime(value: string | undefined) {
  return Boolean(value && /^\d{2}:\d{2}(:\d{2})?$/.test(value))
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const { id: eventId } = await context.params
  const body = (await request.json().catch(() => null)) as UpdateEventBody | null

  if (
    !body ||
    !body.name?.trim() ||
    !body.slug?.trim() ||
    !body.event_type ||
    !isValidDate(body.event_date) ||
    (body.confirmation_deadline !== undefined && body.confirmation_deadline !== null && body.confirmation_deadline !== '' && !isValidDate(body.confirmation_deadline)) ||
    !isValidTime(body.start_time) ||
    !body.venue_name?.trim() ||
    !body.venue_address?.trim() ||
    typeof body.max_capacity !== 'number' ||
    body.max_capacity < 1 ||
    !body.status
  ) {
    return Response.json({ error: 'Los datos del evento no son validos.' }, { status: 400 })
  }

  // Las validaciones anteriores garantizan ambos valores; los fijamos para
  // que el calculo de vencimiento no dependa de propiedades opcionales.
  const eventDate = body.event_date!
  const startTime = body.start_time!

  const { data: currentEvent, error: currentEventError } = await adminClient
    .from('events')
    .select('event_date, start_time')
    .eq('id', eventId)
    .maybeSingle()

  if (currentEventError) return Response.json({ error: currentEventError.message }, { status: 500 })
  if (!currentEvent) return Response.json({ error: 'Evento inexistente.' }, { status: 404 })

  const updatePayload = {
    ...body,
    ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
    ...(body.gift_info !== undefined ? { gift_info: body.gift_info?.trim() || null } : {}),
    ...(body.confirmation_deadline !== undefined ? { confirmation_deadline: body.confirmation_deadline?.trim() || null } : {}),
    ...(body.contact_phone !== undefined ? { contact_phone: body.contact_phone?.trim() || null } : {}),
  }

  const { error: updateError } = await adminClient.from('events').update(updatePayload).eq('id', eventId)
  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  const scheduleChanged =
    currentEvent.event_date !== eventDate || currentEvent.start_time !== startTime

  if (scheduleChanged) {
    const { data: guests, error: guestsError } = await adminClient
      .from('guests')
      .select('id')
      .eq('event_id', eventId)

    if (guestsError) return Response.json({ error: guestsError.message }, { status: 500 })

    const guestIds = (guests ?? []).map((guest) => guest.id)
    if (guestIds.length > 0) {
      const { error: tokenError } = await adminClient
        .from('invitation_tokens')
        .update({ expires_at: buildInvitationExpiry(eventDate, startTime) })
        .in('guest_id', guestIds)
        .eq('is_active', true)
        .is('last_used_at', null)
        .or('used_count.is.null,used_count.eq.0')

      if (tokenError) return Response.json({ error: tokenError.message }, { status: 500 })
    }
  }

  return Response.json({ ok: true, accessExpiryUpdated: scheduleChanged })
}

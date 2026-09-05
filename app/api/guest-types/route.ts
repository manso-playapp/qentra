import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { validateAccessSchedule } from '@/lib/event-schedule'

type CreateGuestTypeRequestBody = {
  event_id?: string
  name?: string
  description?: string
  access_policy_label?: string
  access_start_time?: string | null
  access_end_time?: string | null
  access_start_day_offset?: number | null
  access_end_day_offset?: number | null
  payment_amount_cents?: number
  show_gift_info?: boolean
  invitation_message?: string
}

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const eventId = url.searchParams.get('eventId')?.trim()
  if (!eventId) return Response.json({ error: 'Falta eventId.' }, { status: 400 })
  const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(eventId)
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const { data, error } = await adminClient
    .from('guest_types')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: data ?? [] })
}

export async function POST(request: Request) {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return Response.json({ error: 'El cuerpo de la solicitud debe ser JSON válido.' }, { status: 400 })
  }
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return Response.json({ error: 'Los datos del tipo de invitado deben ser un objeto.' }, { status: 400 })
  }
  const fields = rawBody as Record<string, unknown>
  for (const field of ['event_id', 'name', 'description', 'access_policy_label', 'invitation_message']) {
    if (fields[field] !== undefined && typeof fields[field] !== 'string') {
      return Response.json({ error: `El campo ${field} debe ser texto.` }, { status: 400 })
    }
  }
  for (const field of ['access_start_time', 'access_end_time']) {
    if (fields[field] !== undefined && fields[field] !== null && typeof fields[field] !== 'string') {
      return Response.json({ error: 'Los horarios deben ser texto con formato de 24 horas.' }, { status: 400 })
    }
  }
  for (const field of ['access_start_day_offset', 'access_end_day_offset']) {
    if (fields[field] !== undefined && fields[field] !== null && typeof fields[field] !== 'number') {
      return Response.json({ error: 'El día del acceso debe ser un número entero.' }, { status: 400 })
    }
  }
  const body = rawBody as CreateGuestTypeRequestBody
  const eventId = body.event_id?.trim()
  if (!eventId) return Response.json({ error: 'Falta eventId.' }, { status: 400 })
  const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(eventId)
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const name = body.name?.trim()

  if (!eventId || !name) {
    return Response.json(
      { error: 'Evento y nombre del tipo son obligatorios.' },
      { status: 400 }
    )
  }

  const invitationMessage = body.invitation_message?.trim() || null
  if (invitationMessage && invitationMessage.length > 160) {
    return Response.json({ error: 'La leyenda de la invitación no puede superar los 160 caracteres.' }, { status: 400 })
  }

  const schedule = {
    access_start_time: body.access_start_time?.trim() || null,
    access_end_time: body.access_end_time?.trim() || null,
    access_start_day_offset: body.access_start_day_offset === undefined ? 0 : body.access_start_day_offset,
    access_end_day_offset: body.access_end_day_offset === undefined ? 0 : body.access_end_day_offset,
  }
  let eventStartTime: string | null = null
  if ((schedule.access_start_time && schedule.access_start_day_offset === null) ||
    (schedule.access_end_time && schedule.access_end_day_offset === null)) {
    const { data: event, error: eventError } = await adminClient
      .from('events').select('start_time').eq('id', eventId).maybeSingle()
    if (eventError) return Response.json({ error: eventError.message }, { status: 500 })
    if (!event) return Response.json({ error: 'Evento inexistente.' }, { status: 404 })
    eventStartTime = event.start_time
  }
  const scheduleError = validateAccessSchedule(schedule, eventStartTime)
  if (scheduleError) return Response.json({ error: scheduleError }, { status: 400 })

  const payload = {
    event_id: eventId,
    name,
    description: body.description?.trim() || null,
    access_policy_label: body.access_policy_label?.trim() || null,
    ...schedule,
    payment_amount_cents: Math.max(0, Math.trunc(body.payment_amount_cents ?? 0)),
    show_gift_info: body.show_gift_info ?? true,
    invitation_message: invitationMessage,
  }

  const { data, error } = await adminClient.from('guest_types').insert(payload).select().single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

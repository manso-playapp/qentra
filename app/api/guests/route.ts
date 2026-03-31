import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { buildGuestFullName, normalizeGuestRecord } from '@/lib/guest-schema'

type CreateGuestRequestBody = {
  event_id?: string
  guest_type_id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  special_requests?: string
}

export const runtime = 'nodejs'

export async function GET(request: Request) {
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

  const url = new URL(request.url)
  const eventId = url.searchParams.get('eventId')?.trim()

  if (!eventId) {
    return Response.json({ error: 'Falta eventId.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('guests')
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
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: (data ?? []).map((guest) => normalizeGuestRecord(guest)) })
}

export async function POST(request: Request) {
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

  const body = (await request.json()) as CreateGuestRequestBody
  const eventId = body.event_id?.trim()
  const guestTypeId = body.guest_type_id?.trim()
  const firstName = body.first_name?.trim()
  const lastName = body.last_name?.trim()

  if (!eventId || !guestTypeId || !firstName || !lastName) {
    return Response.json(
      { error: 'Evento, tipo, nombre y apellido son obligatorios.' },
      { status: 400 }
    )
  }

  const payload = {
    event_id: eventId,
    guest_type_id: guestTypeId,
    first_name: firstName,
    last_name: lastName,
    full_name: buildGuestFullName(firstName, lastName),
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    notes: body.special_requests?.trim() || null,
    created_manually: true,
    status: 'preinvited',
  }

  const { data, error } = await adminClient
    .from('guests')
    .insert(payload)
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
}

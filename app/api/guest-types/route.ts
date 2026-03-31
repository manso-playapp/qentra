import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

type CreateGuestTypeRequestBody = {
  event_id?: string
  name?: string
  description?: string
  access_policy_label?: string
  access_start_time?: string
  access_end_time?: string
  access_start_day_offset?: number
  access_end_day_offset?: number
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

  const body = (await request.json()) as CreateGuestTypeRequestBody
  const eventId = body.event_id?.trim()
  const name = body.name?.trim()

  if (!eventId || !name) {
    return Response.json(
      { error: 'Evento y nombre del tipo son obligatorios.' },
      { status: 400 }
    )
  }

  const payload = {
    event_id: eventId,
    name,
    description: body.description?.trim() || null,
    access_policy_label: body.access_policy_label?.trim() || null,
    access_start_time: body.access_start_time?.trim() || null,
    access_end_time: body.access_end_time?.trim() || null,
    access_start_day_offset: body.access_start_day_offset ?? 0,
    access_end_day_offset: body.access_end_day_offset ?? 0,
  }

  const { data, error } = await adminClient.from('guest_types').insert(payload).select().single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

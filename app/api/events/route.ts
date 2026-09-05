import { ensureAuthenticatedApiAccess } from '@/lib/operator-auth'
import { isAlistaStaff } from '@/lib/event-access'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import type { Event } from '@/types'

export const runtime = 'nodejs'

export async function GET() {
  const { response, auth } = await ensureAuthenticatedApiAccess()
  if (response || !auth) return response

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' }, { status: 503 })
  }

  let query = adminClient.from('events').select('*, guest_types(is_active, access_start_time, access_end_time, access_start_day_offset, access_end_day_offset)').order('created_at', { ascending: false })
  // El staff de Alista ve todo; el resto ve sus eventos propios y los asignados.
  if (!isAlistaStaff(auth.access)) query = query.in('id', auth.manageableEventIds)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data: data ?? [] })
}

export async function POST(request: Request) {
  // Crear un evento esta abierto a cualquier persona autenticada: quien lo crea
  // queda como dueno y solo alcanza lo suyo. Espeja la policy de INSERT en
  // `events`, que es lo que habilita el self-serve.
  const { response, auth } = await ensureAuthenticatedApiAccess()
  if (response || !auth) return response

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as Partial<Event> | null
  if (!body?.name?.trim() || !body.slug?.trim() || !body.event_type || !body.event_date ||
      !body.start_time || !body.venue_name?.trim() || !body.venue_address?.trim() ||
      !Number.isInteger(body.max_capacity) || (body.max_capacity ?? 0) < 1) {
    return Response.json({ error: 'Los datos del evento no son validos.' }, { status: 400 })
  }

  const payload = {
    name: body.name.trim(), slug: body.slug.trim(), event_type: body.event_type,
    event_date: body.event_date, confirmation_deadline: body.confirmation_deadline || null,
    start_time: body.start_time, venue_name: body.venue_name.trim(),
    venue_address: body.venue_address.trim(), dresscode: body.dresscode?.trim() || null,
    directions_url: body.directions_url?.trim() || null, max_capacity: body.max_capacity,
    description: body.description?.trim() || null, gift_info: body.gift_info?.trim() || null,
    contact_phone: body.contact_phone?.trim() || null, status: body.status ?? 'active',
    created_by_user_id: auth.user.id,
    // Quien crea arranca siendo dueño. La propiedad se puede transferir después
    // (planner configura, la responsable recibe), pero un evento nunca debe
    // quedar sin dueño: sin owner solo lo alcanza el staff de Alista.
    owner_user_id: auth.user.id,
  }

  const { data, error } = await adminClient.from('events').insert(payload).select('*').single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

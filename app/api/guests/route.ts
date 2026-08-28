import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { buildGuestFullName, normalizeGuestRecord } from '@/lib/guest-schema'
import { toE164 } from '@/lib/phone'
import {
  isTableAssignmentColumnMissingError,
  upsertTableAssignmentInNotes,
} from '@/lib/invitation-response'

type CreateGuestRequestBody = {
  event_id?: string
  guest_type_id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  special_requests?: string
  table_assignment?: string
  plus_ones_allowed?: number
}

export const runtime = 'nodejs'

function normalizePhone(value?: string) {
  return value && /\d/.test(value) ? toE164(value) : null
}

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
    .from('guests')
    .select(`
      id,
      event_id,
      guest_type_id,
      first_name,
      last_name,
      email,
      phone,
      photo_url,
      document_number,
      status,
      payment_status,
      notes,
      table_assignment,
      plus_ones_allowed,
      plus_ones_confirmed,
      companion_names,
      created_at,
      updated_at,
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
  const body = (await request.json()) as CreateGuestRequestBody
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

  const guestTypeId = body.guest_type_id?.trim()
  const firstName = body.first_name?.trim()
  const lastName = body.last_name?.trim()

  if (!eventId || !guestTypeId || !firstName || !lastName) {
    return Response.json(
      { error: 'Evento, tipo, nombre y apellido son obligatorios.' },
      { status: 400 }
    )
  }

  const { data: guestType, error: guestTypeError } = await adminClient
    .from('guest_types')
    .select('event_id, payment_amount_cents')
    .eq('id', guestTypeId)
    .maybeSingle()

  if (guestTypeError) {
    return Response.json({ error: guestTypeError.message }, { status: 500 })
  }
  if (!guestType || guestType.event_id !== eventId) {
    return Response.json({ error: 'El tipo de invitado no corresponde al evento.' }, { status: 400 })
  }

  const plusOnesAllowed = Math.max(0, Math.floor(body.plus_ones_allowed ?? 0))
  const payload: Record<string, string | boolean | number | string[] | null> = {
    event_id: eventId,
    guest_type_id: guestTypeId,
    first_name: firstName,
    last_name: lastName,
    full_name: buildGuestFullName(firstName, lastName),
    email: body.email?.trim() || null,
    phone: normalizePhone(body.phone?.trim()),
    notes: body.special_requests?.trim() || null,
    table_assignment: body.table_assignment?.trim() || null,
    plus_ones_allowed: plusOnesAllowed,
    plus_ones_confirmed: 0,
    companion_names: [],
    created_manually: true,
    status: 'preinvited',
    payment_status: (guestType.payment_amount_cents ?? 0) > 0 ? 'pending' : 'not_required',
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

  // Fallback: si la columna table_assignment no existe (migracion pendiente),
  // reintentar el insert embebiendo el destino dentro de notes.
  if (error && isTableAssignmentColumnMissingError(error)) {
    const fallbackPayload = { ...payload }
    delete fallbackPayload.table_assignment
    fallbackPayload.notes = upsertTableAssignmentInNotes(
      (payload.notes as string | null) ?? null,
      (payload.table_assignment as string | null) ?? null
    )

    const { data: retryData, error: retryError } = await adminClient
      .from('guests')
      .insert(fallbackPayload)
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

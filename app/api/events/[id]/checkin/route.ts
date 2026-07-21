import { evaluateGuestAccess } from '@/lib/access-policy'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { parseInvitationDetails } from '@/lib/invitation-response'
import type { CheckinMethod } from '@/types'

export const runtime = 'nodejs'

// Validacion y registro del check-in, del lado del servidor con service role.
//
// Antes esto vivia en el cliente (EventCheckinManager) y leia/escribia
// invitation_tokens, guests y checkins con la key del navegador. RLS le oculta
// esas tablas al cliente, asi que el lookup del token devolvia null ("No existe
// una invitacion...") y el check-in no podia registrarse. El resto de la app ya
// hacia las operaciones sensibles por el servidor; el check-in era el outlier.

type OverrideCode = 'already_checked_in' | 'outside_window' | 'event_full'

type CheckinRequestBody = {
  token?: string
  guestId?: string
  method?: CheckinMethod
  override?: { code?: string; reason?: string }
}

function isOverrideable(code: string): code is OverrideCode {
  return code === 'already_checked_in' || code === 'outside_window' || code === 'event_full'
}

function firstGuestType(value: unknown) {
  if (Array.isArray(value)) return value[0] ?? null
  return (value as Record<string, unknown> | null) ?? null
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess([
    'admin',
    'door',
    'security_supervisor',
  ])
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const { id: eventId } = await context.params
  const body = (await request.json().catch(() => null)) as CheckinRequestBody | null
  const token = body?.token?.trim()
  const method: CheckinMethod = body?.method ?? 'manual'
  const override = body?.override?.code ? body.override : undefined

  if (!token && !body?.guestId) {
    return Response.json({ error: 'Falta el token o el invitado.' }, { status: 400 })
  }

  const { data: eventData, error: eventError } = await adminClient
    .from('events')
    .select('id, event_date, start_time, max_capacity')
    .eq('id', eventId)
    .maybeSingle()

  if (eventError) return Response.json({ error: eventError.message }, { status: 500 })
  if (!eventData) return Response.json({ error: 'Evento inexistente.' }, { status: 404 })

  // Resolver invitado a partir del token (escaneo) o del id (check-in manual).
  let invitationToken: {
    id: string
    guest_id: string
    expires_at: string
    max_uses: number | null
    used_count: number | null
    last_used_at: string | null
  } | null = null

  let guestId = body?.guestId?.trim() ?? ''

  if (token) {
    const { data, error } = await adminClient
      .from('invitation_tokens')
      .select('id, guest_id, expires_at, max_uses, used_count, last_used_at')
      .eq('token', token)
      .maybeSingle()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    if (!data) {
      return Response.json({
        data: {
          outcome: 'blocked',
          kind: 'error',
          title: 'Acceso inválido',
          detail: 'No existe una invitación para este evento con el token ingresado.',
        },
      })
    }
    invitationToken = data
    guestId = data.guest_id
  }

  const { data: guest, error: guestError } = await adminClient
    .from('guests')
    .select(
      `
      id,
      event_id,
      first_name,
      last_name,
      status,
      table_assignment,
      notes,
      guest_types (
        name,
        access_policy_label,
        access_start_time,
        access_end_time,
        access_start_day_offset,
        access_end_day_offset
      )
    `
    )
    .eq('id', guestId)
    .maybeSingle()

  if (guestError) return Response.json({ error: guestError.message }, { status: 500 })
  if (!guest) {
    return Response.json({
      data: {
        outcome: 'blocked',
        kind: 'error',
        title: 'Invitado inexistente',
        detail: 'La invitación existe, pero el invitado asociado ya no está disponible.',
      },
    })
  }
  if (guest.event_id !== eventId) {
    return Response.json({
      data: {
        outcome: 'blocked',
        kind: 'error',
        title: 'Acceso inválido',
        detail: 'La invitación existe, pero corresponde a otro evento.',
      },
    })
  }

  const guestType = firstGuestType(guest.guest_types)

  const { data: lastCheckin } = await adminClient
    .from('checkins')
    .select('checked_in_at')
    .eq('event_id', eventId)
    .eq('guest_id', guest.id)
    .order('checked_in_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Ocupacion del evento: personas ya admitidas (check-ins aprobados). Se usa
  // para validar el aforo total antes de habilitar un ingreso nuevo.
  const { count: approvedCount } = await adminClient
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('result', 'approved')

  // Destino (mesa) para mostrar en el totem: columna propia con fallback legacy.
  const tableAssignment =
    guest.table_assignment?.trim() ||
    parseInvitationDetails(guest.notes).tableAssignment ||
    ''

  const decision = evaluateGuestAccess({
    event: eventData,
    guest: { first_name: guest.first_name, last_name: guest.last_name, status: guest.status },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    guestType: guestType as any,
    invitationToken: invitationToken ? { expires_at: invitationToken.expires_at } : undefined,
    lastCheckinTime: lastCheckin?.checked_in_at ?? null,
    eventCapacity: eventData.max_capacity,
    eventOccupancy: approvedCount ?? 0,
  })

  const overrideApproved =
    Boolean(override) && isOverrideable(decision.code) && override?.code === decision.code

  if (decision.decision !== 'allow' && !overrideApproved) {
    return Response.json({
      data: {
        outcome: 'blocked',
        kind: decision.decision === 'warn' ? 'warning' : 'error',
        title: decision.title,
        detail: decision.detail,
        overrideable: isOverrideable(decision.code),
        decisionCode: decision.code,
        guest: { first_name: guest.first_name, last_name: guest.last_name },
      },
    })
  }

  const now = new Date().toISOString()

  // Consumir el token de invitacion (un solo uso, salvo max_uses mayor).
  if (invitationToken && !invitationToken.last_used_at) {
    const nextUsedCount = (invitationToken.used_count ?? 0) + 1
    const maxUses = invitationToken.max_uses ?? 1
    const { error: tokenUpdateError } = await adminClient
      .from('invitation_tokens')
      .update({ used_count: nextUsedCount, last_used_at: now, is_active: nextUsedCount < maxUses })
      .eq('id', invitationToken.id)

    if (tokenUpdateError) return Response.json({ error: tokenUpdateError.message }, { status: 500 })
  }

  const { error: guestUpdateError } = await adminClient
    .from('guests')
    .update({ status: 'checked_in' })
    .eq('id', guest.id)

  if (guestUpdateError) return Response.json({ error: guestUpdateError.message }, { status: 500 })

  const reason = override
    ? `Override ${override.code}: ${override.reason ?? ''}`.trim()
    : method === 'qr'
      ? 'Check-in desde QR en admin'
      : 'Check-in manual desde admin'

  const { error: checkinInsertError } = await adminClient.from('checkins').insert({
    guest_id: guest.id,
    event_id: eventId,
    checked_in_at: now,
    result: 'approved',
    device_name: method,
    reason,
  })

  if (checkinInsertError) return Response.json({ error: checkinInsertError.message }, { status: 500 })

  return Response.json({
    data: {
      outcome: 'registered',
      kind: 'success',
      title: override ? 'Override aplicado' : 'Check-in registrado',
      detail: override
        ? `${guest.first_name} ${guest.last_name} ingresó por excepción supervisada.`
        : `${guest.first_name} ${guest.last_name} ingresó correctamente al evento.`,
      guest: { first_name: guest.first_name, last_name: guest.last_name },
      tableAssignment: tableAssignment || null,
    },
  })
}

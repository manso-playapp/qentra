import { evaluateGuestAccess } from '@/lib/access-policy'
import { ensureAuthorizedEventApiAccess, verifySecurityOverridePin, isSecuritySupervisorPinConfigured, verifySecuritySupervisorPin } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { parseCompanionNames, parseInvitationDetails } from '@/lib/invitation-response'
import type { CheckinMethod, GuestType } from '@/types'


// Validacion y registro del check-in, del lado del servidor con service role.
//
// Antes esto vivia en el cliente (EventCheckinManager) y leia/escribia
// invitation_tokens, guests y checkins con la key del navegador. RLS le oculta
// esas tablas al cliente, asi que el lookup del token devolvia null ("No existe
// una invitacion...") y el check-in no podia registrarse. El resto de la app ya
// hacia las operaciones sensibles por el servidor; el check-in era el outlier.

type OverrideCode = 'already_checked_in' | 'outside_window'

type CheckinRequestBody = {
  token?: string
  guestId?: string
  method?: CheckinMethod
  intent?: 'preview' | 'approve'
  override?: { code?: string; reason?: string; pin?: string; supervisorPin?: string }
}

function isValidCheckinBody(value: unknown): value is CheckinRequestBody {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const body = value as Record<string, unknown>
  if (body.token !== undefined && (typeof body.token !== 'string' || body.token.length > 2048)) return false
  if (body.guestId !== undefined && typeof body.guestId !== 'string') return false
  if (body.method !== undefined && body.method !== 'qr' && body.method !== 'manual') return false
  if (body.intent !== undefined && body.intent !== 'preview' && body.intent !== 'approve') return false
  if (body.override !== undefined) {
    if (!body.override || typeof body.override !== 'object' || Array.isArray(body.override)) return false
    const override = body.override as Record<string, unknown>
    if (typeof override.code !== 'string') return false
    for (const key of ['reason', 'pin', 'supervisorPin']) {
      if (override[key] !== undefined && (typeof override[key] !== 'string' || (override[key] as string).length > 500)) return false
    }
  }
  return true
}

function checkinErrorMessage(code: string) {
  const messages: Record<string, string> = {
    payment_required: 'El pago todavía no está aprobado. Revisá su estado con la responsable.',
    not_ready: 'El acceso todavía no está habilitado.',
    cancelled: 'El invitado está cancelado.',
    duplicate: 'El invitado figura como duplicado.',
    expired: 'La invitación está vencida.',
    already_checked_in: 'El ingreso ya fue registrado. Volvé a verificar antes de autorizar un reingreso.',
    outside_window: 'El acceso está fuera del horario permitido.',
    event_full: 'El grupo supera el cupo disponible. Revisá la lista con la responsable.',
    invalid_token: 'La invitación no está activa o ya fue utilizada.',
  }
  return messages[code] ?? 'No se pudo registrar el ingreso. Contactá al soporte de Alista antes de reintentar.'
}

function isOverrideable(code: string): code is OverrideCode {
  return code === 'already_checked_in' || code === 'outside_window'
}

type AccessGuestType = Pick<GuestType, 'name' | 'access_policy_label' | 'access_start_time' | 'access_end_time' | 'access_start_day_offset' | 'access_end_day_offset'>

function firstGuestType(value: AccessGuestType | AccessGuestType[] | null) {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

async function notifyTotemOfApprovedCheckin(eventId: string) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!projectUrl || !serviceRoleKey) return

  try {
    const topic = encodeURIComponent(`totem-checkins-${eventId}`)
    const response = await fetch(`${projectUrl}/realtime/v1/api/broadcast/${topic}/events/checkin`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(600),
    })

    if (!response.ok) {
      console.warn('[checkin] no se pudo notificar al totem', response.status)
    }
  } catch (error) {
    // El registro ya fue confirmado. Realtime/Postgres Changes y el sondeo del
    // Tótem siguen siendo respaldo si este aviso inmediato falla.
    console.warn('[checkin] fallo el aviso inmediato al totem', error)
  }
}

export async function performEventCheckin(request: Request, eventId: string) {
  const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(eventId, [
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

  const body = (await request.json().catch(() => null)) as CheckinRequestBody | null
  if (!isValidCheckinBody(body)) {
    return Response.json({ error: 'Los datos del ingreso no son válidos.' }, { status: 400 })
  }
  const token = body.token?.trim()
  const method: CheckinMethod = body?.method ?? 'manual'
  const isPreview = body?.intent === 'preview'
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
    is_active: boolean
  } | null = null

  let guestId = body?.guestId?.trim() ?? ''

  if (token) {
    const { data, error } = await adminClient
      .from('invitation_tokens')
      .select('id, guest_id, expires_at, max_uses, used_count, last_used_at, is_active')
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
    if (!data.is_active || data.last_used_at || (data.used_count ?? 0) >= (data.max_uses ?? 1)) {
      return Response.json({ data: { outcome: 'blocked', kind: 'warning', title: 'Invitación no disponible', detail: 'Este QR ya fue utilizado o no está activo. Buscá al invitado para revisar su ingreso.' } })
    }
  }

  const { data: guest, error: guestError } = await adminClient
    .from('guests')
    .select(
      `
      id,
      event_id,
      first_name,
      last_name,
      document_number,
      photo_url,
      status,
      payment_status,
      table_assignment,
      notes,
      plus_ones_confirmed,
      companion_names,
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

  const { data: lastCheckin, error: lastCheckinError } = await adminClient
    .from('checkins')
    .select('checked_in_at')
    .eq('event_id', eventId)
    .eq('guest_id', guest.id)
    .eq('result', 'approved')
    .order('checked_in_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastCheckinError) return Response.json({ error: 'No se pudo verificar el historial de ingreso.' }, { status: 503 })

  // Ocupacion del evento: personas ya admitidas (check-ins aprobados). Se usa
  // para validar el aforo total antes de habilitar un ingreso nuevo.
  const { data: approvedCheckins, error: approvedCountError } = await adminClient
    .from('checkins')
    .select('admitted_people')
    .eq('event_id', eventId)
    .eq('result', 'approved')

  if (approvedCountError) return Response.json({ error: approvedCountError.message }, { status: 500 })
  if ((approvedCheckins ?? []).some((entry) => !Number.isInteger(entry.admitted_people) || entry.admitted_people < 0)) {
    return Response.json({ error: 'No se pudo verificar el cupo. Contactá al soporte de Alista.' }, { status: 503 })
  }
  const approvedCount = (approvedCheckins ?? []).reduce((total, entry) => total + entry.admitted_people, 0)

  // Destino (mesa) para mostrar en el totem: columna propia con fallback legacy.
  const invitationDetails = parseInvitationDetails(guest.notes)
  const documentNumber = guest.document_number?.trim() || invitationDetails.dni.trim() || null
  const tableAssignment = guest.table_assignment?.trim() || invitationDetails.tableAssignment || ''
  const companionNames = Array.isArray(guest.companion_names) && guest.companion_names.length > 0
    ? guest.companion_names.map((name) => name.trim()).filter(Boolean)
    : parseCompanionNames(invitationDetails.companionNames)
  const companionCount = Math.max(0, guest.plus_ones_confirmed ?? companionNames.length)

  const decision = evaluateGuestAccess({
    event: eventData,
    guest: { first_name: guest.first_name, last_name: guest.last_name, status: guest.status, payment_status: guest.payment_status },
    guestType,
    invitationToken: invitationToken ? { expires_at: invitationToken.expires_at } : undefined,
    lastCheckinTime: lastCheckin?.checked_in_at ?? null,
    eventCapacity: eventData.max_capacity,
    eventOccupancy: approvedCount,
    incomingPeople: 1 + companionCount,
  })

  let overrideApproved = false
  if (override) {
    if (!isOverrideable(override.code ?? '') || !override.reason?.trim() ||
        !override.pin || !verifySecurityOverridePin(override.pin) ||
        (isSecuritySupervisorPinConfigured() && (!override.supervisorPin || !verifySecuritySupervisorPin(override.supervisorPin)))) {
      return Response.json({ error: 'La excepción requiere un motivo y los PIN válidos.' }, { status: 403 })
    }
    overrideApproved = isOverrideable(decision.code) && override.code === decision.code
    if (!overrideApproved) {
      return Response.json({ error: 'El estado del acceso cambió. Volvé a verificar al invitado.' }, { status: 409 })
    }
  }

  if (decision.decision !== 'allow' && !overrideApproved) {
    return Response.json({
      data: {
        outcome: 'blocked',
        kind: decision.decision === 'warn' ? 'warning' : 'error',
        title: decision.title,
        detail: decision.detail,
        overrideable: isOverrideable(decision.code),
        decisionCode: decision.code,
        guest: {
          first_name: guest.first_name,
          last_name: guest.last_name,
          document_number: documentNumber,
          photo_url: guest.photo_url,
          plus_ones_confirmed: companionCount,
          companion_names: companionNames.slice(0, companionCount),
        },
      },
    })
  }

  if (isPreview) {
    return Response.json({
      data: {
        outcome: 'ready',
        kind: 'success',
        title: 'Acceso válido',
        detail: 'Verifica la identidad y aprueba el ingreso para registrarlo.',
        guest: {
          first_name: guest.first_name,
          last_name: guest.last_name,
          document_number: documentNumber,
          photo_url: guest.photo_url,
          plus_ones_confirmed: companionCount,
          companion_names: companionNames.slice(0, companionCount),
        },
      },
    })
  }

  const reason = override
    ? `Override ${override.code}: ${override.reason ?? ''}`.trim()
    : method === 'qr'
      ? 'Check-in desde QR en admin'
      : 'Check-in manual desde admin'

  // La base consume el token, marca al invitado, revoca el QR legado y crea el
  // check-in en una misma transaccion. Ninguna superficie puede ver un estado
  // intermedio si la red se corta durante el escaneo.
  const { error: registerError } = await adminClient.rpc('register_guest_checkin_guarded', {
    p_event_id: eventId,
    p_guest_id: guest.id,
    p_invitation_token_id: invitationToken?.id ?? null,
    p_method: method,
    p_reason: reason,
    p_override_code: overrideApproved ? override?.code : null,
  })

  if (registerError) {
    const detail = checkinErrorMessage(registerError.message)
    return Response.json({ error: detail }, { status: registerError.code === 'P0001' ? 409 : 503 })
  }

  await notifyTotemOfApprovedCheckin(eventId)

  return Response.json({
    data: {
      outcome: 'registered',
      kind: 'success',
      title: override ? 'Override aplicado' : 'Check-in registrado',
      detail: override
        ? `${guest.first_name} ${guest.last_name} ingresó por excepción supervisada.`
        : `${guest.first_name} ${guest.last_name}: ingreso registrado. Puede pasar sin esperar al recibidor.`,
      guest: {
        first_name: guest.first_name,
        last_name: guest.last_name,
        document_number: documentNumber,
        photo_url: guest.photo_url,
        plus_ones_confirmed: companionCount,
        companion_names: companionNames.slice(0, companionCount),
      },
      tableAssignment: tableAssignment || null,
    },
  })
}

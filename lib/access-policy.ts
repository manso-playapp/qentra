import type { Event, Guest, GuestType, InvitationToken } from '@/types'
import type { DbGuestStatus } from '@/lib/guest-schema'
import { isInvitationExpired } from '@/lib/invitation-expiry'
import { formatEventDate } from '@/lib/event-date'
import { dateAtOffset, resolveAccessDayOffset } from '@/lib/event-schedule'

type AccessDecision = 'allow' | 'warn' | 'deny'
type AccessCode =
  | 'ok'
  | 'not_ready'
  | 'cancelled'
  | 'duplicate'
  | 'expired'
  | 'already_checked_in'
  | 'outside_window'
  | 'event_full'
  | 'payment_pending'

type EvaluatedAccess = {
  decision: AccessDecision
  code: AccessCode
  title: string
  detail: string
}

type EvaluateGuestAccessInput = {
  event: Pick<Event, 'event_date' | 'start_time'>
  // status arrives in either vocabulary depending on the call path: the domain
  // value (`Guest['status']`, post-normalizeGuestStatus) or the raw DB value
  // (`DbGuestStatus`, e.g. when the caller passes an un-normalized row). The
  // union is the honest input contract and lets us branch on both without casts.
  // Reconciling these vocabularies upstream is tracked as QEN-007.
  guest: Pick<Guest, 'first_name' | 'last_name'> & {
    status: Guest['status'] | DbGuestStatus
    payment_status: string | null
  }
  guestType?: Pick<
    GuestType,
    | 'name'
    | 'access_policy_label'
    | 'access_start_time'
    | 'access_end_time'
    | 'access_start_day_offset'
    | 'access_end_day_offset'
  > | null
  invitationToken?: Pick<InvitationToken, 'expires_at'>
  lastCheckinTime?: string | null
  /** Cupo total del evento (events.max_capacity). Null/0/undefined = sin limite. */
  eventCapacity?: number | null
  /** Personas ya admitidas al evento (check-ins aprobados) antes de este ingreso. */
  eventOccupancy?: number
  /** Titular más acompañantes confirmados que se registran juntos. */
  incomingPeople?: number
  now?: Date
}

function buildLocalDate(date: string, time: string, dayOffset: number) {
  const normalizedClock = normalizeClockValue(time)
  const normalizedTime = normalizedClock.length === 5 ? `${normalizedClock}:00` : normalizedClock
  // La agenda se carga en hora argentina, también cuando el servidor usa UTC.
  const localDate = new Date(`${date}T${normalizedTime}-03:00`)

  if (Number.isNaN(localDate.getTime())) {
    return null
  }

  localDate.setUTCDate(localDate.getUTCDate() + dayOffset)
  return localDate
}

function normalizeClockValue(time?: string) {
  if (!time) {
    return ''
  }

  return time.slice(0, 5)
}

const inferDayOffset = resolveAccessDayOffset

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date)
}

function formatPolicyBoundary(prefix: string, time?: string, dayOffset = 0, eventDate?: string) {
  if (!time) return null
  const date = eventDate ? dateAtOffset(eventDate, dayOffset) : ''
  if (date) return `${prefix} el ${formatEventDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${normalizeClockValue(time)}`
  const suffix = dayOffset === 1 ? ' del día siguiente' : dayOffset === 0 ? ' del día de inicio' : ` (${dayOffset} días después del inicio)`
  return `${prefix} ${normalizeClockValue(time)}${suffix}`
}

export function formatGuestTypeAccessPolicy(
  guestType?: Pick<
    GuestType,
    | 'access_policy_label'
    | 'access_start_time'
    | 'access_end_time'
    | 'access_start_day_offset'
    | 'access_end_day_offset'
  > | null,
  eventStartTime?: string,
  eventDate?: string
) {
  if (!guestType) {
    return 'Sin restriccion horaria.'
  }

  const label = guestType.access_policy_label?.trim()
  const startOffset = inferDayOffset(
    guestType.access_start_time,
    eventStartTime ?? '00:00',
    guestType.access_start_day_offset
  )
  const endOffset = inferDayOffset(
    guestType.access_end_time,
    eventStartTime ?? '00:00',
    guestType.access_end_day_offset
  )
  const boundaries = [
    formatPolicyBoundary('Desde', guestType.access_start_time, startOffset, eventDate),
    formatPolicyBoundary('Hasta', guestType.access_end_time, endOffset, eventDate),
  ].filter(Boolean)

  if (label && boundaries.length > 0) {
    return `${label} · ${boundaries.join(' · ')}`
  }

  if (label) {
    return label
  }

  if (boundaries.length > 0) {
    return boundaries.join(' · ')
  }

  return 'Sin restriccion horaria.'
}

export function evaluateGuestAccess({
  event,
  guest,
  guestType,
  invitationToken,
  lastCheckinTime,
  eventCapacity,
  eventOccupancy,
  incomingPeople = 1,
  now = new Date(),
}: EvaluateGuestAccessInput): EvaluatedAccess {
  const guestFullName = `${guest.first_name} ${guest.last_name}`.trim()

  if (
    guest.status === 'pending' ||
    guest.status === 'preinvited' ||
    guest.status === 'link_sent' ||
    guest.status === 'registered'
  ) {
    return {
      decision: 'deny',
      code: 'not_ready',
      title: 'Acceso aun no habilitado',
      detail: `${guestFullName} todavia no tiene el acceso final habilitado.`,
    }
  }

  if (guest.status === 'cancelled' || guest.status === 'rejected') {
    return {
      decision: 'deny',
      code: 'cancelled',
      title: 'Acceso bloqueado',
      detail: `${guestFullName} figura como invitado cancelado.`,
    }
  }

  if (guest.status === 'duplicate') {
    return {
      decision: 'deny',
      code: 'duplicate',
      title: 'Acceso bloqueado',
      detail: `${guestFullName} figura como invitado duplicado.`,
    }
  }

  if (!['enabled', 'confirmed', 'checked_in'].includes(guest.status)) {
    return { decision: 'deny', code: 'not_ready', title: 'Acceso no habilitado', detail: 'Revisá el estado del invitado antes de registrar su ingreso.' }
  }

  // Se lee exclusivamente la columna; ni las notas ni una excepción de puerta
  // pueden convertir un pago pendiente o desconocido en aprobado.
  if (guest.payment_status !== 'approved' && guest.payment_status !== 'not_required') {
    return { decision: 'deny', code: 'payment_pending', title: 'Pago pendiente de aprobación', detail: `${guestFullName} todavía no tiene un pago aprobado. Revisá su estado con la responsable del evento.` }
  }

  if (invitationToken) {
    const expiryDate = new Date(invitationToken.expires_at)

    if (Number.isNaN(expiryDate.getTime()) || isInvitationExpired(invitationToken.expires_at, now)) {
      return {
        decision: 'deny',
        code: 'expired',
        title: 'Invitacion vencida',
        detail: Number.isNaN(expiryDate.getTime()) ? 'No se pudo verificar la vigencia de la invitación.' : `El token vencio el ${formatDateTime(expiryDate)}.`,
      }
    }
  }

  if (guest.status === 'checked_in' || lastCheckinTime) {
    return {
      decision: 'warn',
      code: 'already_checked_in',
      title: 'Ingreso ya registrado',
      detail: `${guestFullName} ya tiene un check-in registrado${
        lastCheckinTime ? ` el ${formatDateTime(new Date(lastCheckinTime))}` : ''
      }.`,
    }
  }

  const startOffset = inferDayOffset(
    guestType?.access_start_time,
    event.start_time,
    guestType?.access_start_day_offset
  )
  const endOffset = inferDayOffset(
    guestType?.access_end_time,
    event.start_time,
    guestType?.access_end_day_offset
  )
  const accessStartDate = guestType?.access_start_time
    ? buildLocalDate(event.event_date, guestType.access_start_time, startOffset)
    : null
  const accessEndDate = guestType?.access_end_time
    ? buildLocalDate(event.event_date, guestType.access_end_time, endOffset)
    : null

  if ((accessStartDate && now < accessStartDate) || (accessEndDate && now > accessEndDate)) {
    const policyText = formatGuestTypeAccessPolicy(guestType, event.start_time, event.event_date)
    const guestTypeLabel = guestType?.name ? ` para ${guestType.name}` : ''

    return {
      decision: 'deny',
      code: 'outside_window',
      title: 'Acceso fuera de horario',
      detail: `${guestFullName} no esta habilitado${guestTypeLabel} en este momento. ${policyText}`,
    }
  }

  // El grupo puede ocupar exactamente los lugares libres, nunca superarlos.
  if (
    typeof eventCapacity === 'number' &&
    eventCapacity > 0 &&
    typeof eventOccupancy === 'number' &&
    eventOccupancy + Math.max(1, incomingPeople) > eventCapacity
  ) {
    return {
      decision: 'deny',
      code: 'event_full',
      title: 'Cupo completo',
      detail: `El grupo de ${guestFullName} supera los lugares disponibles del cupo de ${eventCapacity} personas. Revisá la lista con la responsable antes de continuar.`,
    }
  }

  return {
    decision: 'allow',
    code: 'ok',
    title: 'Acceso habilitado',
    detail: `${guestFullName} puede ingresar.`,
  }
}

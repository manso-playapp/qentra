import type { Event, Guest, GuestType, InvitationToken } from '@/types'

type AccessDecision = 'allow' | 'warn' | 'deny'
type AccessCode =
  | 'ok'
  | 'not_ready'
  | 'cancelled'
  | 'expired'
  | 'already_checked_in'
  | 'outside_window'

type EvaluatedAccess = {
  decision: AccessDecision
  code: AccessCode
  title: string
  detail: string
}

type EvaluateGuestAccessInput = {
  event: Pick<Event, 'event_date' | 'start_time'>
  guest: Pick<Guest, 'first_name' | 'last_name' | 'status'>
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
  now?: Date
}

function buildLocalDate(date: string, time: string, dayOffset: number) {
  const normalizedClock = normalizeClockValue(time)
  const normalizedTime = normalizedClock.length === 5 ? `${normalizedClock}:00` : normalizedClock
  const localDate = new Date(`${date}T${normalizedTime}`)

  if (Number.isNaN(localDate.getTime())) {
    return null
  }

  localDate.setDate(localDate.getDate() + dayOffset)
  return localDate
}

function normalizeClockValue(time?: string) {
  if (!time) {
    return ''
  }

  return time.slice(0, 5)
}

function inferDayOffset(time: string | undefined, eventStartTime: string, explicitOffset?: number) {
  if (typeof explicitOffset === 'number') {
    return explicitOffset
  }

  if (!time) {
    return 0
  }

  return normalizeClockValue(time) < normalizeClockValue(eventStartTime) ? 1 : 0
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatPolicyBoundary(prefix: string, time?: string, dayOffset?: number) {
  if (!time) {
    return null
  }

  const suffix = dayOffset ? ` del dia ${dayOffset >= 0 ? `+${dayOffset}` : dayOffset}` : ''
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
  eventStartTime?: string
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
    formatPolicyBoundary('Desde', guestType.access_start_time, startOffset),
    formatPolicyBoundary('Hasta', guestType.access_end_time, endOffset),
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
  now = new Date(),
}: EvaluateGuestAccessInput): EvaluatedAccess {
  const guestFullName = `${guest.first_name} ${guest.last_name}`.trim()

  if (
    guest.status === 'pending' ||
    (guest.status as string) === 'preinvited' ||
    (guest.status as string) === 'link_sent' ||
    (guest.status as string) === 'registered'
  ) {
    return {
      decision: 'deny',
      code: 'not_ready',
      title: 'Acceso aun no habilitado',
      detail: `${guestFullName} todavia no tiene el acceso final habilitado.`,
    }
  }

  if (guest.status === 'cancelled' || (guest.status as string) === 'rejected') {
    return {
      decision: 'deny',
      code: 'cancelled',
      title: 'Acceso bloqueado',
      detail: `${guestFullName} figura como invitado cancelado.`,
    }
  }

  if (invitationToken) {
    const expiryDate = new Date(invitationToken.expires_at)

    if (!Number.isNaN(expiryDate.getTime()) && expiryDate.getTime() < now.getTime()) {
      return {
        decision: 'deny',
        code: 'expired',
        title: 'Invitacion vencida',
        detail: `El token vencio el ${formatDateTime(expiryDate)}.`,
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
    const policyText = formatGuestTypeAccessPolicy(guestType, event.start_time)
    const guestTypeLabel = guestType?.name ? ` para ${guestType.name}` : ''

    return {
      decision: 'deny',
      code: 'outside_window',
      title: 'Acceso fuera de horario',
      detail: `${guestFullName} no esta habilitado${guestTypeLabel} en este momento. ${policyText}`,
    }
  }

  return {
    decision: 'allow',
    code: 'ok',
    title: 'Acceso habilitado',
    detail: `${guestFullName} puede ingresar.`,
  }
}

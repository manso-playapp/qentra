import { formatEventDate, parseEventDate } from '@/lib/event-date'

export type AccessSchedule = {
  access_start_time?: string | null
  access_end_time?: string | null
  access_start_day_offset?: number | null
  access_end_day_offset?: number | null
  is_active?: boolean | null
}

type EventStart = { event_date: string; start_time?: string | null }
const CLOCK = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/
const DAY_MS = 86_400_000

export function dateAtOffset(date: string, offset: number) {
  const parsed = parseEventDate(date)
  if (!parsed || !Number.isInteger(offset) || Math.abs(offset) > 365) return ''
  parsed.setUTCDate(parsed.getUTCDate() + offset)
  return parsed.toISOString().slice(0, 10)
}

export function dayOffsetForDate(start: string, date: string) {
  const first = parseEventDate(start)
  const last = parseEventDate(date)
  return first && last ? Math.round((last.getTime() - first.getTime()) / DAY_MS) : null
}

export function resolveAccessDayOffset(time?: string | null, eventStartTime?: string | null, explicit?: number | null) {
  if (typeof explicit === 'number' && Number.isInteger(explicit)) return explicit
  return time && eventStartTime && time.slice(0, 5) < eventStartTime.slice(0, 5) ? 1 : 0
}

export function validateAccessSchedule(schedule: AccessSchedule, eventStartTime?: string | null): string | null {
  for (const time of [schedule.access_start_time, schedule.access_end_time]) {
    if (time !== undefined && time !== null && time !== '' && (typeof time !== 'string' || !CLOCK.test(time))) {
      return 'Usá horas de 00:00 a 23:59. Medianoche es 00:00; mediodía es 12:00.'
    }
  }
  for (const offset of [schedule.access_start_day_offset, schedule.access_end_day_offset]) {
    if (offset !== undefined && offset !== null && (!Number.isInteger(offset) || offset < 0 || offset > 365)) {
      return 'Elegí una fecha entre el inicio de la fiesta y los 365 días siguientes.'
    }
  }
  const start = schedule.access_start_time
  const end = schedule.access_end_time
  if (start && end) {
    const seconds = (time: string) => {
      const [h, m, s = 0] = time.split(':').map(Number)
      return h * 3600 + m * 60 + s
    }
    const from = resolveAccessDayOffset(start, eventStartTime, schedule.access_start_day_offset) * 86400 + seconds(start)
    const to = resolveAccessDayOffset(end, eventStartTime, schedule.access_end_day_offset) * 86400 + seconds(end)
    if (to <= from) return 'El cierre de ingreso debe ser posterior al inicio. Revisá la fecha y la hora: 00:00 es medianoche y 12:00 es mediodía.'
  }
  return null
}

export function getEventScheduleEndDate(event: EventStart, guestTypes: AccessSchedule[] = []) {
  const offsets = guestTypes.filter((type) => type.is_active !== false).flatMap((type) => [
    type.access_start_time ? resolveAccessDayOffset(type.access_start_time, event.start_time, type.access_start_day_offset) : 0,
    type.access_end_time ? resolveAccessDayOffset(type.access_end_time, event.start_time, type.access_end_day_offset) : 0,
  ]).filter((offset) => Number.isInteger(offset) && offset >= 0 && offset <= 365)
  return dateAtOffset(event.event_date, Math.max(0, ...offsets)) || event.event_date
}

export function formatEventSchedule(event: EventStart, guestTypes: AccessSchedule[] = [], options: { compact?: boolean } = {}) {
  const start = formatEventDate(event.event_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const clock = event.start_time ? `, ${event.start_time.slice(0, 5)}` : ''
  const end = getEventScheduleEndDate(event, guestTypes)
  if (options.compact) {
    const startDate = formatEventDate(event.event_date)
    const clockLabel = event.start_time ? ` · inicio ${event.start_time.slice(0, 5)}` : ''
    if (end === event.event_date) return `Inicio: ${startDate}${clock}`
    const first = event.event_date.slice(0, 7) === end.slice(0, 7)
      ? formatEventDate(event.event_date, { day: 'numeric' })
      : startDate
    return `Accesos: ${first}–${formatEventDate(end)}${clockLabel}`
  }
  return `Inicio: ${start}${clock}${end !== event.event_date ? ` · Accesos hasta: ${formatEventDate(end, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : ''}`
}

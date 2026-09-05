import { formatEventDate, parseEventDate } from '@/lib/event-date'
import { dateAtOffset, resolveAccessDayOffset } from '@/lib/event-schedule'

type InvitationEventSchedule = {
  event_date?: string
  start_time?: string
  name?: string
  description?: string
  venue_name?: string
  venue_address?: string
}

export type InvitationSchedule = {
  startTime?: string | null
  startDayOffset?: number | null
  endTime?: string | null
  endDayOffset?: number | null
}

export function getInvitationStartTime(event: InvitationEventSchedule, schedule?: InvitationSchedule) {
  return schedule?.startTime?.slice(0, 5) || event.start_time?.slice(0, 5) || null
}

export function getInvitationStartDate(event: InvitationEventSchedule, schedule?: InvitationSchedule) {
  if (!event.event_date) return null
  const offset = schedule?.startTime
    ? resolveAccessDayOffset(schedule.startTime, event.start_time, schedule.startDayOffset)
    : 0
  return dateAtOffset(event.event_date, offset)
}

export function getInvitationEndDate(event: InvitationEventSchedule, schedule?: InvitationSchedule) {
  if (!event.event_date || !schedule?.endTime) return null
  return dateAtOffset(
    event.event_date,
    resolveAccessDayOffset(schedule.endTime, event.start_time, schedule.endDayOffset)
  )
}

export function formatInvitationAccessWindow(event: InvitationEventSchedule, schedule?: InvitationSchedule) {
  const startDate = getInvitationStartDate(event, schedule)
  const startTime = getInvitationStartTime(event, schedule)
  if (!startDate || !startTime) return null
  const start = `${formatEventDate(startDate, { dateStyle: 'long' })} a las ${startTime} hs`
  const endDate = getInvitationEndDate(event, schedule)
  if (!endDate || !schedule?.endTime) return `Tu ingreso: ${start}`
  const end = `${formatEventDate(endDate, { dateStyle: 'long' })} a las ${schedule.endTime.slice(0, 5)} hs`
  return `Horario de ingreso: desde el ${start} hasta el ${end}`
}

export function buildCalendarUrl(event: InvitationEventSchedule, schedule?: InvitationSchedule) {
  const startDate = getInvitationStartDate(event, schedule)
  const startTime = getInvitationStartTime(event, schedule)
  if (!startDate || !parseEventDate(startDate) || !startTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return null

  // Calendar recibe fecha y hora de Argentina, sin conversión a UTC. La ventana
  // de ingreso no define el fin de la fiesta: agendamos la llegada sin inventar duración.
  const start = `${startDate.replace(/-/g, '')}T${startTime.replace(':', '')}00`
  const details = [
    event.description,
    formatInvitationAccessWindow(event, schedule),
    'La hora de finalización de la fiesta no está indicada en esta invitación.',
    event.venue_name,
    event.venue_address,
  ].filter(Boolean).join('\n')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.name || 'Evento Alista'
  )}&dates=${start}/${start}&ctz=America%2FArgentina%2FBuenos_Aires&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    event.venue_address || event.venue_name || ''
  )}`
}

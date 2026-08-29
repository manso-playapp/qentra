const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const ARGENTINA_TIME_ZONE = 'America/Argentina/Cordoba'

/**
 * `event_date` es una fecha de calendario, no un instante UTC. La convertimos
 * a UTC sólo para formatearla de manera estable, sin que el huso del servidor
 * (o del navegador) la desplace un día.
 */
export function parseEventDate(value: string) {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return null

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

export function formatEventDate(value: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  const date = parseEventDate(value)
  if (!date) return value

  return new Intl.DateTimeFormat('es-AR', { ...options, timeZone: 'UTC' }).format(date)
}

/**
 * Formats an instant consistently in SSR and the browser. `Intl.format()` can
 * emit different whitespace characters across runtimes, which is enough to
 * break hydration when this value is rendered in a Client Component.
 */
export function formatArgentinaDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha inválida'

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const valueFor = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  const hour24 = Number(valueFor('hour'))
  const hour12 = hour24 % 12 || 12
  const period = hour24 < 12 ? 'a. m.' : 'p. m.'

  return `${valueFor('day')}/${valueFor('month')}/${valueFor('year')}, ${hour12}:${valueFor('minute')} ${period}`
}

const TIME_ONLY_PATTERN = /^(\d{2}):(\d{2})/

const ARGENTINA_UTC_OFFSET_MS = 3 * 60 * 60 * 1000

/**
 * Instante real (epoch ms) en el que arranca el evento, para comparar contra
 * la hora del dispositivo del invitado (cuenta regresiva, "ya empezó", etc).
 * Argentina no tiene horario de verano, así que UTC-3 es fijo todo el año.
 */
export function getEventStartInstant(eventDate: string, startTime?: string | null) {
  const date = parseEventDate(eventDate)
  if (!date) return null

  const timeMatch = startTime ? TIME_ONLY_PATTERN.exec(startTime) : null
  const hours = timeMatch ? Number(timeMatch[1]) : 0
  const minutes = timeMatch ? Number(timeMatch[2]) : 0

  return date.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000 + ARGENTINA_UTC_OFFSET_MS
}

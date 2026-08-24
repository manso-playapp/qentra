/**
 * Los accesos duran hasta doce horas despues del inicio del evento. Mantener
 * este calculo fuera de las rutas evita que la emision y una reprogramacion
 * terminen con vencimientos distintos.
 */
export function buildInvitationExpiry(eventDate: string, eventStartTime: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate)
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(eventStartTime || '20:00')

  if (!match || !timeMatch) {
    const fallback = new Date()
    fallback.setDate(fallback.getDate() + 7)
    return fallback.toISOString()
  }

  // La agenda de Alista se carga en hora argentina. Construir la fecha de
  // forma explicita evita que el vencimiento cambie segun el huso del server
  // (desarrollo local vs. produccion).
  const [year, month, day] = match.slice(1).map(Number)
  const [hours, minutes, seconds = '0'] = timeMatch.slice(1)
  const eventStartUtc = Date.UTC(year, month - 1, day, Number(hours) + 3, Number(minutes), Number(seconds))

  return new Date(eventStartUtc + 12 * 60 * 60 * 1000).toISOString()
}

/**
 * Un vencimiento inválido no debe bloquear accesos por accidente. La misma
 * comparación se usa en puerta y en las superficies que muestran el QR para
 * que todas cambien de estado en el mismo instante.
 */
export function isInvitationExpired(expiresAt: string | null | undefined, now = new Date()) {
  if (!expiresAt) return false

  const expiry = new Date(expiresAt)
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() <= now.getTime()
}

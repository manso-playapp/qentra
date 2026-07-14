// Utilidades puras de telefono. Sin dependencias server-only (Buffer, fetch,
// llamadas a Twilio/Resend) para poder importarlas tambien desde componentes
// cliente sin arrastrar el modulo de delivery al bundle del navegador.

// Codigo de pais movil por defecto para numeros sin prefijo internacional.
// Argentina es 549 (54 + 9 de movil). Configurable por si cambia el mercado.
const DEFAULT_MOBILE_COUNTRY_CODE =
  process.env.ALISTA_DEFAULT_PHONE_COUNTRY?.trim() ||
  process.env.QENTRA_DEFAULT_PHONE_COUNTRY?.trim() ||
  '549'

/**
 * Lleva un telefono a formato E.164 (+549...).
 *
 * Sin esto, un numero guardado como "3425579221" se enviaba tal cual y Twilio
 * lo interpretaba como +1 (EE.UU.), fallando la entrega. Los numeros que ya
 * vienen en formato internacional (+...) se respetan.
 */
export function toE164(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '')
  }

  let digits = trimmed.replace(/\D/g, '')
  if (digits.startsWith('00')) {
    return '+' + digits.slice(2)
  }
  if (digits.startsWith('0')) {
    digits = digits.slice(1) // prefijo de larga distancia nacional
  }
  if (digits.startsWith('54')) {
    return '+' + digits
  }
  // Sin codigo de pais: asumimos movil del pais por defecto.
  if (digits.startsWith('9')) {
    return '+54' + digits
  }
  return `+${DEFAULT_MOBILE_COUNTRY_CODE}${digits}`
}

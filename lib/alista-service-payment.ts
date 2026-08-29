/** Precio de lanzamiento de la activacion de un evento, en centavos ARS. */
export const ALISTA_SERVICE_ACTIVATION_AMOUNT_CENTS = 8_900_000
export const ALISTA_SERVICE_ACTIVATION_CURRENCY = 'ARS' as const

export type ActivationPaymentStatus =
  | 'created'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'

export function buildActivationPaymentReference(paymentId: string) {
  return `alista_activation_${paymentId}`
}

export function formatAlistaServicePrice(amountCents = ALISTA_SERVICE_ACTIVATION_AMOUNT_CENTS) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: ALISTA_SERVICE_ACTIVATION_CURRENCY,
    maximumFractionDigits: 0,
  }).format(amountCents / 100)
}

/** Importe máximo representable por payment_transactions.amount_cents (Postgres integer). */
export const MAX_GUEST_PAYMENT_AMOUNT_CENTS = 2_147_483_647

/**
 * Calcula el total de un acceso pago: el titular más cada acompañante cuyo
 * nombre fue completado.
 */
export function calculateGuestPaymentAmountCents(
  unitAmountCents: number,
  companionCount: number
) {
  if (!Number.isInteger(unitAmountCents) || unitAmountCents < 0) return 0
  if (!Number.isInteger(companionCount) || companionCount < 0) return unitAmountCents

  return unitAmountCents * (1 + companionCount)
}

export function formatGuestPaymentAmount(amountCents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amountCents / 100)
}

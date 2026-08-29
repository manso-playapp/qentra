import { describe, expect, it } from 'vitest'

import {
  ALISTA_SERVICE_ACTIVATION_AMOUNT_CENTS,
  ALISTA_SERVICE_ACTIVATION_CURRENCY,
  buildActivationPaymentReference,
  formatAlistaServicePrice,
} from './alista-service-payment'

describe('pago del servicio de Alista', () => {
  it('mantiene el precio de lanzamiento en 89.000 pesos', () => {
    expect(ALISTA_SERVICE_ACTIVATION_AMOUNT_CENTS).toBe(8_900_000)
    expect(ALISTA_SERVICE_ACTIVATION_CURRENCY).toBe('ARS')
    expect(formatAlistaServicePrice()).toBe('$ 89.000')
  })

  it('genera una referencia que identifica el intento sin exponer datos sensibles', () => {
    expect(buildActivationPaymentReference('payment-123')).toBe('alista_activation_payment-123')
  })
})

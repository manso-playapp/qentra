import { describe, expect, it } from 'vitest'

import { getCheckoutUrl, mapMercadoPagoPaymentStatus, resolveMercadoPagoConfig } from './mercadopago'

describe('resolveMercadoPagoConfig', () => {
  it('uses the production credential when both environments are configured', () => {
    expect(
      resolveMercadoPagoConfig({ productionAccessToken: ' prod-token ', testAccessToken: ' test-token ' })
    ).toEqual({ accessToken: 'prod-token', mode: 'production' })
  })

  it('uses a test credential only when a production credential is absent', () => {
    expect(resolveMercadoPagoConfig({ testAccessToken: ' test-token ' })).toEqual({
      accessToken: 'test-token',
      mode: 'test',
    })
  })

  it('fails closed when no credential is configured', () => {
    expect(resolveMercadoPagoConfig({})).toBeNull()
  })
})

describe('getCheckoutUrl', () => {
  const preference = {
    init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?prod',
    sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?test',
  }

  it('uses the sandbox URL only in test mode', () => {
    expect(getCheckoutUrl(preference, 'test')).toBe(preference.sandbox_init_point)
  })

  it('uses the production URL in production mode', () => {
    expect(getCheckoutUrl(preference, 'production')).toBe(preference.init_point)
  })
})

describe('mapMercadoPagoPaymentStatus', () => {
  it.each([
    ['approved', 'approved'],
    ['rejected', 'rejected'],
    ['cancelled', 'cancelled'],
    ['refunded', 'refunded'],
    ['in_process', 'pending'],
    [undefined, 'pending'],
  ] as const)('maps Mercado Pago status %s to %s', (providerStatus, transactionStatus) => {
    expect(mapMercadoPagoPaymentStatus(providerStatus)).toBe(transactionStatus)
  })
})

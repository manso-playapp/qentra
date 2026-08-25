import { describe, expect, it } from 'vitest'

import {
  getCheckoutUrl,
  isMercadoPagoPreviewEnvironment,
  mapMercadoPagoPaymentStatus,
  resolveMercadoPagoConfig,
  resolveMercadoPagoMode,
  resolveMercadoPagoOAuthConfig,
} from './mercadopago'

describe('resolveMercadoPagoConfig', () => {
  it('uses the production credential when both environments are configured', () => {
    expect(
      resolveMercadoPagoConfig({ productionAccessToken: ' prod-token ', testAccessToken: ' test-token ' })
    ).toEqual({ accessToken: 'prod-token', mode: 'production' })
  })

  it('forces the test credential in a Vercel Preview deployment', () => {
    expect(
      resolveMercadoPagoConfig({
        productionAccessToken: 'prod-token',
        testAccessToken: 'test-token',
        vercelEnvironment: 'preview',
      })
    ).toEqual({ accessToken: 'test-token', mode: 'test' })
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

describe('Mercado Pago OAuth configuration', () => {
  it('accepts a secure exact callback URL', () => {
    expect(
      resolveMercadoPagoOAuthConfig({
        clientId: ' 123 ',
        clientSecret: ' secret ',
        redirectUri: 'https://alista.com.ar/api/mercadopago/oauth/callback',
      })
    ).toEqual({
      clientId: '123',
      clientSecret: 'secret',
      redirectUri: 'https://alista.com.ar/api/mercadopago/oauth/callback',
    })
  })

  it('fails closed for an insecure or incomplete callback configuration', () => {
    expect(resolveMercadoPagoOAuthConfig({ clientId: '123', clientSecret: 'secret', redirectUri: 'http://localhost:3000/callback' })).toBeNull()
    expect(resolveMercadoPagoOAuthConfig({ clientId: '123', redirectUri: 'https://alista.com.ar/callback' })).toBeNull()
  })

  it('uses the sandbox checkout endpoint in previews without relying on the global collector token', () => {
    expect(resolveMercadoPagoMode('preview')).toBe('test')
    expect(resolveMercadoPagoMode('production')).toBe('production')
    expect(isMercadoPagoPreviewEnvironment('preview')).toBe(true)
    expect(isMercadoPagoPreviewEnvironment('production')).toBe(false)
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

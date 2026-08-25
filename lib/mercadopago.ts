export type MercadoPagoMode = 'production' | 'test'

export type MercadoPagoConfig = {
  accessToken: string
  mode: MercadoPagoMode
}

export type MercadoPagoOAuthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export type PaymentTransactionStatus =
  | 'created'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'refunded'

type MercadoPagoEnvironment = {
  productionAccessToken?: string
  testAccessToken?: string
  vercelEnvironment?: string
}

type MercadoPagoOAuthEnvironment = {
  clientId?: string
  clientSecret?: string
  redirectUri?: string
}

export function resolveMercadoPagoMode(vercelEnvironment = process.env.VERCEL_ENV): MercadoPagoMode {
  return vercelEnvironment === 'preview' ? 'test' : 'production'
}

export function isMercadoPagoPreviewEnvironment(vercelEnvironment = process.env.VERCEL_ENV) {
  return vercelEnvironment === 'preview'
}

/**
 * Preview deployments are hard-pinned to test credentials so they can never
 * create a real charge, even if a production secret was added to Preview by
 * mistake. Production keeps its explicit production-first behavior.
 */
export function resolveMercadoPagoConfig(
  environment: MercadoPagoEnvironment = {
    productionAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    testAccessToken: process.env.MERCADOPAGO_TEST_ACCESS_TOKEN,
    vercelEnvironment: process.env.VERCEL_ENV,
  }
): MercadoPagoConfig | null {
  const productionAccessToken = environment.productionAccessToken?.trim()
  const testAccessToken = environment.testAccessToken?.trim()

  if (environment.vercelEnvironment === 'preview' && testAccessToken) {
    return { accessToken: testAccessToken, mode: 'test' }
  }

  if (productionAccessToken) return { accessToken: productionAccessToken, mode: 'production' }

  if (testAccessToken) return { accessToken: testAccessToken, mode: 'test' }

  return null
}

export function getMercadoPagoConfig() {
  return resolveMercadoPagoConfig()
}

/**
 * Credentials for the Mercado Pago application that lets an event responsible
 * authorize Alista to create preferences in their own account. They are not
 * the collector credentials used by Checkout Pro.
 */
export function resolveMercadoPagoOAuthConfig(
  environment: MercadoPagoOAuthEnvironment = {
    clientId: process.env.MERCADOPAGO_CLIENT_ID,
    clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET,
    redirectUri: process.env.MERCADOPAGO_OAUTH_REDIRECT_URI,
  }
): MercadoPagoOAuthConfig | null {
  const clientId = environment.clientId?.trim()
  const clientSecret = environment.clientSecret?.trim()
  const redirectUri = environment.redirectUri?.trim()

  if (!clientId || !clientSecret || !redirectUri) return null

  try {
    const parsed = new URL(redirectUri)
    if (parsed.protocol !== 'https:') return null
  } catch {
    return null
  }

  return { clientId, clientSecret, redirectUri }
}

export function getMercadoPagoOAuthConfig() {
  return resolveMercadoPagoOAuthConfig()
}

export function getCheckoutUrl(
  preference: { init_point?: string; sandbox_init_point?: string },
  mode: MercadoPagoMode
) {
  return mode === 'test'
    ? preference.sandbox_init_point ?? preference.init_point ?? null
    : preference.init_point ?? null
}

export function mapMercadoPagoPaymentStatus(status?: string): PaymentTransactionStatus {
  switch (status) {
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
      return 'refunded'
    default:
      return 'pending'
  }
}

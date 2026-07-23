export type MercadoPagoMode = 'production' | 'test'

export type MercadoPagoConfig = {
  accessToken: string
  mode: MercadoPagoMode
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

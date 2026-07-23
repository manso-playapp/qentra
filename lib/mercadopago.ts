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
}

/**
 * Production credentials always win. The test token is deliberately an
 * explicit fallback, so a deployment cannot accidentally send a real buyer
 * to a sandbox checkout once its production credential is configured.
 */
export function resolveMercadoPagoConfig(
  environment: MercadoPagoEnvironment = {
    productionAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    testAccessToken: process.env.MERCADOPAGO_TEST_ACCESS_TOKEN,
  }
): MercadoPagoConfig | null {
  const productionAccessToken = environment.productionAccessToken?.trim()
  if (productionAccessToken) return { accessToken: productionAccessToken, mode: 'production' }

  const testAccessToken = environment.testAccessToken?.trim()
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

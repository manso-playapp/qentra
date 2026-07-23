const PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ||
  process.env.ALISTA_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ||
  process.env.QENTRA_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ||
  ''

export function getPublicAppUrl() {
  return PUBLIC_APP_URL
}

type PaymentAppUrlInput = {
  publicAppUrl?: string
  vercelEnvironment?: string
  vercelUrl?: string
}

/**
 * Checkout callbacks must return to the same Preview deployment that created
 * the preference. Vercel exposes that immutable deployment host in
 * `VERCEL_URL`; production continues to use the canonical public URL.
 */
export function resolvePaymentAppUrl({
  publicAppUrl,
  vercelEnvironment,
  vercelUrl,
}: PaymentAppUrlInput) {
  const previewHost = vercelUrl?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  if (vercelEnvironment === 'preview' && previewHost) return `https://${previewHost}`

  return publicAppUrl?.trim().replace(/\/+$/, '') || ''
}

export function getPaymentAppUrl() {
  return resolvePaymentAppUrl({
    publicAppUrl: getPublicAppUrl(),
    vercelEnvironment: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  })
}

export function buildAbsoluteAppUrl(path: string) {
  if (PUBLIC_APP_URL) {
    return new URL(path, `${PUBLIC_APP_URL}/`).toString()
  }

  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).toString()
  }

  return path
}

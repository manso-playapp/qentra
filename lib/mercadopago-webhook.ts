import { createHmac, timingSafeEqual } from 'node:crypto'

type WebhookSignatureInput = {
  signature: string | null
  requestId: string | null
  /** `data.id` is signed only when Mercado Pago includes it in the URL. */
  dataIdFromUrl: string | null
  secret: string
}

export function validMercadoPagoWebhookSignature({
  signature,
  requestId,
  dataIdFromUrl,
  secret,
}: WebhookSignatureInput) {
  if (!signature) return false

  const values = Object.fromEntries(
    signature.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=')
      return [key, rest.join('=')]
    })
  )
  const timestamp = values.ts
  const receivedHash = values.v1
  if (!timestamp || !receivedHash) return false

  // Mercado Pago's signature template omits fields that were not sent. In
  // particular, `data.id` must come from the query string, never the JSON body.
  const manifest = [
    dataIdFromUrl ? `id:${dataIdFromUrl.toLowerCase()};` : '',
    requestId ? `request-id:${requestId};` : '',
    `ts:${timestamp};`,
  ].join('')
  const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex')
  const expected = Buffer.from(expectedHash, 'utf8')
  const received = Buffer.from(receivedHash, 'utf8')

  return expected.length === received.length && timingSafeEqual(expected, received)
}

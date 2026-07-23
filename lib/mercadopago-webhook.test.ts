import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { validMercadoPagoWebhookSignature } from './mercadopago-webhook'

const secret = 'test-webhook-secret'
const timestamp = '1704908010'
const requestId = 'request-123'

function signatureFor(manifest: string) {
  return `ts=${timestamp},v1=${createHmac('sha256', secret).update(manifest).digest('hex')}`
}

describe('validMercadoPagoWebhookSignature', () => {
  it('validates a notification whose data.id was sent in the URL', () => {
    const dataIdFromUrl = 'PAYMENT-ABC'
    const manifest = `id:payment-abc;request-id:${requestId};ts:${timestamp};`

    expect(
      validMercadoPagoWebhookSignature({
        signature: signatureFor(manifest),
        requestId,
        dataIdFromUrl,
        secret,
      })
    ).toBe(true)
  })

  it('omits data.id from the manifest when it was not sent in the URL', () => {
    const manifest = `request-id:${requestId};ts:${timestamp};`

    expect(
      validMercadoPagoWebhookSignature({
        signature: signatureFor(manifest),
        requestId,
        dataIdFromUrl: null,
        secret,
      })
    ).toBe(true)
  })

  it('rejects a signature calculated with a different manifest', () => {
    expect(
      validMercadoPagoWebhookSignature({
        signature: signatureFor(`id:payment-abc;request-id:${requestId};ts:${timestamp};`),
        requestId,
        dataIdFromUrl: null,
        secret,
      })
    ).toBe(false)
  })
})

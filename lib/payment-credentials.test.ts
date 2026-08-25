import { describe, expect, it } from 'vitest'
import { decryptPaymentCredential, encryptPaymentCredential } from './payment-credentials'

const encryptionKey = Buffer.alloc(32, 7).toString('base64')

describe('payment credentials encryption', () => {
  it('round-trips an OAuth secret with authenticated encryption', () => {
    const encrypted = encryptPaymentCredential('APP_USR-sensitive-token', encryptionKey)

    expect(encrypted.ciphertext).not.toContain('APP_USR-sensitive-token')
    expect(decryptPaymentCredential(encrypted, encryptionKey)).toBe('APP_USR-sensitive-token')
  })

  it('rejects modified ciphertext', () => {
    const encrypted = encryptPaymentCredential('refresh-token', encryptionKey)
    const modifiedCiphertext = Buffer.from(encrypted.ciphertext, 'base64')
    modifiedCiphertext[0] ^= 1

    expect(() => decryptPaymentCredential({ ...encrypted, ciphertext: modifiedCiphertext.toString('base64') }, encryptionKey)).toThrow()
  })

  it('requires a 32-byte Base64 key', () => {
    expect(() => encryptPaymentCredential('token', Buffer.alloc(31).toString('base64'))).toThrow(/32 bytes/i)
  })
})

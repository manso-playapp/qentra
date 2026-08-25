import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

export type EncryptedPaymentCredential = {
  ciphertext: string
  iv: string
  authTag: string
}

function resolveEncryptionKey(rawKey = process.env.ALISTA_PAYMENT_CREDENTIALS_ENCRYPTION_KEY) {
  const encoded = rawKey?.trim()
  if (!encoded) return null

  const key = Buffer.from(encoded, 'base64')
  return key.length === 32 ? key : null
}

export function isPaymentCredentialEncryptionConfigured() {
  return Boolean(resolveEncryptionKey())
}

function requireEncryptionKey(rawKey?: string) {
  const key = resolveEncryptionKey(rawKey)
  if (!key) {
    throw new Error('ALISTA_PAYMENT_CREDENTIALS_ENCRYPTION_KEY debe ser una clave aleatoria de 32 bytes codificada en Base64.')
  }

  return key
}

/**
 * OAuth tokens and PKCE verifiers are encrypted before reaching Supabase.
 * The encryption key lives only in the server environment, never in a public
 * environment variable or the Data API.
 */
export function encryptPaymentCredential(value: string, rawKey?: string): EncryptedPaymentCredential {
  const key = requireEncryptionKey(rawKey)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  }
}

export function decryptPaymentCredential(
  encrypted: EncryptedPaymentCredential,
  rawKey?: string
) {
  const key = requireEncryptionKey(rawKey)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

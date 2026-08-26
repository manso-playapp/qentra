import { describe, expect, it } from 'vitest'
import { isAuthRetryableFetchError } from './supabase-auth-errors'

describe('isAuthRetryableFetchError', () => {
  it('recognizes a retryable Supabase network failure', () => {
    const error = new Error('fetch failed')
    error.name = 'AuthRetryableFetchError'

    expect(isAuthRetryableFetchError(error)).toBe(true)
  })

  it('does not hide unrelated errors', () => {
    expect(isAuthRetryableFetchError(new Error('fetch failed'))).toBe(false)
    expect(isAuthRetryableFetchError(new Error('invalid refresh token'))).toBe(false)
  })
})

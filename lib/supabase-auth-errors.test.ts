import { describe, expect, it } from 'vitest'
import { isAuthRetryableFetchError, isInvalidRefreshTokenError } from './supabase-auth-errors'

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

  it('recognizes a serialized retryable auth error', () => {
    expect(
      isAuthRetryableFetchError({
        name: 'AuthRetryableFetchError',
        message: 'Service temporarily unavailable',
        status: 503,
      }),
    ).toBe(true)
  })
})

describe('isInvalidRefreshTokenError', () => {
  it('recognizes Supabase refresh token revocation errors', () => {
    expect(
      isInvalidRefreshTokenError({
        name: 'AuthApiError',
        status: 400,
        code: 'refresh_token_not_found',
      }),
    ).toBe(true)
    expect(
      isInvalidRefreshTokenError({
        name: 'AuthApiError',
        status: 400,
        code: 'refresh_token_already_used',
      }),
    ).toBe(true)
  })

  // Forma real devuelta por la instancia de Supabase del proyecto ante un
  // refresh token muerto: el `code` es el genérico `validation_failed` y el
  // mensaje no dice "invalid refresh token". Si esto no se reconoce, el proxy
  // lanza y toda ruta con sesión vieja responde 500, incluido /acceso.
  it('recognizes the shape Supabase actually returns for a dead token', () => {
    expect(
      isInvalidRefreshTokenError({
        name: 'AuthApiError',
        status: 400,
        code: 'validation_failed',
        message: 'Refresh token is not valid',
      }),
    ).toBe(true)
  })

  it('recognizes the other GoTrue wordings', () => {
    expect(
      isInvalidRefreshTokenError({
        name: 'AuthApiError',
        status: 400,
        message: 'Invalid Refresh Token: Refresh Token Not Found',
      }),
    ).toBe(true)
    expect(
      isInvalidRefreshTokenError({
        name: 'AuthApiError',
        status: 400,
        message: 'Invalid Refresh Token: Already Used',
      }),
    ).toBe(true)
  })

  it('does not hide unrelated auth errors', () => {
    expect(
      isInvalidRefreshTokenError({
        name: 'AuthApiError',
        status: 400,
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
      }),
    ).toBe(false)
    expect(
      isInvalidRefreshTokenError({
        name: 'AuthApiError',
        status: 500,
        message: 'Internal server error',
      }),
    ).toBe(false)
  })
})

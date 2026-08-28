import { isAuthSessionMissingError } from '@supabase/supabase-js'

export function isMissingAuthSessionError(error: unknown) {
  if (isAuthSessionMissingError(error)) {
    return true
  }

  return (
    error instanceof Error &&
    (error.name === 'AuthSessionMissingError' || error.message === 'Auth session missing!')
  )
}

// A refresh can fail before Supabase answers (red intermitente, DNS, VPN). This
// must never authorize a request, but it should not crash a protected page.
export function isAuthRetryableFetchError(error: unknown) {
  if (error instanceof Error && error.name === 'AuthRetryableFetchError') {
    return true
  }

  // Keep this structural fallback for errors crossing a runtime/module
  // boundary (for example, Next.js middleware and the Auth client bundle).
  return isNamedAuthError(error, 'AuthRetryableFetchError')
}

// Una sesión guardada puede quedar muerta (token rotado, revocado, vencido o
// de otro entorno). Eso no es una falla del servidor: hay que tratarlo como
// "no hay sesión" y dejar que el visitante vuelva a entrar.
export function isInvalidRefreshTokenError(error: unknown) {
  if (!isNamedAuthError(error, 'AuthApiError')) {
    return false
  }

  const candidate = error as { code?: unknown; message?: unknown; status?: unknown }

  if (
    candidate.code === 'refresh_token_not_found' ||
    candidate.code === 'refresh_token_already_used'
  ) {
    return true
  }

  // El mensaje varía según la versión de GoTrue ("Invalid Refresh Token: ...",
  // "Refresh token is not valid") y el `code` puede llegar como el genérico
  // `validation_failed`, así que no alcanza con enumerar códigos. Cualquier 400
  // de la API de auth que hable del refresh token es una sesión muerta.
  return (
    candidate.status === 400 &&
    typeof candidate.message === 'string' &&
    /refresh token/i.test(candidate.message)
  )
}

function isNamedAuthError(error: unknown, name: string) {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  return (error as { name?: unknown }).name === name
}

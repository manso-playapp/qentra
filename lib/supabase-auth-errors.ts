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
  return (
    error instanceof Error &&
    error.name === 'AuthRetryableFetchError' &&
    error.message === 'fetch failed'
  )
}

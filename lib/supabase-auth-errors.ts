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

import { timingSafeEqual } from 'node:crypto'
import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { isMissingAuthSessionError } from '@/lib/supabase-auth-errors'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export type AppRole = 'admin' | 'door' | 'security_supervisor'

export type OperatorProfile = {
  user_id: string
  full_name?: string | null
  roles: AppRole[]
  active: boolean
  created_at: string
  updated_at: string
}

type AuthorizedPageAccessResult =
  | {
      ok: true
      user: User
      operatorProfile: OperatorProfile
    }
  | {
      ok: false
      reason: 'missing_profile' | 'inactive_profile' | 'missing_role'
    }

function getSecurityOverridePin() {
  return process.env.QENTRA_SECURITY_OVERRIDE_PIN?.trim() ?? ''
}

function getSecuritySupervisorPin() {
  return process.env.QENTRA_SECURITY_SUPERVISOR_PIN?.trim() ?? ''
}

function safeCompareStrings(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function normalizeRoles(value: unknown): AppRole[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((role): role is AppRole =>
    role === 'admin' || role === 'door' || role === 'security_supervisor'
  )
}

export function sanitizeNextPath(value: string | null | undefined, fallback = '/admin') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  return value
}

function hasRequiredRole(profile: OperatorProfile, allowedRoles: readonly AppRole[]) {
  return profile.roles.some((role) => allowedRoles.includes(role))
}

async function getCurrentAuthState() {
  const supabase = await createServerSupabaseClient()
  let user: User | null = null

  try {
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      if (isMissingAuthSessionError(userError)) {
        return {
          user: null,
          operatorProfile: null,
        }
      }

      throw userError
    }

    user = authUser
  } catch (error) {
    if (isMissingAuthSessionError(error)) {
      return {
        user: null,
        operatorProfile: null,
      }
    }

    throw error
  }

  if (!user) {
    return {
      user: null,
      operatorProfile: null,
    }
  }

  const { data: profileData, error: profileError } = await supabase
    .from('operator_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profileData) {
    return {
      user,
      operatorProfile: null,
    }
  }

  return {
    user,
    operatorProfile: {
      ...(profileData as Omit<OperatorProfile, 'roles'> & { roles: unknown }),
      roles: normalizeRoles((profileData as { roles: unknown }).roles),
    } satisfies OperatorProfile,
  }
}

export function isSecurityOverrideConfigured() {
  return Boolean(getSecurityOverridePin())
}

export function verifySecurityOverridePin(candidate: string) {
  const expectedPin = getSecurityOverridePin()

  if (!expectedPin) {
    return false
  }

  return safeCompareStrings(candidate, expectedPin)
}

export function isSecuritySupervisorPinConfigured() {
  return Boolean(getSecuritySupervisorPin())
}

export function verifySecuritySupervisorPin(candidate: string) {
  const expectedPin = getSecuritySupervisorPin()

  if (!expectedPin) {
    return false
  }

  return safeCompareStrings(candidate, expectedPin)
}

export async function getCurrentOperatorProfile() {
  return getCurrentAuthState()
}

export async function requireAuthorizedPageAccess(
  nextPath: string,
  allowedRoles: readonly AppRole[]
): Promise<AuthorizedPageAccessResult> {
  const authState = await getCurrentAuthState()

  if (!authState.user) {
    redirect(`/acceso?next=${encodeURIComponent(nextPath)}`)
  }

  if (!authState.operatorProfile) {
    return { ok: false, reason: 'missing_profile' }
  }

  if (!authState.operatorProfile.active) {
    return { ok: false, reason: 'inactive_profile' }
  }

  if (!hasRequiredRole(authState.operatorProfile, allowedRoles)) {
    return { ok: false, reason: 'missing_role' }
  }

  return {
    ok: true,
    user: authState.user,
    operatorProfile: authState.operatorProfile,
  }
}

export async function ensureAuthorizedApiAccess(allowedRoles: readonly AppRole[]) {
  const authState = await getCurrentAuthState()

  if (!authState.user) {
    return {
      response: Response.json({ error: 'Unauthorized.' }, { status: 401 }),
      auth: null,
    }
  }

  if (!authState.operatorProfile) {
    return {
      response: Response.json({ error: 'Operator profile not found.' }, { status: 403 }),
      auth: null,
    }
  }

  if (!authState.operatorProfile.active) {
    return {
      response: Response.json({ error: 'Operator profile inactive.' }, { status: 403 }),
      auth: null,
    }
  }

  if (!hasRequiredRole(authState.operatorProfile, allowedRoles)) {
    return {
      response: Response.json({ error: 'Insufficient role.' }, { status: 403 }),
      auth: null,
    }
  }

  return {
    response: null,
    auth: {
      user: authState.user,
      operatorProfile: authState.operatorProfile,
    },
  }
}

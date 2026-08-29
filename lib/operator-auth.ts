import { timingSafeEqual } from 'node:crypto'
import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import {
  isAuthRetryableFetchError,
  isInvalidRefreshTokenError,
  isMissingAuthSessionError,
} from '@/lib/supabase-auth-errors'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  canManageEvent,
  hasGlobalOperationalAccess,
  isAlistaStaff,
  isBlockedOperator,
  normalizeRoles,
  type AccountAccess,
  type AppRole,
} from '@/lib/event-access'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { readViewAsUserId } from '@/lib/impersonation'

/** Quién mira y a quién, cuando el equipo de Alista activó "ver como". */
export type ViewingAs = {
  targetUserId: string
  targetEmail: string | null
  realEmail: string | null
} | null

export type { AppRole } from '@/lib/event-access'

export type OperatorProfile = {
  user_id: string
  full_name?: string | null
  roles: AppRole[]
  /** Eventos a los que fue invitado (tabla `event_admin_assignments`). */
  event_ids: string[]
  active: boolean
  created_at: string
  updated_at: string
}

/**
 * Identidad de quien llama. `operatorProfile` en `null` es un **cliente**: una
 * persona autenticada que no pertenece al equipo de Alista y cuya autorización
 * viene de ser dueña de sus eventos, no de un rol.
 */
export type Account = {
  user: User
  operatorProfile: OperatorProfile | null
  /** Propios (`events.owner_user_id`) más asignados. */
  manageableEventIds: string[]
  access: AccountAccess
}

type AuthorizedPageAccessResult =
  | {
      ok: true
      user: User
      operatorProfile: OperatorProfile
    }
  | {
      ok: false
      reason: 'missing_profile' | 'inactive_profile' | 'missing_role' | 'missing_event_access'
    }

type AuthorizedEventPageAccessResult =
  | {
      ok: true
      user: User
      account: Account
      viewingAs: ViewingAs
    }
  | {
      ok: false
      reason: 'missing_profile' | 'inactive_profile' | 'missing_role' | 'missing_event_access'
    }

function getSecurityOverridePin() {
  return (
    process.env.ALISTA_SECURITY_OVERRIDE_PIN?.trim() ??
    process.env.QENTRA_SECURITY_OVERRIDE_PIN?.trim() ??
    ''
  )
}

function getSecuritySupervisorPin() {
  return (
    process.env.ALISTA_SECURITY_SUPERVISOR_PIN?.trim() ??
    process.env.QENTRA_SECURITY_SUPERVISOR_PIN?.trim() ??
    ''
  )
}

function safeCompareStrings(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
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

/**
 * Durante un despliegue la aplicacion puede arrancar unos segundos antes que la
 * migracion. PostgREST responde PGRST205 cuando la tabla no esta en su cache de
 * esquema, y 42P01 cuando la consulta llega a Postgres.
 */
function isMissingTableError(code: string | undefined) {
  return code === 'PGRST205' || code === '42P01'
}

function toAccountAccess(
  operatorProfile: OperatorProfile | null,
  manageableEventIds: readonly string[]
): AccountAccess {
  return {
    operator: operatorProfile
      ? { roles: operatorProfile.roles, active: operatorProfile.active }
      : null,
    manageableEventIds,
  }
}

/** Estado sin sesion: ni cliente ni operador. */
function anonymousAuthState() {
  return {
    user: null,
    operatorProfile: null,
    manageableEventIds: [] as string[],
    access: toAccountAccess(null, []),
  }
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
      if (
        isMissingAuthSessionError(userError) ||
        isAuthRetryableFetchError(userError) ||
        isInvalidRefreshTokenError(userError)
      ) {
        return anonymousAuthState()
      }

      throw userError
    }

    user = authUser
  } catch (error) {
    if (
      isMissingAuthSessionError(error) ||
      isAuthRetryableFetchError(error) ||
      isInvalidRefreshTokenError(error)
    ) {
      return anonymousAuthState()
    }

    throw error
  }

  if (!user) {
    return anonymousAuthState()
  }

  const [
    { data: profileData, error: profileError },
    { data: assignmentsData, error: assignmentsError },
    { data: ownedData, error: ownedError },
  ] = await Promise.all([
    supabase.from('operator_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('event_admin_assignments').select('event_id').eq('user_id', user.id),
    supabase.from('events').select('id').eq('owner_user_id', user.id),
  ])

  if (profileError) {
    throw profileError
  }

  // Solo toleramos la tabla inexistente; cualquier otro error de autorizacion
  // debe seguir siendo visible.
  if (assignmentsError && !isMissingTableError(assignmentsError.code)) {
    throw assignmentsError
  }

  // Misma tolerancia para la columna `owner_user_id`: 42703 es la respuesta de
  // Postgres a una columna inexistente.
  if (ownedError && ownedError.code !== '42703' && !isMissingTableError(ownedError.code)) {
    throw ownedError
  }

  const assignedEventIds = (assignmentsData ?? []).map((assignment) => assignment.event_id as string)
  const ownedEventIds = (ownedData ?? []).map((event) => event.id as string)
  const manageableEventIds = Array.from(new Set([...ownedEventIds, ...assignedEventIds]))

  // Sin fila en `operator_profiles` la persona no es del equipo de Alista: es un
  // cliente. Su autorización viene de ser dueña de sus eventos, no de un rol.
  const operatorProfile: OperatorProfile | null = profileData
    ? ({
        ...(profileData as Omit<OperatorProfile, 'roles'> & { roles: unknown }),
        roles: normalizeRoles((profileData as { roles: unknown }).roles),
        event_ids: assignedEventIds,
      } satisfies OperatorProfile)
    : null

  return {
    user,
    operatorProfile,
    manageableEventIds,
    access: toAccountAccess(operatorProfile, manageableEventIds),
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

/**
 * La identidad con la que se RENDERIZA el panel.
 *
 * Normalmente es la sesión real. Cuando el equipo de Alista activó "ver como",
 * devuelve el estado de la cuenta mirada: sus eventos, su perfil (o la ausencia
 * de perfil, que es lo normal en una clienta) y, por lo tanto, exactamente las
 * secciones que esa persona ve.
 *
 * La lente solo se aplica si la sesión REAL es staff. Las APIs siguen
 * autorizando con `getCurrentAuthState`, así que mirar no degrada la capacidad
 * de soporte: cambia el punto de vista, no los permisos.
 */
/** La sesión real, sin lente. Solo para decidir quién puede activar "ver como". */
export async function getRealAuthState() {
  return getCurrentAuthState()
}

export async function getViewerAuthState() {
  const real = await getCurrentAuthState()

  if (!real.user || !isAlistaStaff(real.access)) {
    return { ...real, viewingAs: null }
  }

  const targetUserId = await readViewAsUserId()
  if (!targetUserId || targetUserId === real.user.id) {
    return { ...real, viewingAs: null }
  }

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return { ...real, viewingAs: null }
  }

  const { data: targetUserData, error: targetUserError } = await adminClient.auth.admin.getUserById(
    targetUserId
  )
  const targetUser = targetUserError ? null : targetUserData?.user ?? null

  // La cuenta mirada dejó de existir: se sigue de largo con la sesión real en
  // lugar de dejar el panel en un estado que no corresponde a nadie.
  if (!targetUser) {
    return { ...real, viewingAs: null }
  }

  const [{ data: profileData }, { data: assignmentsData }, { data: ownedData }] = await Promise.all([
    adminClient.from('operator_profiles').select('*').eq('user_id', targetUser.id).maybeSingle(),
    adminClient.from('event_admin_assignments').select('event_id').eq('user_id', targetUser.id),
    adminClient.from('events').select('id').eq('owner_user_id', targetUser.id),
  ])

  const assignedEventIds = (assignmentsData ?? []).map((assignment) => assignment.event_id as string)
  const ownedEventIds = (ownedData ?? []).map((event) => event.id as string)
  const manageableEventIds = Array.from(new Set([...ownedEventIds, ...assignedEventIds]))

  const operatorProfile: OperatorProfile | null = profileData
    ? ({
        ...(profileData as Omit<OperatorProfile, 'roles'> & { roles: unknown }),
        roles: normalizeRoles((profileData as { roles: unknown }).roles),
        event_ids: assignedEventIds,
      } satisfies OperatorProfile)
    : null

  return {
    user: targetUser,
    operatorProfile,
    manageableEventIds,
    access: toAccountAccess(operatorProfile, manageableEventIds),
    viewingAs: {
      targetUserId: targetUser.id,
      targetEmail: targetUser.email ?? null,
      realEmail: real.user.email ?? null,
    },
  }
}

export async function getCurrentOperatorProfile() {
  return getViewerAuthState()
}

export async function requireAuthorizedPageAccess(
  nextPath: string,
  allowedRoles: readonly AppRole[]
): Promise<AuthorizedPageAccessResult> {
  // Con la lente puesta, las secciones del equipo se cierran igual que para la
  // cuenta mirada. Si esta puerta leyera la sesión real, "ver como" mostraría un
  // panel que mezcla dos personas: sus eventos, pero las herramientas de Alista.
  const authState = await getViewerAuthState()

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
  const authState = await getViewerAuthState()

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

export function isGlobalAdmin(profile: OperatorProfile) {
  return profile.roles.includes('admin')
}

/**
 * Acceso al panel para cualquier persona autenticada, tenga o no perfil de
 * operador. Es la puerta del panel para una clienta: lo que ve adentro lo
 * decide su acceso a cada evento, no un rol.
 */
export async function requireAuthenticatedPageAccess(
  nextPath: string
): Promise<
  | { ok: true; user: User; account: Account; viewingAs: ViewingAs }
  | { ok: false; reason: 'inactive_profile' }
> {
  const authState = await getViewerAuthState()

  if (!authState.user) {
    redirect(`/acceso?next=${encodeURIComponent(nextPath)}`)
  }

  if (isBlockedOperator(authState.access)) {
    return { ok: false, reason: 'inactive_profile' }
  }

  return {
    ok: true,
    user: authState.user,
    account: toAccount({ ...authState, user: authState.user }),
    viewingAs: authState.viewingAs,
  }
}

/**
 * Cualquier persona autenticada, tenga o no perfil de operador.
 *
 * Es la puerta del self-serve: sirve para listar los eventos propios y para
 * crear uno nuevo. No autoriza nada sobre un evento en particular — para eso
 * esta `ensureAuthorizedEventApiAccess`.
 */
export async function ensureAuthenticatedApiAccess() {
  const authState = await getViewerAuthState()

  if (!authState.user) {
    return {
      response: Response.json({ error: 'Unauthorized.' }, { status: 401 }),
      auth: null,
    }
  }

  if (isBlockedOperator(authState.access)) {
    return {
      response: Response.json({ error: 'Operator profile inactive.' }, { status: 403 }),
      auth: null,
    }
  }

  return {
    response: null,
    auth: toAccount({ ...authState, user: authState.user }),
  }
}

function toAccount(authState: Awaited<ReturnType<typeof getCurrentAuthState>> & { user: User }): Account {
  return {
    user: authState.user,
    operatorProfile: authState.operatorProfile,
    manageableEventIds: authState.manageableEventIds,
    access: authState.access,
  }
}

/**
 * Acceso a la pagina de un evento.
 *
 * A diferencia de `requireAuthorizedPageAccess`, **no exige rol de operador**:
 * autoriza por acceso al evento. Una clienta duena de su fiesta entra sin tener
 * fila en `operator_profiles`, que es el punto de todo el self-serve.
 */
export async function requireAuthorizedEventPageAccess(
  nextPath: string,
  eventId: string
): Promise<AuthorizedEventPageAccessResult> {
  // Página: mira con la lente. Si el staff está viendo como una clienta, un
  // evento ajeno a ella queda fuera, igual que le pasaría a ella.
  const authState = await getViewerAuthState()

  if (!authState.user) {
    redirect(`/acceso?next=${encodeURIComponent(nextPath)}`)
  }

  if (isBlockedOperator(authState.access)) {
    return { ok: false, reason: 'inactive_profile' }
  }

  if (!canManageEvent(authState.access, eventId)) {
    return { ok: false, reason: 'missing_event_access' }
  }

  return {
    ok: true,
    user: authState.user,
    account: toAccount({ ...authState, user: authState.user }),
    viewingAs: authState.viewingAs,
  }
}

/**
 * Acceso por API a un evento. Autoriza por acceso al evento, no por rol.
 *
 * `allowedRoles` sigue existiendo para los roles operativos globales: `door` y
 * `security_supervisor` valen sobre cualquier evento cuando la ruta los permite.
 * Es lo que mantiene funcionando la puerta y el totem, y se conserva tal cual.
 */
export async function ensureAuthorizedEventApiAccess(
  eventId: string,
  allowedRoles: readonly AppRole[] = ['admin']
) {
  const authState = await getViewerAuthState()

  if (!authState.user) {
    return {
      response: Response.json({ error: 'Unauthorized.' }, { status: 401 }),
      auth: null,
    }
  }

  if (isBlockedOperator(authState.access)) {
    return {
      response: Response.json({ error: 'Operator profile inactive.' }, { status: 403 }),
      auth: null,
    }
  }

  const allowed =
    hasGlobalOperationalAccess(authState.access, allowedRoles) ||
    canManageEvent(authState.access, eventId)

  if (!allowed) {
    return {
      response: Response.json({ error: 'No tenes acceso a este evento.' }, { status: 403 }),
      auth: null,
    }
  }

  return {
    response: null,
    auth: toAccount({ ...authState, user: authState.user }),
  }
}

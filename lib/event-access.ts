/**
 * Decisión de acceso a eventos, sin dependencias de Supabase ni de red.
 *
 * Espeja deliberadamente a `can_manage_event()` de la base
 * (`supabase/migrations/20260828120000_add_event_admin_assignments.sql`):
 *
 *   soy staff de Alista  O  el evento es mío  O  me invitaron a él
 *
 * Que las dos capas digan lo mismo es lo que hace sostenible el modelo: el panel
 * admin usa `service_role` y saltea RLS, así que si esta lógica y la de la base
 * divergen, el candado real deja de ser el que creemos.
 */

export type AppRole = 'admin' | 'event_admin' | 'door' | 'security_supervisor'

export const APP_ROLES: readonly AppRole[] = ['admin', 'event_admin', 'door', 'security_supervisor']

/**
 * Quién está llamando, reducido a lo necesario para decidir.
 *
 * `operator` en `null` significa **cliente**: una persona autenticada que no
 * forma parte del equipo de Alista. Es el caso normal del self-serve —la madre
 * que organiza su fiesta— y no debe tener perfil de operador.
 */
export type AccountAccess = {
  operator: { roles: readonly AppRole[]; active: boolean } | null
  /** Eventos que administra: los propios más aquellos a los que fue invitada. */
  manageableEventIds: readonly string[]
}

export function normalizeRoles(value: unknown): AppRole[] {
  if (!Array.isArray(value)) return []
  return value.filter((role): role is AppRole => APP_ROLES.includes(role as AppRole))
}

/**
 * Un operador dado de baja queda bloqueado por completo, incluso sobre eventos
 * propios. Un cliente nunca está bloqueado: no tiene perfil que desactivar.
 */
export function isBlockedOperator(account: AccountAccess): boolean {
  return account.operator !== null && !account.operator.active
}

/** Equipo interno de Alista. Ver la decisión sobre soporte en `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` §3. */
export function isAlistaStaff(account: AccountAccess): boolean {
  return !isBlockedOperator(account) && (account.operator?.roles.includes('admin') ?? false)
}

/** ¿Tiene alguno de estos roles de operador? Un cliente nunca los tiene. */
export function hasOperatorRole(account: AccountAccess, allowedRoles: readonly AppRole[]): boolean {
  if (isBlockedOperator(account) || !account.operator) return false
  return account.operator.roles.some((role) => allowedRoles.includes(role))
}

/** ¿Puede administrar este evento? Es el espejo de `can_manage_event()`. */
export function canManageEvent(account: AccountAccess, eventId: string): boolean {
  if (isBlockedOperator(account)) return false
  return isAlistaStaff(account) || account.manageableEventIds.includes(eventId)
}

/**
 * `door` y `security_supervisor` son roles operativos globales: valen sobre
 * cualquier evento sin necesidad de asignación. Es el comportamiento que hoy
 * mantiene funcionando la puerta y el tótem, y se conserva tal cual.
 */
export function hasGlobalOperationalAccess(
  account: AccountAccess,
  allowedRoles: readonly AppRole[]
): boolean {
  const operationalRoles = allowedRoles.filter((role) => role !== 'admin' && role !== 'event_admin')
  return operationalRoles.length > 0 && hasOperatorRole(account, operationalRoles)
}

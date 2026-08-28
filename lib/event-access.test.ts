import { describe, expect, it } from 'vitest'

import {
  canManageEvent,
  hasGlobalOperationalAccess,
  hasOperatorRole,
  isAlistaStaff,
  isBlockedOperator,
  normalizeRoles,
  type AccountAccess,
  type AppRole,
} from './event-access'

const MY_EVENT = 'evento-propio'
const OTHER_EVENT = 'evento-ajeno'

/** Clienta: autenticada, sin perfil de operador. El caso normal del self-serve. */
function customer(manageableEventIds: string[] = []): AccountAccess {
  return { operator: null, manageableEventIds }
}

function operator(roles: AppRole[], manageableEventIds: string[] = [], active = true): AccountAccess {
  return { operator: { roles, active }, manageableEventIds }
}

describe('normalizeRoles', () => {
  it('descarta cualquier valor que no sea un rol conocido', () => {
    expect(normalizeRoles(['admin', 'superuser', 42, null, 'door'])).toEqual(['admin', 'door'])
  })

  it('devuelve vacio si no es un array', () => {
    expect(normalizeRoles(undefined)).toEqual([])
    expect(normalizeRoles('admin')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Criterios de aceptacion del frente "cliente como identidad valida".
// ---------------------------------------------------------------------------

describe('criterio 1 — la duena sin perfil de operador administra su evento', () => {
  it('permite el evento propio', () => {
    expect(canManageEvent(customer([MY_EVENT]), MY_EVENT)).toBe(true)
  })

  it('no necesita ningun rol para lograrlo', () => {
    const account = customer([MY_EVENT])
    expect(isAlistaStaff(account)).toBe(false)
    expect(hasOperatorRole(account, ['admin', 'event_admin'])).toBe(false)
    expect(canManageEvent(account, MY_EVENT)).toBe(true)
  })
})

describe('criterio 2 — nadie alcanza un evento ajeno', () => {
  it('bloquea a una clienta sobre un evento que no es suyo', () => {
    expect(canManageEvent(customer([MY_EVENT]), OTHER_EVENT)).toBe(false)
  })

  it('bloquea a una clienta sin eventos', () => {
    expect(canManageEvent(customer(), MY_EVENT)).toBe(false)
  })

  it('bloquea a un event_admin sobre un evento al que no fue invitado', () => {
    expect(canManageEvent(operator(['event_admin'], [MY_EVENT]), OTHER_EVENT)).toBe(false)
  })
})

describe('criterio 3 — el equipo invitado por la duena entra', () => {
  it('permite el evento asignado, tenga o no perfil de operador', () => {
    expect(canManageEvent(customer([OTHER_EVENT]), OTHER_EVENT)).toBe(true)
    expect(canManageEvent(operator(['event_admin'], [OTHER_EVENT]), OTHER_EVENT)).toBe(true)
  })
})

describe('criterio 4 — los roles operativos conservan el acceso de hoy', () => {
  it('el staff de Alista alcanza cualquier evento sin asignacion', () => {
    const staff = operator(['admin'])
    expect(isAlistaStaff(staff)).toBe(true)
    expect(canManageEvent(staff, OTHER_EVENT)).toBe(true)
  })

  it('door y security_supervisor valen globalmente donde la ruta los permite', () => {
    const door = operator(['door'])
    const supervisor = operator(['security_supervisor'])
    const roles: AppRole[] = ['admin', 'door', 'security_supervisor']

    expect(hasGlobalOperationalAccess(door, roles)).toBe(true)
    expect(hasGlobalOperationalAccess(supervisor, roles)).toBe(true)
    // Sin asignacion no "administran" el evento: pasan por el atajo operativo.
    expect(canManageEvent(door, OTHER_EVENT)).toBe(false)
  })

  it('el atajo operativo no aplica en rutas que solo permiten admin', () => {
    expect(hasGlobalOperationalAccess(operator(['door']), ['admin'])).toBe(false)
  })

  it('event_admin nunca es un rol global: siempre necesita el evento', () => {
    const eventAdmin = operator(['event_admin'], [MY_EVENT])
    expect(hasGlobalOperationalAccess(eventAdmin, ['admin', 'event_admin'])).toBe(false)
    expect(canManageEvent(eventAdmin, OTHER_EVENT)).toBe(false)
  })

  it('una clienta nunca obtiene el atajo operativo', () => {
    expect(hasGlobalOperationalAccess(customer([MY_EVENT]), ['admin', 'door'])).toBe(false)
  })
})

describe('criterio 5 — un operador dado de baja queda bloqueado', () => {
  it('no alcanza ni siquiera sus propios eventos', () => {
    const suspended = operator(['admin', 'event_admin'], [MY_EVENT], false)
    expect(isBlockedOperator(suspended)).toBe(true)
    expect(isAlistaStaff(suspended)).toBe(false)
    expect(canManageEvent(suspended, MY_EVENT)).toBe(false)
    expect(hasOperatorRole(suspended, ['admin'])).toBe(false)
  })

  it('tampoco conserva el atajo de puerta', () => {
    expect(hasGlobalOperationalAccess(operator(['door'], [], false), ['admin', 'door'])).toBe(false)
  })

  it('una clienta no tiene perfil que desactivar: nunca esta bloqueada', () => {
    expect(isBlockedOperator(customer([MY_EVENT]))).toBe(false)
  })
})

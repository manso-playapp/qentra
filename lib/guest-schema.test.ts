import { describe, expect, it } from 'vitest'
import { mapGuestStatusToDb, normalizeGuestStatus, resolveNextDbStatus } from './guest-schema'

describe('resolveNextDbStatus — el vocabulario corto no degrada el estado real', () => {
  // El panel edita en 4 estados y la base tiene 7. Sin esta regla, guardar el
  // teléfono de un invitado con la invitación ya emitida lo devolvía a
  // "sin invitación", porque `link_sent` se muestra y se reenvía como "pending".
  it('conserva link_sent cuando el estado corto sigue siendo pending', () => {
    expect(resolveNextDbStatus('link_sent', 'pending')).toBe('link_sent')
  })

  it('conserva registered cuando el estado corto sigue siendo confirmed', () => {
    expect(resolveNextDbStatus('registered', 'confirmed')).toBe('registered')
  })

  it('conserva duplicate cuando el estado corto sigue siendo cancelled', () => {
    expect(resolveNextDbStatus('duplicate', 'cancelled')).toBe('duplicate')
  })

  it('escribe el estado nuevo cuando la persona sí eligió otro', () => {
    expect(resolveNextDbStatus('link_sent', 'confirmed')).toBe('enabled')
    expect(resolveNextDbStatus('enabled', 'checked_in')).toBe('checked_in')
    expect(resolveNextDbStatus('checked_in', 'confirmed')).toBe('enabled')
    expect(resolveNextDbStatus('enabled', 'cancelled')).toBe('rejected')
  })

  it('sin estado previo cae en la traducción directa', () => {
    expect(resolveNextDbStatus(null, 'pending')).toBe('preinvited')
    expect(resolveNextDbStatus(undefined, 'confirmed')).toBe('enabled')
  })

  it('un estado desconocido no se conserva: se normaliza', () => {
    expect(resolveNextDbStatus('lo_que_sea', 'pending')).toBe('preinvited')
  })

  it.each(['preinvited', 'link_sent', 'registered', 'enabled', 'checked_in', 'rejected', 'duplicate'] as const)(
    'guardar sin cambiar el estado deja %s intacto',
    (dbStatus) => {
      expect(resolveNextDbStatus(dbStatus, normalizeGuestStatus(dbStatus))).toBe(dbStatus)
    }
  )

  it('mapGuestStatusToDb sigue siendo la traducción sin contexto', () => {
    expect(mapGuestStatusToDb('pending')).toBe('preinvited')
    expect(mapGuestStatusToDb('confirmed')).toBe('enabled')
  })
})

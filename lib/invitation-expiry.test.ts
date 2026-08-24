import { describe, expect, it } from 'vitest'

import { buildInvitationExpiry, isInvitationExpired } from './invitation-expiry'

describe('buildInvitationExpiry', () => {
  it('vence doce horas despues del inicio del evento', () => {
    expect(buildInvitationExpiry('2026-08-16', '22:00')).toBe('2026-08-17T13:00:00.000Z')
  })

  it('uses 20:00 when no se informa hora de inicio', () => {
    expect(buildInvitationExpiry('2026-08-16', '')).toBe('2026-08-17T11:00:00.000Z')
  })
})

describe('isInvitationExpired', () => {
  const expiry = '2026-08-17T11:30:00.000Z'

  it('permanece vigente antes del vencimiento', () => {
    expect(isInvitationExpired(expiry, new Date('2026-08-17T11:29:59.999Z'))).toBe(false)
  })

  it('vence exactamente en el instante configurado', () => {
    expect(isInvitationExpired(expiry, new Date(expiry))).toBe(true)
  })

  it('ignora fechas inválidas para mantener el comportamiento fail-open existente', () => {
    expect(isInvitationExpired('not-a-date', new Date('2026-08-18T00:00:00.000Z'))).toBe(false)
  })
})

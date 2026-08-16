import { describe, expect, it } from 'vitest'

import { buildInvitationExpiry } from './invitation-expiry'

describe('buildInvitationExpiry', () => {
  it('vence doce horas despues del inicio del evento', () => {
    expect(buildInvitationExpiry('2026-08-16', '22:00')).toBe('2026-08-17T13:00:00.000Z')
  })

  it('uses 20:00 when no se informa hora de inicio', () => {
    expect(buildInvitationExpiry('2026-08-16', '')).toBe('2026-08-17T11:00:00.000Z')
  })
})

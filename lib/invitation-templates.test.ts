import { describe, expect, it } from 'vitest'
import { getInvitationTemplate, normalizeInvitationTemplate } from './invitation-templates'

describe('invitation templates', () => {
  it('keeps Viaje as the fallback for existing events', () => {
    expect(getInvitationTemplate(null)).toBe('travel')
    expect(getInvitationTemplate({})).toBe('travel')
  })

  it('accepts the new Noche template', () => {
    expect(getInvitationTemplate({ template: 'midnight' })).toBe('midnight')
  })

  it('rejects unknown template keys', () => {
    expect(normalizeInvitationTemplate('beach')).toBe('travel')
  })
})

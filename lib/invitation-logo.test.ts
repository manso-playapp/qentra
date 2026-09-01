import { describe, expect, it } from 'vitest'
import { normalizeInvitationLogo } from './invitation-logo'

describe('invitation text logo', () => {
  it('keeps safe styling values and trims the text', () => {
    expect(normalizeInvitationLogo({ text: '  Eva  ', font: 'playfair', size: 120, letterSpacing: -1, color: '#AB12CD' })).toEqual({
      text: 'Eva',
      font: 'playfair',
      size: 96,
      letterSpacing: -0.05,
      color: '#AB12CD',
    })
  })

  it('ignores invalid values', () => {
    expect(normalizeInvitationLogo({ text: 42, font: 'comic', size: 'large', color: 'red' })).toEqual({})
  })
})

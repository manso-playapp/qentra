import { describe, expect, it } from 'vitest'
import { normalizeOwnershipEmail } from '@/lib/event-ownership'

describe('normalizeOwnershipEmail', () => {
  it('trims and lowercases a valid email', () => {
    expect(normalizeOwnershipEmail('  Madre@Gmail.com ')).toBe('madre@gmail.com')
  })

  it('accepts common email characters', () => {
    expect(normalizeOwnershipEmail('madre+fiesta@gmail.com')).toBe('madre+fiesta@gmail.com')
  })

  it.each([null, undefined, '', '   ', 'madre', 'madre@', '@gmail.com', 'madre @gmail.com'])(
    'rejects %j',
    (value) => {
      expect(normalizeOwnershipEmail(value)).toBeNull()
    }
  )
})

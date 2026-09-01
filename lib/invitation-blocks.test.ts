import { describe, expect, it } from 'vitest'
import { getInvitationBlockOrder, normalizeInvitationBlocks } from './invitation-blocks'

describe('invitation block order', () => {
  it('keeps the configured order and appends missing supported blocks', () => {
    expect(getInvitationBlockOrder({ order: ['gift', 'gift', 'unknown' as never] }, ['personal', 'gift', 'actions'])).toEqual(['gift', 'personal', 'actions'])
  })

  it('normalizes order without allowing unknown keys into persisted config', () => {
    expect(normalizeInvitationBlocks({ order: ['audio', 'nope', 'audio'], audio: { visible: true } })).toEqual({
      order: ['audio'],
      audio: { visible: true },
    })
  })
})

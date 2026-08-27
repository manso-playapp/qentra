import { describe, expect, it } from 'vitest'
import {
  buildInvitationConfigEnvelope,
  getDraftInvitationConfig,
  getInvitationConfigHistory,
  getPublishedInvitationConfig,
} from './invitation-config-state'

describe('invitation config state', () => {
  it('keeps legacy configs public while editing a draft', () => {
    const legacy = { template: 'travel', colors: { accent: '#abcabc' } }
    const envelope = buildInvitationConfigEnvelope({ current: legacy, draft: { ...legacy, template: 'midnight' }, publish: false })

    expect(getPublishedInvitationConfig(envelope)).toEqual(legacy)
    expect(getDraftInvitationConfig(envelope)).toEqual({ ...legacy, template: 'midnight' })
  })

  it('publishes the draft only when explicitly requested', () => {
    const envelope = buildInvitationConfigEnvelope({
      current: { published: { template: 'travel' }, draft: { template: 'travel' } },
      draft: { template: 'midnight' },
      publish: true,
    })

    expect(getPublishedInvitationConfig(envelope)).toEqual({ template: 'midnight' })
  })

  it('keeps at most ten valid history entries without affecting public config', () => {
    const history = Array.from({ length: 12 }, (_, index) => ({
      id: `v-${index}`,
      saved_at: `2026-08-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
      mode: index % 2 === 0 ? 'draft' as const : 'publish' as const,
      config: { template: index % 2 === 0 ? 'travel' : 'midnight' },
    }))
    const envelope = buildInvitationConfigEnvelope({
      current: { published: { template: 'travel' } },
      draft: { template: 'midnight' },
      publish: false,
      history,
    })

    expect(getInvitationConfigHistory(envelope)).toHaveLength(10)
    expect(getInvitationConfigHistory(envelope)[0].id).toBe('v-0')
    expect(getPublishedInvitationConfig(envelope)).toEqual({ template: 'travel' })
  })

  it('ignores malformed history entries', () => {
    expect(getInvitationConfigHistory({ history: [{ id: 'bad' }, null, { id: 'ok', saved_at: 'now', mode: 'draft', config: {} }] })).toEqual([
      { id: 'ok', saved_at: 'now', mode: 'draft', config: {} },
    ])
  })
})

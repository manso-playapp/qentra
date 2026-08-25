import { describe, expect, it } from 'vitest'

import {
  createMarketingEvent,
  isMarketingSectionId,
  toMarketingAnalyticsProperties,
  trackMarketingEvent,
} from './marketing-analytics'

describe('marketing analytics contract', () => {
  it('creates a low-cardinality CTA event', () => {
    expect(
      createMarketingEvent('cta_clicked', {
        placement: 'home_hero',
        audience: 'family',
        destination: 'demo',
      }),
    ).toEqual({
      name: 'cta_clicked',
      properties: {
        placement: 'home_hero',
        audience: 'family',
        destination: 'demo',
      },
    })
  })

  it('recognizes only documented marketing sections', () => {
    expect(isMarketingSectionId('preparation')).toBe(true)
    expect(isMarketingSectionId('guest-email')).toBe(false)
  })

  it('is a safe no-op outside the browser', () => {
    expect(trackMarketingEvent('invitation_demo_started', {})).toEqual({
      name: 'invitation_demo_started',
      properties: {},
    })
  })

  it('converts only flat, provider-safe properties', () => {
    expect(
      toMarketingAnalyticsProperties(
        createMarketingEvent('cta_clicked', {
          placement: 'home_hero',
          audience: 'family',
          destination: 'demo',
        }),
      ),
    ).toEqual({
      placement: 'home_hero',
      audience: 'family',
      destination: 'demo',
    })
  })
})

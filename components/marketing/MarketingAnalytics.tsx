'use client'

import { track } from '@vercel/analytics'
import { Analytics } from '@vercel/analytics/next'
import { useEffect } from 'react'
import {
  MARKETING_ANALYTICS_BROWSER_EVENT,
  toMarketingAnalyticsProperties,
  type MarketingAnalyticsEvent,
} from '@/lib/marketing-analytics'

function isMarketingAnalyticsEvent(value: unknown): value is MarketingAnalyticsEvent {
  if (!value || typeof value !== 'object') return false

  const event = value as Partial<MarketingAnalyticsEvent>
  return typeof event.name === 'string' && !!event.properties && typeof event.properties === 'object'
}

/**
 * Carga Vercel Web Analytics únicamente en la web pública y reenvía el
 * contrato local ya tipado. No se monta en Admin ni en invitaciones, donde
 * una ruta podría incluir identificadores o tokens.
 */
export function MarketingAnalytics({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return

    const handleMarketingEvent = (browserEvent: Event) => {
      if (!(browserEvent instanceof CustomEvent)) return
      if (!isMarketingAnalyticsEvent(browserEvent.detail)) return

      const event = browserEvent.detail
      track(event.name, toMarketingAnalyticsProperties(event))
    }

    window.addEventListener(MARKETING_ANALYTICS_BROWSER_EVENT, handleMarketingEvent)
    return () =>
      window.removeEventListener(MARKETING_ANALYTICS_BROWSER_EVENT, handleMarketingEvent)
  }, [enabled])

  return enabled ? <Analytics /> : null
}

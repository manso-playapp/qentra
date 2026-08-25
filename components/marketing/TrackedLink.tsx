'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import {
  dispatchMarketingEvent,
  type MarketingAnalyticsEvent,
} from '@/lib/marketing-analytics'

type TrackedLinkProps = ComponentProps<typeof Link> & {
  analytics: MarketingAnalyticsEvent
}

export function TrackedLink({ analytics, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return

        dispatchMarketingEvent(analytics)
      }}
    />
  )
}

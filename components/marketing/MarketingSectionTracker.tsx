'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  isMarketingSectionId,
  trackMarketingEvent,
} from '@/lib/marketing-analytics'

export function MarketingSectionTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const seen = new Set<string>()
    const sections = document.querySelectorAll<HTMLElement>('[data-marketing-section]')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          const section = (entry.target as HTMLElement).dataset.marketingSection
          if (!section || seen.has(section) || !isMarketingSectionId(section)) continue

          seen.add(section)
          trackMarketingEvent('marketing_section_viewed', { section })
          observer.unobserve(entry.target)
        }
      },
      {
        rootMargin: '-30% 0px -45% 0px',
        threshold: 0,
      },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [pathname])

  return null
}

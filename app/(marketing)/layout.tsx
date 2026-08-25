import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { MarketingAnalytics } from '@/components/marketing/MarketingAnalytics'
import { MarketingSectionTracker } from '@/components/marketing/MarketingSectionTracker'
import { SiteHeader } from '@/components/marketing/SiteHeader'
import { SiteFooter } from '@/components/marketing/SiteFooter'
import { getPublicAppUrl } from '@/lib/public-url'

export const metadata: Metadata = {
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Alista',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Alista' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
}

const siteUrl = getPublicAppUrl() || 'https://alista.com.ar'

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Alista',
      url: siteUrl,
      logo: `${siteUrl}/alista-logo.svg`,
      email: 'hola@alista.com.ar',
      areaServed: 'AR',
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Alista',
      url: siteUrl,
      inLanguage: 'es-AR',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Alista',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      inLanguage: 'es-AR',
      description:
        'Alista prepara invitaciones, confirmaciones, grupos, entradas y accesos para cumpleaños de 15.',
      provider: { '@id': `${siteUrl}/#organization` },
    },
  ],
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f0eee8]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <a
        href="#contenido-principal"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-white px-5 py-3 text-sm font-black text-[#171714] shadow-xl transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#009cdd] focus:ring-offset-2 motion-reduce:transition-none"
      >
        Saltar al contenido principal
      </a>
      <SiteHeader />
      <MarketingSectionTracker />
      <MarketingAnalytics enabled={process.env.ALISTA_WEB_ANALYTICS_ENABLED === '1'} />
      <main id="contenido-principal" className="flex-1" tabIndex={-1}>{children}</main>
      <SiteFooter />
    </div>
  )
}

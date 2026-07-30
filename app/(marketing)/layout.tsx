import type { Metadata } from 'next'
import type { ReactNode } from 'react'
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
        'Plataforma para vincular invitaciones, pagos y accesos en eventos privados con cupo limitado.',
      provider: { '@id': `${siteUrl}/#organization` },
    },
  ],
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}

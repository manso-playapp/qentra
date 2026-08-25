import type { MetadataRoute } from 'next'
import { getPublicAppUrl } from '@/lib/public-url'

const siteUrl = getPublicAppUrl() || 'https://alista.com.ar'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/acceso', '/invitacion', '/puerta', '/t/', '/test', '/totem'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}

import type { MetadataRoute } from 'next'
import { ALISTA_SITE_URL } from '@/lib/site-url'

const siteUrl = ALISTA_SITE_URL

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

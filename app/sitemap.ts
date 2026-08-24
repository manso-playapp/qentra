import type { MetadataRoute } from 'next'
import { getPublicAppUrl } from '@/lib/public-url'

const siteUrl = getPublicAppUrl() || 'https://alista.com.ar'

const pages: Array<{ path: string; priority: number }> = [
  { path: '/', priority: 1 },
  { path: '/producto', priority: 0.9 },
  { path: '/como-funciona', priority: 0.8 },
  { path: '/casos', priority: 0.8 },
  { path: '/profesionales', priority: 0.8 },
  { path: '/precios', priority: 0.7 },
  { path: '/seguridad', priority: 0.6 },
  { path: '/demo', priority: 0.7 },
  { path: '/contacto', priority: 0.6 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority }) => ({
    url: new URL(path, `${siteUrl}/`).toString(),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority,
  }))
}

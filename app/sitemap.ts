import type { MetadataRoute } from 'next'
import { getPublicAppUrl } from '@/lib/public-url'

const siteUrl = getPublicAppUrl() || 'https://alista.com.ar'

const pages: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/producto', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/como-funciona', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/casos', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/profesionales', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/precios', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/autogestion', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/seguridad', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/demo', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/contacto', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/privacidad', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terminos', priority: 0.2, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, `${siteUrl}/`).toString(),
    changeFrequency,
    priority,
  }))
}

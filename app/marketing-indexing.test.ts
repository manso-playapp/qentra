import { describe, expect, it } from 'vitest'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'

describe('public marketing indexing', () => {
  it('keeps operational route roots out of crawlers', () => {
    const rules = robots().rules

    expect(Array.isArray(rules)).toBe(false)
    if (Array.isArray(rules)) return

    expect(rules.disallow).toEqual(
      expect.arrayContaining([
        '/admin',
        '/api',
        '/acceso',
        '/invitacion',
        '/puerta',
        '/t/',
        '/test',
        '/totem',
      ]),
    )
  })

  it('publishes every canonical marketing route without synthetic update dates', () => {
    const entries = sitemap()
    const paths = entries.map((entry) => new URL(entry.url).pathname)

    expect(paths).toEqual([
      '/',
      '/producto',
      '/como-funciona',
      '/casos',
      '/profesionales',
      '/precios',
      '/autogestion',
      '/seguridad',
      '/demo',
      '/contacto',
      '/privacidad',
      '/terminos',
    ])
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true)
  })
})

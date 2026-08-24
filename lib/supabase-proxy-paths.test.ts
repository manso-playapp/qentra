import { describe, expect, it } from 'vitest'
import { requiresSupabaseSessionRefresh } from './supabase-proxy-paths'

describe('requiresSupabaseSessionRefresh', () => {
  it.each([
    '/',
    '/producto',
    '/demo',
    '/invitacion/token-publico',
    '/api/invitacion/token-publico',
    '/api/mercadopago/webhook',
  ])('leaves public route %s independent from Supabase Auth', (pathname) => {
    expect(requiresSupabaseSessionRefresh(pathname)).toBe(false)
  })

  it.each([
    '/admin',
    '/admin/events/123',
    '/puerta/123',
    '/totem/123',
    '/acceso/logout',
    '/api/events/123/checkin',
    '/api/guests/bulk',
    '/api/operators/123',
  ])('refreshes Supabase Auth for protected route %s', (pathname) => {
    expect(requiresSupabaseSessionRefresh(pathname)).toBe(true)
  })

  it('does not match unrelated prefixes', () => {
    expect(requiresSupabaseSessionRefresh('/administrator')).toBe(false)
    expect(requiresSupabaseSessionRefresh('/api/eventual')).toBe(false)
  })
})

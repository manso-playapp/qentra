const AUTHENTICATED_PAGE_PREFIXES = ['/admin', '/puerta', '/totem', '/acceso'] as const

const AUTHENTICATED_API_PREFIXES = [
  '/api/uploads',
  '/api/event-branding',
  '/api/settings',
  '/api/event-templates',
  '/api/guest-access',
  '/api/security',
  '/api/operators',
  '/api/guests',
  '/api/guest-types',
  '/api/events',
] as const

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function requiresSupabaseSessionRefresh(pathname: string) {
  return (
    AUTHENTICATED_PAGE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix)) ||
    AUTHENTICATED_API_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  )
}

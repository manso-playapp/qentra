const OWNERSHIP_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Normaliza el email que se usa para buscar una cuenta de Alista. */
export function normalizeOwnershipEmail(value: unknown) {
  if (typeof value !== 'string') return null

  const email = value.trim().toLowerCase()
  return OWNERSHIP_EMAIL_PATTERN.test(email) ? email : null
}

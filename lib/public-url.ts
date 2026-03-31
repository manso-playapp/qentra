const PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ||
  process.env.QENTRA_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ||
  ''

export function getPublicAppUrl() {
  return PUBLIC_APP_URL
}

export function buildAbsoluteAppUrl(path: string) {
  if (PUBLIC_APP_URL) {
    return new URL(path, `${PUBLIC_APP_URL}/`).toString()
  }

  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).toString()
  }

  return path
}

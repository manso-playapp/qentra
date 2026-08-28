import { sanitizeNextPath } from '@/lib/operator-auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

/**
 * Vuelta del OAuth de Google.
 *
 * El intercambio se hace en el servidor a proposito: `createBrowserClient` de
 * `@supabase/ssr` guarda el verificador PKCE en una cookie, asi que aca se
 * puede completar y dejar la sesion escrita en cookies httpOnly.
 */
/**
 * Origen al que volver despues del intercambio.
 *
 * Tiene que ser **el host desde el que la persona esta navegando**, no la URL
 * publica: la cookie de sesion se acaba de escribir en ese host. Si acá se
 * devolviera siempre `NEXT_PUBLIC_APP_URL`, probar en localhost mandaria a
 * produccion, donde esa cookie no existe, y el login pareceria fallar.
 *
 * Detras de un proxy (Vercel) el origen real viaja en `x-forwarded-*`.
 */
function resolveOrigin(request: Request) {
  const requestUrl = new URL(request.url)
  const host = request.headers.get('x-forwarded-host') ?? requestUrl.host
  const protocol =
    request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '')

  return `${protocol}://${host}`
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = resolveOrigin(request)
  const code = requestUrl.searchParams.get('code')
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get('next'), '/admin')

  // Google puede volver con un error explicito (por ejemplo, consentimiento
  // cancelado). No es un fallo del sistema: se vuelve al login sin ruido.
  if (requestUrl.searchParams.get('error') || !code) {
    return Response.redirect(new URL('/acceso?error=oauth', origin), 303)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return Response.redirect(new URL('/acceso?error=oauth', origin), 303)
  }

  return Response.redirect(new URL(nextPath, origin), 303)
}

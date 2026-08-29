import { cookies } from 'next/headers'

/**
 * "Ver como": el equipo de Alista mira el panel con los ojos de una cuenta.
 *
 * La cookie guarda a quién se está mirando, nunca un permiso. Quien decide si
 * la lente se aplica es el servidor, comprobando que la sesión REAL sea staff
 * de Alista (`isAlistaStaff`). Una cookie falsificada no habilita nada: sin
 * sesión de staff detrás, se ignora.
 *
 * La lente cambia lo que se muestra, no lo que el staff puede hacer. El acceso
 * de soporte ya es total por decisión de producto
 * (`docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` §3); esto no agrega
 * poder, agrega punto de vista.
 */
export const VIEW_AS_COOKIE = 'alista_view_as'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function readViewAsUserId(): Promise<string | null> {
  const store = await cookies()
  const value = store.get(VIEW_AS_COOKIE)?.value?.trim()
  return value && UUID.test(value) ? value : null
}

export function viewAsCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

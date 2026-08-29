import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { getRealAuthState } from '@/lib/operator-auth'
import { isAlistaStaff } from '@/lib/event-access'
import { VIEW_AS_COOKIE, viewAsCookieOptions } from '@/lib/impersonation'

export const runtime = 'nodejs'

type PostBody = {
  userId?: string
  email?: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Entrar en "ver como". Solo el equipo de Alista, comprobado contra la sesión
// real. La cookie sola no habilita nada: el servidor vuelve a exigir sesión de
// staff en cada render antes de aplicar la lente.
export async function POST(request: Request) {
  // Con la sesión real: si esto mirara con la lente, quien ya está mirando no
  // podría cambiar de cuenta ni el chequeo significaría lo que dice.
  const real = await getRealAuthState()
  if (!real.user) return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAlistaStaff(real.access)) {
    return Response.json({ error: 'Solo el equipo de Alista puede usar esta vista.' }, { status: 403 })
  }

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => null)) as PostBody | null
  const userId = body?.userId?.trim()
  const email = body?.email?.trim().toLowerCase()

  if (!userId && !email) {
    return Response.json({ error: 'Indicá la cuenta que querés mirar.' }, { status: 400 })
  }

  let targetId = userId && UUID.test(userId) ? userId : null
  let targetEmail: string | null = null

  if (targetId) {
    const { data, error } = await adminClient.auth.admin.getUserById(targetId)
    if (error || !data?.user) {
      return Response.json({ error: 'No existe esa cuenta.' }, { status: 404 })
    }
    targetEmail = data.user.email ?? null
  } else if (email) {
    // No hay búsqueda por email en la API de admin: se recorre la lista.
    let page = 1
    while (page <= 20 && !targetId) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 })
      if (error) return Response.json({ error: error.message }, { status: 500 })

      const match = (data?.users ?? []).find((user) => user.email?.toLowerCase() === email)
      if (match) {
        targetId = match.id
        targetEmail = match.email ?? null
      }
      if (!data?.users || data.users.length < 200) break
      page += 1
    }

    if (!targetId) {
      return Response.json({ error: 'No hay ninguna cuenta con ese email.' }, { status: 404 })
    }
  }

  if (!targetId) {
    return Response.json({ error: 'No existe esa cuenta.' }, { status: 404 })
  }

  return Response.json(
    { data: { userId: targetId, email: targetEmail } },
    {
      headers: {
        // Una hora: mirar es una tarea de soporte puntual, no un modo en el que
        // quedarse. Vencida, el panel vuelve solo a la sesión real.
        'Set-Cookie': serializeCookie(VIEW_AS_COOKIE, targetId, 60 * 60),
      },
    }
  )
}

// Salir de la vista. No exige rol: cualquiera que tenga la cookie puede
// soltarla, y quedarse atrapado en ella sería peor que dejarla ir.
export async function DELETE() {
  return Response.json(
    { data: { ok: true } },
    { headers: { 'Set-Cookie': serializeCookie(VIEW_AS_COOKIE, '', 0) } }
  )
}

function serializeCookie(name: string, value: string, maxAge: number) {
  const options = viewAsCookieOptions(maxAge)
  return [
    `${name}=${value}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=Lax`,
    'HttpOnly',
    options.secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

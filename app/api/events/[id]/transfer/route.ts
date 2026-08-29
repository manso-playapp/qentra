import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { normalizeOwnershipEmail } from '@/lib/event-ownership'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }
const USERS_PAGE_SIZE = 1000

function adminClientOrError() {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return {
      adminClient: null,
      response: Response.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
        { status: 503 }
      ),
    }
  }

  return { adminClient, response: null }
}

async function findUserByEmail(adminClient: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, email: string) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    })

    if (error) return { user: null, error }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return { user, error: null }
    if (data.users.length < USERS_PAGE_SIZE) return { user: null, error: null }
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])
  if (authErrorResponse) return authErrorResponse

  const { id: eventId } = await context.params
  if (!eventId) {
    return Response.json({ error: 'Falta el evento.' }, { status: 400 })
  }

  const { adminClient, response } = adminClientOrError()
  if (!adminClient) return response

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null
  const email = normalizeOwnershipEmail(body?.email)
  if (!email) {
    return Response.json({ error: 'Ingresá un email válido.' }, { status: 400 })
  }

  const { data: event, error: eventError } = await adminClient
    .from('events')
    .select('id, name, owner_user_id')
    .eq('id', eventId)
    .maybeSingle()

  if (eventError) return Response.json({ error: eventError.message }, { status: 500 })
  if (!event) return Response.json({ error: 'No se encontró el evento.' }, { status: 404 })

  const { user: targetUser, error: usersError } = await findUserByEmail(adminClient, email)
  if (usersError) return Response.json({ error: usersError.message }, { status: 500 })
  if (!targetUser) {
    return Response.json(
      { error: 'No existe una cuenta de Alista con ese email. La persona debe registrarse primero.' },
      { status: 404 }
    )
  }

  if (targetUser.id === event.owner_user_id) {
    return Response.json({ error: 'Esa cuenta ya es la responsable del evento.' }, { status: 409 })
  }

  const { data: updatedEvent, error: updateError } = await adminClient
    .from('events')
    .update({ owner_user_id: targetUser.id })
    .eq('id', eventId)
    .select('id, name, owner_user_id')
    .single()

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  return Response.json({
    data: {
      event: updatedEvent,
      previousOwnerUserId: event.owner_user_id,
      newOwner: {
        userId: targetUser.id,
        email: targetUser.email ?? email,
      },
    },
  })
}

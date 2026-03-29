import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

function buildTemporaryPassword(length = 14) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*'
  const randomValues = crypto.getRandomValues(new Uint32Array(length))

  return Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join('')
}

export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  context: RouteContext<'/api/operators/[userId]/password'>
) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const { userId } = await context.params

  if (!userId) {
    return Response.json({ error: 'Falta el operador a resetear.' }, { status: 400 })
  }

  const temporaryPassword = buildTemporaryPassword()

  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    password: temporaryPassword,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({
    data: {
      user_id: userId,
      email: data.user?.email ?? null,
      temporary_password: temporaryPassword,
    },
  })
}

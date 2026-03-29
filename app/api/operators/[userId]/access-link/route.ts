import { generateOperatorAccessLink } from '@/lib/operator-access'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: RouteContext<'/api/operators/[userId]/access-link'>
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
    return Response.json({ error: 'Falta el operador.' }, { status: 400 })
  }

  try {
    const accessLink = await generateOperatorAccessLink(adminClient, userId, request.url)

    return Response.json({
      data: accessLink,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo generar el link de acceso.'

    return Response.json({ error: message }, { status: 500 })
  }
}

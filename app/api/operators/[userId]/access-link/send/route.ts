import { generateOperatorAccessLink, sendOperatorAccessEmail } from '@/lib/operator-access'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

export const runtime = 'nodejs'

export async function POST(
  request: Request,
  context: RouteContext<'/api/operators/[userId]/access-link/send'>
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
    const { data: profileData, error: profileError } = await adminClient
      .from('operator_profiles')
      .select('roles')
      .eq('user_id', userId)
      .maybeSingle()

    if (profileError) {
      throw new Error(profileError.message)
    }

    const roles = Array.isArray(profileData?.roles)
      ? profileData.roles.filter((role): role is string => typeof role === 'string')
      : []

    const result = await sendOperatorAccessEmail(accessLink, roles)

    return Response.json({
      data: {
        user_id: userId,
        email: accessLink.email,
        provider: result.provider,
        external_id: result.externalId,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo enviar el link de acceso del operador.'

    return Response.json({ error: message }, { status: 500 })
  }
}

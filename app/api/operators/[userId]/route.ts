import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

type UpdateOperatorRequestBody = {
  fullName?: string
  roles?: string[]
  active?: boolean
}

function normalizeRoles(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((role): role is 'admin' | 'door' | 'security_supervisor' =>
    role === 'admin' || role === 'door' || role === 'security_supervisor'
  )
}

export const runtime = 'nodejs'

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/operators/[userId]'>
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
  const body = (await request.json()) as UpdateOperatorRequestBody
  const fullName = body.fullName?.trim()
  const roles = normalizeRoles(body.roles)
  const active = body.active

  if (!userId || !fullName || roles.length === 0 || typeof active !== 'boolean') {
    return Response.json(
      { error: 'Nombre, roles y estado activo son obligatorios.' },
      { status: 400 }
    )
  }

  const { data: updatedUserData, error: updateUserError } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: fullName,
    },
  })

  if (updateUserError) {
    return Response.json({ error: updateUserError.message }, { status: 500 })
  }

  const { data: profileData, error: profileError } = await adminClient
    .from('operator_profiles')
    .update({
      full_name: fullName,
      roles,
      active,
    })
    .eq('user_id', userId)
    .select('*')
    .single()

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  return Response.json({
    data: {
      user_id: profileData.user_id,
      email: updatedUserData.user?.email ?? null,
      full_name: profileData.full_name,
      roles: profileData.roles,
      active: profileData.active,
      last_sign_in_at: updatedUserData.user?.last_sign_in_at ?? null,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
    },
  })
}

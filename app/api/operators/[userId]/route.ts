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

export async function DELETE(
  _request: Request,
  context: RouteContext<'/api/operators/[userId]'>
) {
  const { response: authErrorResponse, auth } = await ensureAuthorizedApiAccess(['admin'])

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
    return Response.json({ error: 'Falta el usuario operador.' }, { status: 400 })
  }

  if (auth?.user.id === userId) {
    return Response.json(
      { error: 'No podes eliminar el usuario con el que estas conectado.' },
      { status: 400 }
    )
  }

  const { data: profile, error: profileError } = await adminClient
    .from('operator_profiles')
    .select('user_id, roles, active')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  if (!profile) {
    return Response.json({ error: 'No se encontro el operador.' }, { status: 404 })
  }

  const roles = Array.isArray(profile.roles) ? profile.roles : []

  if (profile.active && roles.includes('admin')) {
    const { count: activeAdminCount, error: adminCountError } = await adminClient
      .from('operator_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('active', true)
      .contains('roles', ['admin'])

    if (adminCountError) {
      return Response.json({ error: adminCountError.message }, { status: 500 })
    }

    if ((activeAdminCount ?? 0) <= 1) {
      return Response.json(
        { error: 'No se puede eliminar al unico administrador activo.' },
        { status: 409 }
      )
    }
  }

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteUserError) {
    return Response.json({ error: deleteUserError.message }, { status: 500 })
  }

  return Response.json({ ok: true, userId })
}

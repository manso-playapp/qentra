import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

type CreateOperatorRequestBody = {
  email?: string
  password?: string
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

export async function GET() {
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

  const [{ data: usersData, error: usersError }, { data: profilesData, error: profilesError }] =
    await Promise.all([
      adminClient.auth.admin.listUsers({ page: 1, perPage: 200 }),
      adminClient.from('operator_profiles').select('*').order('created_at', { ascending: false }),
    ])

  if (usersError) {
    return Response.json({ error: usersError.message }, { status: 500 })
  }

  if (profilesError) {
    return Response.json({ error: profilesError.message }, { status: 500 })
  }

  const usersById = new Map((usersData.users ?? []).map((user) => [user.id, user]))
  const operators = (profilesData ?? []).map((profile) => {
    const user = usersById.get(profile.user_id)

    return {
      user_id: profile.user_id,
      email: user?.email ?? null,
      full_name: profile.full_name,
      roles: profile.roles,
      active: profile.active,
      last_sign_in_at: user?.last_sign_in_at ?? null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  })

  return Response.json({ data: operators })
}

export async function POST(request: Request) {
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

  const body = (await request.json()) as CreateOperatorRequestBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()
  const fullName = body.fullName?.trim()
  const roles = normalizeRoles(body.roles)
  const active = body.active !== false

  if (!email || !password || !fullName || roles.length === 0) {
    return Response.json(
      { error: 'Email, password, nombre y al menos un rol son obligatorios.' },
      { status: 400 }
    )
  }

  const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  })

  if (createUserError) {
    return Response.json({ error: createUserError.message }, { status: 500 })
  }

  const createdUser = createdUserData.user

  if (!createdUser) {
    return Response.json({ error: 'No se pudo crear el usuario operador.' }, { status: 500 })
  }

  const { error: profileError } = await adminClient
    .from('operator_profiles')
    .upsert(
      {
        user_id: createdUser.id,
        full_name: fullName,
        roles,
        active,
      },
      { onConflict: 'user_id' }
    )

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 })
  }

  return Response.json({
    data: {
      user_id: createdUser.id,
      email: createdUser.email ?? email,
      full_name: fullName,
      roles,
      active,
      last_sign_in_at: createdUser.last_sign_in_at ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  })
}

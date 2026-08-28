import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

type CreateOperatorRequestBody = {
  email?: string
  password?: string
  fullName?: string
  roles?: string[]
  eventIds?: string[]
  active?: boolean
}

function normalizeRoles(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((role): role is 'admin' | 'event_admin' | 'door' | 'security_supervisor' =>
    role === 'admin' || role === 'event_admin' || role === 'door' || role === 'security_supervisor'
  )
}

function normalizeEventIds(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0)))
    : []
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

  const [{ data: usersData, error: usersError }, { data: profilesData, error: profilesError }, assignmentsResponse] =
    await Promise.all([
      adminClient.auth.admin.listUsers({ page: 1, perPage: 200 }),
      adminClient.from('operator_profiles').select('*').order('created_at', { ascending: false }),
      adminClient.from('event_admin_assignments').select('user_id, event_id'),
    ])

  if (usersError) {
    return Response.json({ error: usersError.message }, { status: 500 })
  }

  if (profilesError) {
    return Response.json({ error: profilesError.message }, { status: 500 })
  }
  if (assignmentsResponse.error) {
    return Response.json({ error: assignmentsResponse.error.message }, { status: 500 })
  }

  const usersById = new Map((usersData.users ?? []).map((user) => [user.id, user]))
  const operators = (profilesData ?? []).map((profile) => {
    const user = usersById.get(profile.user_id)

    return {
      user_id: profile.user_id,
      email: user?.email ?? null,
      full_name: profile.full_name,
      roles: profile.roles,
      event_ids: (assignmentsResponse.data ?? [])
        .filter((assignment) => assignment.user_id === profile.user_id)
        .map((assignment) => assignment.event_id),
      active: profile.active,
      last_sign_in_at: user?.last_sign_in_at ?? null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  })

  return Response.json({ data: operators })
}

export async function POST(request: Request) {
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

  const body = (await request.json()) as CreateOperatorRequestBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()
  const fullName = body.fullName?.trim()
  const roles = normalizeRoles(body.roles)
  const eventIds = normalizeEventIds(body.eventIds)
  const active = body.active !== false

  if (!email || !password || !fullName || roles.length === 0) {
    return Response.json(
      { error: 'Email, password, nombre y al menos un rol son obligatorios.' },
      { status: 400 }
    )
  }

  if (roles.includes('event_admin') && eventIds.length !== 1) {
    return Response.json(
      { error: 'El administrador de evento debe tener un unico evento asignado.' },
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

  if (eventIds.length > 0) {
    const { error: assignmentError } = await adminClient
      .from('event_admin_assignments')
      .insert(eventIds.map((eventId) => ({
        user_id: createdUser.id,
        event_id: eventId,
        created_by_user_id: auth?.user.id,
      })))

    if (assignmentError) {
      return Response.json({ error: assignmentError.message }, { status: 500 })
    }
  }

  return Response.json({
    data: {
      user_id: createdUser.id,
      email: createdUser.email ?? email,
      full_name: fullName,
      roles,
      event_ids: eventIds,
      active,
      last_sign_in_at: createdUser.last_sign_in_at ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  })
}

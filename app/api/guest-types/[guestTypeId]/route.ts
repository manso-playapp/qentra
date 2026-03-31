import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

type GuestTypeRouteContext = {
  params: Promise<{
    guestTypeId: string
  }>
}

type UpdateGuestTypeRequestBody = {
  name?: string
  description?: string
  is_active?: boolean
  access_policy_label?: string
  access_start_time?: string
  access_end_time?: string
  access_start_day_offset?: number
  access_end_day_offset?: number
}

export const runtime = 'nodejs'

function trimOptionalString(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

async function getAuthorizedAdminClient() {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])

  if (authErrorResponse) {
    return { authErrorResponse, adminClient: null }
  }

  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return {
      authErrorResponse: Response.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
        { status: 503 }
      ),
      adminClient: null,
    }
  }

  return { authErrorResponse: null, adminClient }
}

export async function PATCH(request: Request, context: GuestTypeRouteContext) {
  const { authErrorResponse, adminClient } = await getAuthorizedAdminClient()

  if (authErrorResponse || !adminClient) {
    return authErrorResponse
  }

  try {
    const { guestTypeId } = await context.params
    const body = (await request.json()) as UpdateGuestTypeRequestBody

    const payload: Record<string, string | number | boolean | null> = {}

    if (body.name !== undefined) {
      const trimmedName = body.name.trim()
      if (!trimmedName) {
        return Response.json(
          { error: 'El nombre del tipo es obligatorio.' },
          { status: 400 }
        )
      }

      payload.name = trimmedName
    }

    if (body.description !== undefined) payload.description = trimOptionalString(body.description)
    if (body.is_active !== undefined) payload.is_active = body.is_active
    if (body.access_policy_label !== undefined) {
      payload.access_policy_label = trimOptionalString(body.access_policy_label)
    }
    if (body.access_start_time !== undefined) {
      payload.access_start_time = trimOptionalString(body.access_start_time)
    }
    if (body.access_end_time !== undefined) {
      payload.access_end_time = trimOptionalString(body.access_end_time)
    }
    if (body.access_start_day_offset !== undefined) {
      payload.access_start_day_offset = body.access_start_day_offset
    }
    if (body.access_end_day_offset !== undefined) {
      payload.access_end_day_offset = body.access_end_day_offset
    }

    const { data, error } = await adminClient
      .from('guest_types')
      .update(payload)
      .eq('id', guestTypeId)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo actualizar el tipo de invitado.'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: GuestTypeRouteContext) {
  const { authErrorResponse, adminClient } = await getAuthorizedAdminClient()

  if (authErrorResponse || !adminClient) {
    return authErrorResponse
  }

  try {
    const { guestTypeId } = await context.params

    const { count, error: countError } = await adminClient
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('guest_type_id', guestTypeId)

    if (countError) {
      return Response.json({ error: countError.message }, { status: 500 })
    }

    if ((count ?? 0) > 0) {
      return Response.json(
        {
          error:
            'No se puede borrar este tipo porque ya tiene invitados asociados. Puedes desactivarlo en su lugar.',
        },
        { status: 409 }
      )
    }

    const { error } = await adminClient.from('guest_types').delete().eq('id', guestTypeId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data: { id: guestTypeId } })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo borrar el tipo de invitado.'
    return Response.json({ error: message }, { status: 500 })
  }
}

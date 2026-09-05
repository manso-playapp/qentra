import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { validateAccessSchedule } from '@/lib/event-schedule'

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
  access_start_time?: string | null
  access_end_time?: string | null
  access_start_day_offset?: number | null
  access_end_day_offset?: number | null
  payment_amount_cents?: number
  show_gift_info?: boolean
  invitation_message?: string
}

export const runtime = 'nodejs'

function trimOptionalString(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

// La autorizacion es por acceso al EVENTO, no por rol: `ensureAuthorizedEventApiAccess`
// ya cubre staff, duena y colaborador invitado, y espeja `can_manage_event()`.
// Exigir ademas perfil de operador dejaba afuera justo a la clienta —el caso
// normal del self-serve—, que recibia "Operator profile not found" sobre su
// propio invitado. Ver decisiones §3 y §7.1.
async function getAuthorizedAdminClient() {
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
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return Response.json({ error: 'El cuerpo de la solicitud debe ser JSON válido.' }, { status: 400 })
  }
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return Response.json({ error: 'Los datos del tipo de invitado deben ser un objeto.' }, { status: 400 })
  }
  const fields = rawBody as Record<string, unknown>
  for (const field of ['name', 'description', 'access_policy_label', 'invitation_message']) {
    if (fields[field] !== undefined && typeof fields[field] !== 'string') {
      return Response.json({ error: `El campo ${field} debe ser texto.` }, { status: 400 })
    }
  }
  for (const field of ['access_start_time', 'access_end_time']) {
    if (fields[field] !== undefined && fields[field] !== null && typeof fields[field] !== 'string') {
      return Response.json({ error: 'Los horarios deben ser texto con formato de 24 horas.' }, { status: 400 })
    }
  }
  for (const field of ['access_start_day_offset', 'access_end_day_offset']) {
    if (fields[field] !== undefined && fields[field] !== null && typeof fields[field] !== 'number') {
      return Response.json({ error: 'El día del acceso debe ser un número entero.' }, { status: 400 })
    }
  }
  const { authErrorResponse, adminClient } = await getAuthorizedAdminClient()

  if (authErrorResponse || !adminClient) {
    return authErrorResponse
  }

  try {
    const { guestTypeId } = await context.params
    const body = rawBody as UpdateGuestTypeRequestBody

    const { data: guestType, error: guestTypeLookupError } = await adminClient
      .from('guest_types').select('*').eq('id', guestTypeId).maybeSingle()
    if (guestTypeLookupError) return Response.json({ error: guestTypeLookupError.message }, { status: 500 })
    if (!guestType) return Response.json({ error: 'Tipo de invitado inexistente.' }, { status: 404 })
    const { response: eventAuthError } = await ensureAuthorizedEventApiAccess(guestType.event_id)
    if (eventAuthError) return eventAuthError

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
      payload.access_start_time = body.access_start_time === null ? null : trimOptionalString(body.access_start_time)
    }
    if (body.access_end_time !== undefined) {
      payload.access_end_time = body.access_end_time === null ? null : trimOptionalString(body.access_end_time)
    }
    if (body.access_start_day_offset !== undefined) {
      payload.access_start_day_offset = body.access_start_day_offset
    }
    if (body.access_end_day_offset !== undefined) {
      payload.access_end_day_offset = body.access_end_day_offset
    }
    const scheduleFields = ['access_start_time', 'access_end_time', 'access_start_day_offset', 'access_end_day_offset'] as const
    if (scheduleFields.some((field) => body[field] !== undefined)) {
      // Un PATCH puede cambiar un solo extremo. Validar contra el otro extremo
      // persistido evita guardar una ventana invertida por una edicion parcial.
      const schedule = {
        access_start_time: body.access_start_time === undefined ? guestType.access_start_time : payload.access_start_time as string | null,
        access_end_time: body.access_end_time === undefined ? guestType.access_end_time : payload.access_end_time as string | null,
        access_start_day_offset: body.access_start_day_offset === undefined ? guestType.access_start_day_offset : body.access_start_day_offset,
        access_end_day_offset: body.access_end_day_offset === undefined ? guestType.access_end_day_offset : body.access_end_day_offset,
      }
      let eventStartTime: string | null = null
      if ((schedule.access_start_time && schedule.access_start_day_offset == null) ||
        (schedule.access_end_time && schedule.access_end_day_offset == null)) {
        const { data: event, error: eventError } = await adminClient
          .from('events').select('start_time').eq('id', guestType.event_id).maybeSingle()
        if (eventError) return Response.json({ error: eventError.message }, { status: 500 })
        if (!event) return Response.json({ error: 'Evento inexistente.' }, { status: 404 })
        eventStartTime = event.start_time
      }
      const scheduleError = validateAccessSchedule(schedule, eventStartTime)
      if (scheduleError) return Response.json({ error: scheduleError }, { status: 400 })
    }
    if (body.payment_amount_cents !== undefined) {
      if (!Number.isInteger(body.payment_amount_cents) || body.payment_amount_cents < 0) {
        return Response.json({ error: 'El importe del tipo debe ser un número positivo.' }, { status: 400 })
      }
      payload.payment_amount_cents = body.payment_amount_cents
    }
    if (body.show_gift_info !== undefined) {
      payload.show_gift_info = body.show_gift_info
    }
    if (body.invitation_message !== undefined) {
      const invitationMessage = trimOptionalString(body.invitation_message)
      if (invitationMessage && invitationMessage.length > 160) {
        return Response.json({ error: 'La leyenda de la invitación no puede superar los 160 caracteres.' }, { status: 400 })
      }
      payload.invitation_message = invitationMessage
    }

    // Una solicitud vacia no debe revalidar ni reescribir horarios heredados.
    if (Object.keys(payload).length === 0) return Response.json({ data: guestType })

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

    const { data: guestType, error: guestTypeLookupError } = await adminClient
      .from('guest_types').select('event_id').eq('id', guestTypeId).maybeSingle()
    if (guestTypeLookupError) return Response.json({ error: guestTypeLookupError.message }, { status: 500 })
    if (!guestType) return Response.json({ error: 'Tipo de invitado inexistente.' }, { status: 404 })
    const { response: eventAuthError } = await ensureAuthorizedEventApiAccess(guestType.event_id)
    if (eventAuthError) return eventAuthError

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

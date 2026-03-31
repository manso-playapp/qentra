import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { getEventTemplateByKey } from '@/lib/event-templates'

export const runtime = 'nodejs'

type ApplyEventTemplateRequestBody = {
  eventId?: string
  templateKey?: string
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

  try {
    const body = (await request.json()) as ApplyEventTemplateRequestBody
    const eventId = body.eventId?.trim()
    const template = getEventTemplateByKey(body.templateKey)

    if (!eventId || !template) {
      return Response.json(
        { error: 'Faltan datos para aplicar la plantilla del evento.' },
        { status: 400 }
      )
    }

    const { data: event, error: eventError } = await adminClient
      .from('events')
      .select('id, event_type, name')
      .eq('id', eventId)
      .single()

    if (eventError) {
      return Response.json({ error: eventError.message }, { status: 500 })
    }

    if (!event) {
      return Response.json({ error: 'No se encontro el evento.' }, { status: 404 })
    }

    const { count: existingGuestTypesCount, error: existingGuestTypesError } = await adminClient
      .from('guest_types')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)

    if (existingGuestTypesError) {
      return Response.json({ error: existingGuestTypesError.message }, { status: 500 })
    }

    if ((existingGuestTypesCount ?? 0) > 0) {
      return Response.json(
        {
          error:
            'Este evento ya tiene tipos de invitado. La plantilla solo puede aplicarse sobre eventos sin tipos previos.',
        },
        { status: 409 }
      )
    }

    const rows = template.guestTypes.map((guestType) => ({
      event_id: eventId,
      name: guestType.name,
      description: guestType.description ?? null,
      access_policy_label: guestType.access_policy_label ?? null,
      access_start_time: guestType.access_start_time ?? null,
      access_end_time: guestType.access_end_time ?? null,
      access_start_day_offset: guestType.access_start_day_offset ?? 0,
      access_end_day_offset: guestType.access_end_day_offset ?? 0,
      is_active: true,
    }))

    const { data, error } = await adminClient
      .from('guest_types')
      .insert(rows)
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({
      data: {
        templateKey: template.key,
        eventId,
        createdGuestTypes: data ?? [],
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'No se pudo aplicar la plantilla del evento.'
    return Response.json({ error: message }, { status: 500 })
  }
}

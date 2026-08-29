import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'

export const runtime = 'nodejs'

/**
 * La próxima fiesta como evento nuevo.
 *
 * Es la contracara de §4 bis: cuando una activación quedó consumida, la salida
 * no es un bloqueo sino empezar la siguiente sin perder lo hecho. Se copia el
 * trabajo de diseño y configuración; NO se copian los invitados —son personas
 * de otra fiesta, y su dato personal no debe multiplicarse— ni la activación,
 * que es justamente lo que se vuelve a comprar.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: sourceEventId } = await context.params
  const { response: authErrorResponse, auth } = await ensureAuthorizedEventApiAccess(sourceEventId)
  if (authErrorResponse || !auth) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const { data: source, error: sourceError } = await adminClient
    .from('events')
    .select('*')
    .eq('id', sourceEventId)
    .maybeSingle()

  if (sourceError) return Response.json({ error: sourceError.message }, { status: 500 })
  if (!source) return Response.json({ error: 'No se encontró el evento.' }, { status: 404 })

  // Fecha y nombre son lo único que la copia no puede adivinar: se dejan como
  // borrador evidente para que la responsable los corrija antes de publicar.
  const nextYearDate = shiftOneYear(source.event_date as string)
  const slug = `${source.slug as string}-${Math.random().toString(36).slice(2, 7)}`

  const { data: created, error: createError } = await adminClient
    .from('events')
    .insert({
      name: `${source.name as string} (nueva edición)`,
      slug,
      event_type: source.event_type,
      event_date: nextYearDate,
      start_time: source.start_time,
      venue_name: source.venue_name,
      venue_address: source.venue_address,
      dresscode: source.dresscode ?? null,
      directions_url: source.directions_url ?? null,
      max_capacity: source.max_capacity,
      description: source.description ?? null,
      gift_info: source.gift_info ?? null,
      contact_phone: source.contact_phone ?? null,
      // Sin publicar: todavía le faltan la fecha y el nombre reales.
      status: 'inactive',
      created_by_user_id: auth.user.id,
      owner_user_id: source.owner_user_id ?? auth.user.id,
    })
    .select('id')
    .single()

  if (createError) return Response.json({ error: createError.message }, { status: 500 })

  const newEventId = created.id as string

  const [{ data: guestTypes }, { data: branding }] = await Promise.all([
    adminClient.from('guest_types').select('*').eq('event_id', sourceEventId),
    adminClient.from('event_branding').select('*').eq('event_id', sourceEventId).maybeSingle(),
  ])

  if (guestTypes && guestTypes.length > 0) {
    const rows = guestTypes.map((guestType) => ({
      event_id: newEventId,
      name: guestType.name,
      description: guestType.description ?? null,
      access_policy_label: guestType.access_policy_label ?? null,
      access_start_time: guestType.access_start_time ?? null,
      access_end_time: guestType.access_end_time ?? null,
      access_start_day_offset: guestType.access_start_day_offset ?? 0,
      access_end_day_offset: guestType.access_end_day_offset ?? 0,
      payment_amount_cents: guestType.payment_amount_cents ?? 0,
      is_active: guestType.is_active ?? true,
    }))

    const { error: guestTypesError } = await adminClient.from('guest_types').insert(rows)
    if (guestTypesError) {
      return Response.json(
        { error: `El evento se creó, pero no se copiaron los tipos de invitado: ${guestTypesError.message}` },
        { status: 500 }
      )
    }
  }

  if (branding) {
    // El historial de versiones no viaja: pertenece a la fiesta anterior.
    const { history, ...config } = (branding.config ?? {}) as Record<string, unknown>
    void history

    const { error: brandingError } = await adminClient.from('event_branding').insert({
      event_id: newEventId,
      primary_color: branding.primary_color,
      secondary_color: branding.secondary_color,
      logo_url: branding.logo_url ?? null,
      cover_image_url: branding.cover_image_url ?? null,
      config,
    })

    if (brandingError) {
      return Response.json(
        { error: `El evento se creó, pero no se copió el diseño: ${brandingError.message}` },
        { status: 500 }
      )
    }
  }

  return Response.json({ data: { id: newEventId } })
}

function shiftOneYear(eventDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate)
  if (!match) return eventDate
  const [, year, month, day] = match
  return `${Number(year) + 1}-${month}-${day}`
}

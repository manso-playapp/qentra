import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'

export const runtime = 'nodejs'

// Feed de check-ins recientes con el nombre y la foto del invitado, para el
// spotlight del totem y el panel de actividad de la puerta.
//
// Va por service role a proposito: RLS oculta la tabla guests al cliente
// anonimo, asi que el join checkins->guests hecho desde el navegador devuelve
// datos vacios. Este endpoint sortea RLS pero queda detras de la sesion de
// operador (mismos roles que las superficies de acceso).

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: eventId } = await context.params
  const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(eventId, [
    'admin',
    'door',
    'security_supervisor',
  ])
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const [feedResult, countResult] = await Promise.all([
    adminClient
      .from('checkins')
      .select(
        `
      id,
      event_id,
      guest_id,
      checked_in_at,
      device_name,
      result,
      guests (
        first_name,
        last_name,
        status,
        photo_url,
        table_assignment,
        notes,
        plus_ones_confirmed,
        companion_names
      )
    `
      )
      .eq('event_id', eventId)
      // Solo ingresos aprobados: el totem celebra, los rechazos quedan en la puerta.
      .eq('result', 'approved')
      .order('checked_in_at', { ascending: false })
      .limit(10),
    // Total de personas aprobadas (titulares + acompañantes).
    adminClient
      .from('checkins')
      .select('admitted_people')
      .eq('event_id', eventId)
      .eq('result', 'approved'),
  ])

  if (feedResult.error) {
    return Response.json({ error: feedResult.error.message }, { status: 500 })
  }

  if (countResult.error) {
    return Response.json({ error: countResult.error.message }, { status: 500 })
  }

  // Snapshot de personas al registrar el ingreso: un reingreso no las duplica
  // y editar luego los acompañantes no cambia el conteo de la recepción.
  const approvedCount = (countResult.data ?? []).reduce((total, checkin) => total + checkin.admitted_people, 0)

  return Response.json({ data: feedResult.data ?? [], approvedCount })
}

import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

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
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess([
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

  const { id: eventId } = await context.params

  const { data, error } = await adminClient
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
        photo_url
      )
    `
    )
    .eq('event_id', eventId)
    // Solo ingresos aprobados: el totem celebra, los rechazos quedan en la puerta.
    .eq('result', 'approved')
    .order('checked_in_at', { ascending: false })
    .limit(10)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: data ?? [] })
}

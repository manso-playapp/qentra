import { resolveActivation, type ActivationSource } from '@/lib/event-activation'
import { ensureAuthorizedApiAccess, ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

const GRANTABLE_SOURCES: readonly ActivationSource[] = ['manual', 'cortesia']

function adminClientOrError() {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return {
      adminClient: null,
      response: Response.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
        { status: 503 }
      ),
    }
  }
  return { adminClient, response: null }
}

/** Estado de activación. Lo puede ver quien administra el evento. */
export async function GET(_request: Request, context: RouteContext) {
  const { id: eventId } = await context.params
  const { response: authError } = await ensureAuthorizedEventApiAccess(eventId)
  if (authError) return authError

  const { adminClient, response } = adminClientOrError()
  if (!adminClient) return response

  const { data, error } = await adminClient
    .from('event_activations')
    .select('status, source, activated_at, expires_at, note')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ data: { activation: data ?? null, state: resolveActivation(data) } })
}

/**
 * Otorga la activación a mano.
 *
 * Solo staff de Alista: mientras no exista el cobro, la activación se concede
 * manualmente. Cuando se automatice, el webhook de pago escribirá esta misma
 * fila con `source: 'payment'` y este endpoint seguirá sirviendo para cortesías.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: eventId } = await context.params
  const { response: authError, auth } = await ensureAuthorizedApiAccess(['admin'])
  if (authError || !auth) return authError

  const { adminClient, response } = adminClientOrError()
  if (!adminClient) return response

  const body = (await request.json().catch(() => null)) as
    | { source?: string; note?: string }
    | null

  const source = (body?.source ?? 'manual') as ActivationSource
  if (!GRANTABLE_SOURCES.includes(source)) {
    return Response.json(
      { error: 'La activación manual solo admite "manual" o "cortesia".' },
      { status: 400 }
    )
  }

  const { data: event, error: eventError } = await adminClient
    .from('events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle()

  if (eventError) return Response.json({ error: eventError.message }, { status: 500 })
  if (!event) return Response.json({ error: 'No se encontró el evento.' }, { status: 404 })

  const { data, error } = await adminClient
    .from('event_activations')
    .upsert(
      {
        event_id: eventId,
        status: 'active',
        source,
        activated_at: new Date().toISOString(),
        granted_by_user_id: auth.user.id,
        note: body?.note?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id' }
    )
    .select('status, source, activated_at, expires_at, note')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ data: { activation: data, state: resolveActivation(data) } })
}

/** Da de baja la activación. No borra la fila: conserva el rastro. */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id: eventId } = await context.params
  const { response: authError, auth } = await ensureAuthorizedApiAccess(['admin'])
  if (authError || !auth) return authError

  const { adminClient, response } = adminClientOrError()
  if (!adminClient) return response

  const { data, error } = await adminClient
    .from('event_activations')
    .update({
      status: 'revoked',
      granted_by_user_id: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('event_id', eventId)
    .select('status, source, activated_at, expires_at, note')
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data) return Response.json({ error: 'Este evento no tenía activación.' }, { status: 404 })

  return Response.json({ data: { activation: data, state: resolveActivation(data) } })
}

import { createHash, randomBytes } from 'node:crypto'
import { encryptPaymentCredential } from '@/lib/payment-credentials'
import { getMercadoPagoOAuthConfig, isMercadoPagoPreviewEnvironment } from '@/lib/mercadopago'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

function createBase64UrlSecret(bytes: number) {
  return randomBytes(bytes).toString('base64url')
}

export async function POST(_request: Request, context: RouteContext) {
  const { response: authErrorResponse, auth } = await ensureAuthorizedApiAccess(['admin'])
  if (authErrorResponse || !auth) return authErrorResponse

  if (isMercadoPagoPreviewEnvironment()) {
    return Response.json({ error: 'La vinculación de cuentas reales está deshabilitada en los deploys Preview.' }, { status: 503 })
  }

  const adminClient = getSupabaseAdminClient()
  const oauth = getMercadoPagoOAuthConfig()
  if (!adminClient || !oauth) {
    return Response.json({ error: 'La conexión de cuentas Mercado Pago todavía no está configurada.' }, { status: 503 })
  }

  const { id: eventId } = await context.params
  const { data: event, error: eventError } = await adminClient
    .from('events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle()
  if (eventError) return Response.json({ error: eventError.message }, { status: 500 })
  if (!event) return Response.json({ error: 'No se encontró el evento.' }, { status: 404 })

  const state = createBase64UrlSecret(32)
  const verifier = createBase64UrlSecret(64)
  const challenge = createHash('sha256').update(verifier).digest('base64url')

  let encryptedVerifier
  try {
    encryptedVerifier = encryptPaymentCredential(verifier)
  } catch {
    return Response.json({ error: 'Falta configurar el cifrado seguro de cuentas de cobro.' }, { status: 503 })
  }

  const now = new Date()
  await adminClient
    .from('event_payment_oauth_states')
    .delete()
    .lt('expires_at', now.toISOString())

  const { error: stateError } = await adminClient.from('event_payment_oauth_states').insert({
    state_hash: createHash('sha256').update(state).digest('hex'),
    event_id: eventId,
    operator_user_id: auth.user.id,
    verifier_ciphertext: encryptedVerifier.ciphertext,
    verifier_iv: encryptedVerifier.iv,
    verifier_auth_tag: encryptedVerifier.authTag,
    expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
  })
  if (stateError) return Response.json({ error: 'No se pudo iniciar la conexión de la cuenta.' }, { status: 500 })

  const authorizationUrl = new URL('https://auth.mercadopago.com/authorization')
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('client_id', oauth.clientId)
  authorizationUrl.searchParams.set('redirect_uri', oauth.redirectUri)
  authorizationUrl.searchParams.set('state', state)
  authorizationUrl.searchParams.set('code_challenge', challenge)
  authorizationUrl.searchParams.set('code_challenge_method', 'S256')

  return Response.json({ data: { authorizationUrl: authorizationUrl.toString() } })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY no está configurada en el entorno.' }, { status: 503 })
  }

  const { id: eventId } = await context.params
  const { count, error: pendingTransactionsError } = await adminClient
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['created', 'pending'])
  if (pendingTransactionsError) return Response.json({ error: pendingTransactionsError.message }, { status: 500 })
  if ((count ?? 0) > 0) {
    return Response.json(
      { error: 'No se puede desvincular la cuenta mientras existan pagos de invitados pendientes.' },
      { status: 409 }
    )
  }

  const { error } = await adminClient.from('event_payment_accounts').delete().eq('event_id', eventId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}

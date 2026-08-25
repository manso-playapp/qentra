import { createHash } from 'node:crypto'
import { decryptPaymentCredential, encryptPaymentCredential } from '@/lib/payment-credentials'
import { getMercadoPagoOAuthConfig } from '@/lib/mercadopago'
import { getMercadoPagoTokenExpiry } from '@/lib/event-payment-account'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type OAuthTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user_id?: string | number
}

function eventRedirect(redirectUri: string, eventId: string, status: 'connected' | 'cancelled' | 'error') {
  const url = new URL(`/admin/events/${encodeURIComponent(eventId)}`, redirectUri)
  url.searchParams.set('paymentAccount', status)
  return Response.redirect(url)
}

export async function GET(request: Request) {
  const adminClient = getSupabaseAdminClient()
  const oauth = getMercadoPagoOAuthConfig()
  if (!adminClient || !oauth) {
    return Response.json({ error: 'La conexión de cuentas Mercado Pago todavía no está configurada.' }, { status: 503 })
  }

  const url = new URL(request.url)
  const state = url.searchParams.get('state')
  if (!state) return Response.json({ error: 'Falta el estado de autorización.' }, { status: 400 })

  // DELETE ... RETURNING consumes the one-time state atomically. A replay
  // cannot exchange the same authorization code a second time.
  const { data: oauthState, error: stateError } = await adminClient
    .from('event_payment_oauth_states')
    .delete()
    .eq('state_hash', createHash('sha256').update(state).digest('hex'))
    .select('event_id, verifier_ciphertext, verifier_iv, verifier_auth_tag, expires_at')
    .maybeSingle()

  if (stateError) return Response.json({ error: 'No se pudo verificar la conexión de la cuenta.' }, { status: 500 })
  if (!oauthState || new Date(oauthState.expires_at).getTime() < Date.now()) {
    return Response.json({ error: 'La conexión venció. Volvé a iniciarla desde el evento.' }, { status: 400 })
  }

  const providerError = url.searchParams.get('error')
  if (providerError) return eventRedirect(oauth.redirectUri, oauthState.event_id, 'cancelled')

  const code = url.searchParams.get('code')
  if (!code) return eventRedirect(oauth.redirectUri, oauthState.event_id, 'error')

  let verifier: string
  try {
    verifier = decryptPaymentCredential({
      ciphertext: oauthState.verifier_ciphertext,
      iv: oauthState.verifier_iv,
      authTag: oauthState.verifier_auth_tag,
    })
  } catch {
    return eventRedirect(oauth.redirectUri, oauthState.event_id, 'error')
  }

  const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: oauth.redirectUri,
      code_verifier: verifier,
    }),
    cache: 'no-store',
  })
  const token = (await tokenResponse.json().catch(() => null)) as OAuthTokenResponse | null
  if (!tokenResponse.ok || !token?.access_token || !token.refresh_token) {
    return eventRedirect(oauth.redirectUri, oauthState.event_id, 'error')
  }

  try {
    const encryptedAccessToken = encryptPaymentCredential(token.access_token)
    const encryptedRefreshToken = encryptPaymentCredential(token.refresh_token)
    const { error: accountError } = await adminClient.from('event_payment_accounts').upsert(
      {
        event_id: oauthState.event_id,
        provider: 'mercadopago',
        collector_id: token.user_id?.toString() ?? null,
        access_token_ciphertext: encryptedAccessToken.ciphertext,
        access_token_iv: encryptedAccessToken.iv,
        access_token_auth_tag: encryptedAccessToken.authTag,
        refresh_token_ciphertext: encryptedRefreshToken.ciphertext,
        refresh_token_iv: encryptedRefreshToken.iv,
        refresh_token_auth_tag: encryptedRefreshToken.authTag,
        access_token_expires_at: getMercadoPagoTokenExpiry(token.expires_in),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id' }
    )
    if (accountError) return eventRedirect(oauth.redirectUri, oauthState.event_id, 'error')
  } catch {
    return eventRedirect(oauth.redirectUri, oauthState.event_id, 'error')
  }

  return eventRedirect(oauth.redirectUri, oauthState.event_id, 'connected')
}

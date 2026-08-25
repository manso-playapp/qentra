import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptPaymentCredential, encryptPaymentCredential } from '@/lib/payment-credentials'
import { getMercadoPagoOAuthConfig } from '@/lib/mercadopago'

type OAuthTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number | string
  user_id?: string | number
  message?: string
}

type EventPaymentAccountRow = {
  event_id: string
  collector_id: string | null
  access_token_ciphertext: string
  access_token_iv: string
  access_token_auth_tag: string
  refresh_token_ciphertext: string | null
  refresh_token_iv: string | null
  refresh_token_auth_tag: string | null
  access_token_expires_at: string | null
}

export type EventPaymentAccessTokenResult =
  | { ok: true; accessToken: string; collectorId: string | null }
  | { ok: false; error: string }

function getTokenExpiry(expiresIn?: number | string) {
  const expiresInSeconds = typeof expiresIn === 'string' ? Number(expiresIn) : expiresIn
  if (!Number.isFinite(expiresInSeconds) || !expiresInSeconds || expiresInSeconds <= 0) return null
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

function expiresSoon(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= Date.now() + 5 * 60 * 1000
}

async function refreshMercadoPagoToken(refreshToken: string) {
  const oauth = getMercadoPagoOAuthConfig()
  if (!oauth) return { ok: false as const, error: 'La conexión de cuentas Mercado Pago todavía no está configurada.' }

  const response = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  })
  const payload = (await response.json().catch(() => null)) as OAuthTokenResponse | null

  if (!response.ok || !payload?.access_token) {
    return { ok: false as const, error: 'La cuenta receptora debe volver a vincularse antes de cobrar.' }
  }

  return { ok: true as const, payload }
}

/**
 * Returns the event responsible's token. It never falls back to Alista's
 * global account: guest money must always go to the event's collector.
 */
export async function getEventPaymentAccessToken(
  adminClient: SupabaseClient,
  eventId: string
): Promise<EventPaymentAccessTokenResult> {
  const { data, error } = await adminClient
    .from('event_payment_accounts')
    .select('event_id, collector_id, access_token_ciphertext, access_token_iv, access_token_auth_tag, refresh_token_ciphertext, refresh_token_iv, refresh_token_auth_tag, access_token_expires_at')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) return { ok: false, error: 'No se pudo consultar la cuenta receptora del evento.' }
  if (!data) return { ok: false, error: 'La responsable del evento todavía no vinculó su cuenta Mercado Pago.' }

  const account = data as EventPaymentAccountRow
  let accessToken: string

  try {
    accessToken = decryptPaymentCredential({
      ciphertext: account.access_token_ciphertext,
      iv: account.access_token_iv,
      authTag: account.access_token_auth_tag,
    })
  } catch {
    return { ok: false, error: 'No se pudo usar la cuenta receptora. Pedile a la responsable que la vincule nuevamente.' }
  }

  if (!expiresSoon(account.access_token_expires_at)) {
    return { ok: true, accessToken, collectorId: account.collector_id }
  }

  if (!account.refresh_token_ciphertext || !account.refresh_token_iv || !account.refresh_token_auth_tag) {
    return { ok: false, error: 'La cuenta receptora venció y debe volver a vincularse antes de cobrar.' }
  }

  let refreshToken: string
  try {
    refreshToken = decryptPaymentCredential({
      ciphertext: account.refresh_token_ciphertext,
      iv: account.refresh_token_iv,
      authTag: account.refresh_token_auth_tag,
    })
  } catch {
    return { ok: false, error: 'La cuenta receptora venció y debe volver a vincularse antes de cobrar.' }
  }

  const refreshed = await refreshMercadoPagoToken(refreshToken)
  if (!refreshed.ok) return refreshed

  const refreshedAccessToken = refreshed.payload.access_token
  if (!refreshedAccessToken) {
    return { ok: false, error: 'No se pudo renovar la cuenta receptora. Intentá nuevamente.' }
  }

  const encryptedAccessToken = encryptPaymentCredential(refreshedAccessToken)
  const encryptedRefreshToken = refreshed.payload.refresh_token
    ? encryptPaymentCredential(refreshed.payload.refresh_token)
    : null
  const { error: updateError } = await adminClient
    .from('event_payment_accounts')
    .update({
      access_token_ciphertext: encryptedAccessToken.ciphertext,
      access_token_iv: encryptedAccessToken.iv,
      access_token_auth_tag: encryptedAccessToken.authTag,
      refresh_token_ciphertext: encryptedRefreshToken?.ciphertext ?? account.refresh_token_ciphertext,
      refresh_token_iv: encryptedRefreshToken?.iv ?? account.refresh_token_iv,
      refresh_token_auth_tag: encryptedRefreshToken?.authTag ?? account.refresh_token_auth_tag,
      access_token_expires_at: getTokenExpiry(refreshed.payload.expires_in),
      collector_id: refreshed.payload.user_id?.toString() ?? account.collector_id,
      updated_at: new Date().toISOString(),
    })
    .eq('event_id', eventId)

  if (updateError) return { ok: false, error: 'No se pudo renovar la cuenta receptora. Intentá nuevamente.' }

  return {
    ok: true,
    accessToken: refreshedAccessToken,
    collectorId: refreshed.payload.user_id?.toString() ?? account.collector_id,
  }
}

export function getMercadoPagoTokenExpiry(expiresIn?: number | string) {
  return getTokenExpiry(expiresIn)
}

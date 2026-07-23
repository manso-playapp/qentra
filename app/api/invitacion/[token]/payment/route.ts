import { getPublicAppUrl } from '@/lib/public-url'
import { getCheckoutUrl, getMercadoPagoConfig } from '@/lib/mercadopago'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const adminClient = getSupabaseAdminClient()
  const mercadoPago = getMercadoPagoConfig()
  const appUrl = getPublicAppUrl()

  if (!adminClient || !mercadoPago || !appUrl) {
    return Response.json({ error: 'El cobro con Mercado Pago todavía no está configurado.' }, { status: 503 })
  }

  const { token } = await context.params
  const { data: invitation } = await adminClient
    .from('invitation_tokens')
    .select('guest_id, is_active, used_count, last_used_at')
    .eq('token', token)
    .maybeSingle()

  if (!invitation || !invitation.is_active || (invitation.used_count ?? 0) > 0 || invitation.last_used_at) {
    return Response.json({ error: 'La invitación ya no está disponible para cobrar.' }, { status: 409 })
  }

  const { data: guest, error: guestError } = await adminClient
    .from('guests')
    .select('id, event_id, guest_type_id, first_name, last_name, email, status, payment_status')
    .eq('id', invitation.guest_id)
    .maybeSingle()

  if (guestError || !guest || guest.payment_status !== 'pending' || guest.status !== 'registered') {
    return Response.json({ error: 'Primero confirmá la asistencia para continuar con el pago.' }, { status: 409 })
  }

  const [{ data: guestType }, { data: event }] = await Promise.all([
    adminClient.from('guest_types').select('name, payment_amount_cents').eq('id', guest.guest_type_id).maybeSingle(),
    adminClient.from('events').select('name, slug').eq('id', guest.event_id).maybeSingle(),
  ])
  const amountCents = guestType?.payment_amount_cents ?? 0
  if (!event || amountCents <= 0) {
    return Response.json({ error: 'Este tipo de invitado no tiene un importe de pago válido.' }, { status: 409 })
  }

  const externalReference = `alista_${crypto.randomUUID()}`
  const { data: transaction, error: transactionError } = await adminClient
    .from('payment_transactions')
    .insert({
      event_id: guest.event_id,
      guest_id: guest.id,
      guest_type_id: guest.guest_type_id,
      external_reference: externalReference,
      amount_cents: amountCents,
      status: 'created',
    })
    .select('id')
    .single()

  if (transactionError || !transaction) {
    return Response.json({ error: transactionError?.message || 'No se pudo preparar el pago.' }, { status: 500 })
  }

  const returnUrl = `${appUrl}/invitacion/${token}`
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${mercadoPago.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{
        id: transaction.id,
        title: `${event.name} · ${guestType?.name ?? 'Acceso'}`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: amountCents / 100,
      }],
      payer: { name: guest.first_name, surname: guest.last_name, email: guest.email || undefined },
      external_reference: externalReference,
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
      auto_return: 'approved',
    }),
  })
  const preference = (await response.json().catch(() => null)) as { id?: string; init_point?: string; sandbox_init_point?: string; message?: string } | null
  const checkoutUrl = preference ? getCheckoutUrl(preference, mercadoPago.mode) : null
  if (!response.ok || !preference?.id || !checkoutUrl) {
    await adminClient.from('payment_transactions').update({ status: 'rejected', status_detail: preference?.message || 'No se creó la preferencia.' }).eq('id', transaction.id)
    return Response.json({ error: preference?.message || 'No se pudo iniciar Mercado Pago.' }, { status: 502 })
  }

  await adminClient.from('payment_transactions').update({ provider_preference_id: preference.id, status: 'pending' }).eq('id', transaction.id)
  return Response.json({ data: { checkoutUrl } })
}

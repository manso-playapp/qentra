import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { getPaymentAppUrl } from '@/lib/public-url'
import {
  ALISTA_SERVICE_ACTIVATION_AMOUNT_CENTS,
  ALISTA_SERVICE_ACTIVATION_CURRENCY,
  buildActivationPaymentReference,
} from '@/lib/alista-service-payment'
import { getCheckoutUrl, getAlistaMercadoPagoConfig, isMercadoPagoPreviewEnvironment, resolveMercadoPagoMode } from '@/lib/mercadopago'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const { id: eventId } = await context.params
  const { response: authError, auth } = await ensureAuthorizedEventApiAccess(eventId)
  if (authError || !auth) return authError

  const adminClient = getSupabaseAdminClient()
  const appUrl = getPaymentAppUrl()
  if (!adminClient || !appUrl) {
    return Response.json({ error: 'El cobro de activación todavía no está configurado.' }, { status: 503 })
  }
  if (isMercadoPagoPreviewEnvironment()) {
    return Response.json({ error: 'El cobro de activación está deshabilitado en deploys Preview.' }, { status: 503 })
  }

  const { data: event, error: eventError } = await adminClient
    .from('events')
    .select('id, name, owner_user_id')
    .eq('id', eventId)
    .maybeSingle()
  if (eventError) return Response.json({ error: eventError.message }, { status: 500 })
  if (!event) return Response.json({ error: 'No se encontró el evento.' }, { status: 404 })

  // El comprador es la responsable/dueña. Un colaborador puede administrar
  // invitados, pero no puede iniciar un cobro a nombre de la responsable.
  if (event.owner_user_id !== auth.user.id) {
    return Response.json({ error: 'Solo la responsable del evento puede activarlo.' }, { status: 403 })
  }

  const { data: activation } = await adminClient
    .from('event_activations')
    .select('status')
    .eq('event_id', eventId)
    .maybeSingle()
  if (activation?.status === 'active') {
    return Response.json({ error: 'Este evento ya está activado.' }, { status: 409 })
  }

  const { data: openPayment } = await adminClient
    .from('event_activation_payments')
    .select('id, checkout_url, status')
    .eq('event_id', eventId)
    .in('status', ['created', 'pending'])
    .maybeSingle()
  if (openPayment?.checkout_url) {
    return Response.json({ data: { checkoutUrl: openPayment.checkout_url, status: openPayment.status } })
  }

  const mercadoPago = getAlistaMercadoPagoConfig()
  if (!mercadoPago) {
    return Response.json({ error: 'Falta configurar la cuenta Mercado Pago de Alista.' }, { status: 503 })
  }

  const paymentId = crypto.randomUUID()
  const externalReference = buildActivationPaymentReference(paymentId)
  const { data: payment, error: paymentError } = await adminClient
    .from('event_activation_payments')
    .insert({
      id: paymentId,
      event_id: eventId,
      payer_user_id: auth.user.id,
      external_reference: externalReference,
      amount_cents: ALISTA_SERVICE_ACTIVATION_AMOUNT_CENTS,
      currency_id: ALISTA_SERVICE_ACTIVATION_CURRENCY,
      status: 'created',
    })
    .select('id')
    .single()
  if (paymentError || !payment) {
    // Si dos clics llegaron juntos, la restricción de un checkout abierto
    // puede haber dejado al otro intento listo para reutilizar.
    const { data: existingPayment } = await adminClient
      .from('event_activation_payments')
      .select('checkout_url, status')
      .eq('event_id', eventId)
      .in('status', ['created', 'pending'])
      .maybeSingle()
    if (existingPayment?.checkout_url) {
      return Response.json({ data: { checkoutUrl: existingPayment.checkout_url, status: existingPayment.status } })
    }
    return Response.json({ error: paymentError?.message || 'No se pudo preparar el pago.' }, { status: 500 })
  }

  const notificationUrl = new URL('/api/mercadopago/webhook', appUrl)
  notificationUrl.searchParams.set('activation_payment_id', payment.id)
  const successUrl = new URL(`/admin/events/${eventId}`, appUrl)
  successUrl.searchParams.set('activationPayment', 'success')
  const pendingUrl = new URL(`/admin/events/${eventId}`, appUrl)
  pendingUrl.searchParams.set('activationPayment', 'pending')
  const failureUrl = new URL(`/admin/events/${eventId}`, appUrl)
  failureUrl.searchParams.set('activationPayment', 'failure')

  const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${mercadoPago.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{
        id: 'alista-event-activation',
        title: `Activación de evento Alista · ${event.name}`,
        quantity: 1,
        currency_id: ALISTA_SERVICE_ACTIVATION_CURRENCY,
        unit_price: ALISTA_SERVICE_ACTIVATION_AMOUNT_CENTS / 100,
      }],
      payer: auth.user.email ? { email: auth.user.email } : undefined,
      external_reference: externalReference,
      notification_url: notificationUrl.toString(),
      back_urls: { success: successUrl.toString(), pending: pendingUrl.toString(), failure: failureUrl.toString() },
      auto_return: 'approved',
    }),
  })
  const preference = (await preferenceResponse.json().catch(() => null)) as {
    id?: string
    init_point?: string
    sandbox_init_point?: string
    message?: string
  } | null
  const checkoutUrl = preference ? getCheckoutUrl(preference, resolveMercadoPagoMode()) : null

  if (!preferenceResponse.ok || !preference?.id || !checkoutUrl) {
    await adminClient
      .from('event_activation_payments')
      .update({ status: 'rejected', status_detail: preference?.message || 'No se creó la preferencia.', updated_at: new Date().toISOString() })
      .eq('id', payment.id)
    return Response.json({ error: preference?.message || 'No se pudo iniciar Mercado Pago.' }, { status: 502 })
  }

  const { error: updateError } = await adminClient
    .from('event_activation_payments')
    .update({ provider_preference_id: preference.id, checkout_url: checkoutUrl, status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', payment.id)
  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  return Response.json({ data: { checkoutUrl, status: 'pending' } })
}

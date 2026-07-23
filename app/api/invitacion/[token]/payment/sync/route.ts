import QRCode from 'qrcode'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { buildGuestFullName } from '@/lib/guest-schema'
import { getMercadoPagoConfig, mapMercadoPagoPaymentStatus } from '@/lib/mercadopago'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string }> }

type MercadoPagoPayment = {
  id?: string | number
  status?: string
  status_detail?: string
  transaction_amount?: number
  currency_id?: string
  date_approved?: string | null
}

type PaymentSearchResponse = { results?: MercadoPagoPayment[] }

export async function POST(_request: Request, context: RouteContext) {
  const adminClient = getSupabaseAdminClient()
  const mercadoPago = getMercadoPagoConfig()
  if (!adminClient || !mercadoPago) {
    return Response.json({ error: 'El cobro con Mercado Pago todavía no está configurado.' }, { status: 503 })
  }

  const { token } = await context.params
  const { data: invitation } = await adminClient
    .from('invitation_tokens')
    .select('guest_id, is_active, used_count, last_used_at, created_at')
    .eq('token', token)
    .maybeSingle()

  if (!invitation || !invitation.is_active || (invitation.used_count ?? 0) > 0 || invitation.last_used_at) {
    return Response.json({ error: 'La invitación ya no está disponible.' }, { status: 409 })
  }

  const { data: guest, error: guestError } = await adminClient
    .from('guests')
    .select('id, event_id, first_name, last_name, payment_status, status')
    .eq('id', invitation.guest_id)
    .maybeSingle()
  if (guestError || !guest) return Response.json({ error: 'No se encontró el invitado.' }, { status: 404 })

  if (guest.payment_status === 'approved') return Response.json({ status: 'approved' })

  const { data: transactions, error: transactionsError } = await adminClient
    .from('payment_transactions')
    .select('id, external_reference, amount_cents, currency_id')
    .eq('guest_id', guest.id)
    .in('status', ['created', 'pending'])
    .order('created_at', { ascending: false })
    .limit(10)
  if (transactionsError) throw transactionsError

  for (const transaction of transactions ?? []) {
    const searchUrl = new URL('https://api.mercadopago.com/v1/payments/search')
    searchUrl.searchParams.set('sort', 'date_created')
    searchUrl.searchParams.set('criteria', 'desc')
    searchUrl.searchParams.set('external_reference', transaction.external_reference)
    searchUrl.searchParams.set('range', 'date_created')
    searchUrl.searchParams.set('begin_date', 'NOW-30DAYS')
    searchUrl.searchParams.set('end_date', 'NOW')

    const paymentResponse = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${mercadoPago.accessToken}` },
      cache: 'no-store',
    })
    const searchResult = (await paymentResponse.json().catch(() => null)) as PaymentSearchResponse | null
    const payment = searchResult?.results?.[0]
    if (!paymentResponse.ok || !payment?.id) continue

    const amountCents = Math.round((payment.transaction_amount ?? 0) * 100)
    if (amountCents !== transaction.amount_cents || payment.currency_id !== transaction.currency_id) continue

    const status = mapMercadoPagoPaymentStatus(payment.status)
    const { error: transactionUpdateError } = await adminClient
      .from('payment_transactions')
      .update({
        provider_payment_id: payment.id.toString(),
        status,
        status_detail: payment.status_detail ?? null,
        paid_at: status === 'approved' ? payment.date_approved ?? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)
    if (transactionUpdateError) throw transactionUpdateError

    if (status !== 'approved') continue

    const [{ data: event }, { error: guestUpdateError }] = await Promise.all([
      adminClient.from('events').select('slug').eq('id', guest.event_id).maybeSingle(),
      adminClient
        .from('guests')
        .update({ payment_status: 'approved', status: 'enabled', updated_at: new Date().toISOString() })
        .eq('id', guest.id)
        .eq('payment_status', 'pending')
        .eq('status', 'registered'),
    ])
    if (guestUpdateError) throw guestUpdateError

    const qrValue = buildGuestAccessQrPayload({
      eventId: guest.event_id,
      eventSlug: event?.slug,
      guestId: guest.id,
      guestName: buildGuestFullName(guest.first_name, guest.last_name),
      token,
      issuedAt: invitation.created_at,
    })
    const qrImageUrl = await QRCode.toDataURL(qrValue, { errorCorrectionLevel: 'M', margin: 1, width: 256 })
    const { error: qrError } = await adminClient.from('guest_qr_codes').upsert(
      { guest_id: guest.id, qr_value: qrValue, qr_image_url: qrImageUrl, is_active: true, revoked_at: null },
      { onConflict: 'guest_id' }
    )
    if (qrError) throw qrError

    return Response.json({ status: 'approved' })
  }

  return Response.json({ status: 'pending' })
}

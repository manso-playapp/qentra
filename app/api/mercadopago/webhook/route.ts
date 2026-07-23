import { createHmac, timingSafeEqual } from 'node:crypto'
import QRCode from 'qrcode'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { buildGuestFullName } from '@/lib/guest-schema'
import { getMercadoPagoConfig, mapMercadoPagoPaymentStatus } from '@/lib/mercadopago'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type MercadoPagoNotification = {
  type?: string
  data?: { id?: string | number }
}

type MercadoPagoPayment = {
  id?: string | number
  status?: string
  status_detail?: string
  external_reference?: string
  transaction_amount?: number
  currency_id?: string
  date_approved?: string | null
}

function validWebhookSignature(request: Request, dataId: string, secret: string) {
  const signature = request.headers.get('x-signature')
  if (!signature) return false

  const values = Object.fromEntries(
    signature.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=')
      return [key, rest.join('=')]
    })
  )
  const timestamp = values.ts
  const receivedHash = values.v1
  if (!timestamp || !receivedHash) return false

  const requestId = request.headers.get('x-request-id')
  const manifest = [
    `id:${dataId.toLowerCase()};`,
    requestId ? `request-id:${requestId};` : '',
    `ts:${timestamp};`,
  ].join('')
  const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex')
  const expected = Buffer.from(expectedHash, 'utf8')
  const received = Buffer.from(receivedHash, 'utf8')

  return expected.length === received.length && timingSafeEqual(expected, received)
}

async function issueApprovedGuestQr(
  adminClient: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  guestId: string,
  eventId: string
) {
  const [{ data: guest }, { data: event }, { data: invitationToken }] = await Promise.all([
    adminClient.from('guests').select('first_name, last_name').eq('id', guestId).maybeSingle(),
    adminClient.from('events').select('slug').eq('id', eventId).maybeSingle(),
    adminClient
      .from('invitation_tokens')
      .select('token, created_at')
      .eq('guest_id', guestId)
      .eq('is_active', true)
      .eq('used_count', 0)
      .is('last_used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!guest || !invitationToken) return

  const qrValue = buildGuestAccessQrPayload({
    eventId,
    eventSlug: event?.slug,
    guestId,
    guestName: buildGuestFullName(guest.first_name, guest.last_name),
    token: invitationToken.token,
    issuedAt: invitationToken.created_at,
  })
  const qrImageUrl = await QRCode.toDataURL(qrValue, { errorCorrectionLevel: 'M', margin: 1, width: 256 })

  const { error } = await adminClient.from('guest_qr_codes').upsert(
    { guest_id: guestId, qr_value: qrValue, qr_image_url: qrImageUrl, is_active: true, revoked_at: null },
    { onConflict: 'guest_id' }
  )
  if (error) throw error
}

async function syncGuestAccessFromPayments(
  adminClient: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  guestId: string,
  eventId: string
) {
  const { data: approvedTransaction, error: approvedTransactionError } = await adminClient
    .from('payment_transactions')
    .select('id')
    .eq('guest_id', guestId)
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle()
  if (approvedTransactionError) throw approvedTransactionError

  if (approvedTransaction) {
    const { error: updateGuestError } = await adminClient
      .from('guests')
      .update({ payment_status: 'approved', status: 'enabled', updated_at: new Date().toISOString() })
      .eq('id', guestId)
      .eq('payment_status', 'pending')
      .eq('status', 'registered')
    if (updateGuestError) throw updateGuestError

    await issueApprovedGuestQr(adminClient, guestId, eventId)
    return
  }

  // A refund, cancellation or chargeback must close the access that payment
  // previously unlocked. Keep checked-in guests intact for audit purposes.
  const { error: updateGuestError } = await adminClient
    .from('guests')
    .update({ payment_status: 'pending', status: 'registered', updated_at: new Date().toISOString() })
    .eq('id', guestId)
    .eq('payment_status', 'approved')
    .eq('status', 'enabled')
  if (updateGuestError) throw updateGuestError

  const { error: revokeQrError } = await adminClient
    .from('guest_qr_codes')
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq('guest_id', guestId)
    .eq('is_active', true)
  if (revokeQrError) throw revokeQrError
}

export async function POST(request: Request) {
  const adminClient = getSupabaseAdminClient()
  const mercadoPago = getMercadoPagoConfig()
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()
  if (!adminClient || !mercadoPago || !webhookSecret) {
    return Response.json({ error: 'Webhook de Mercado Pago no configurado.' }, { status: 503 })
  }

  const notification = (await request.json().catch(() => null)) as MercadoPagoNotification | null
  const dataId = new URL(request.url).searchParams.get('data.id') ?? notification?.data?.id?.toString()
  if (!dataId || (notification?.type && notification.type !== 'payment')) {
    return Response.json({ ok: true })
  }

  if (!validWebhookSignature(request, dataId, webhookSecret)) {
    return Response.json({ error: 'Firma de webhook inválida.' }, { status: 401 })
  }

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
    headers: { Authorization: `Bearer ${mercadoPago.accessToken}` },
  })
  const payment = (await paymentResponse.json().catch(() => null)) as MercadoPagoPayment | null
  if (!paymentResponse.ok || !payment?.external_reference || !payment.id) {
    return Response.json({ error: 'No se pudo verificar el pago informado.' }, { status: 502 })
  }

  const { data: transaction, error: transactionError } = await adminClient
    .from('payment_transactions')
    .select('id, event_id, guest_id, amount_cents, currency_id, provider_preference_id')
    .eq('external_reference', payment.external_reference)
    .maybeSingle()
  if (transactionError) throw transactionError
  if (!transaction) return Response.json({ ok: true })

  const amountCents = Math.round((payment.transaction_amount ?? 0) * 100)
  if (amountCents !== transaction.amount_cents || payment.currency_id !== transaction.currency_id) {
    return Response.json({ error: 'El importe o moneda del pago no coincide.' }, { status: 409 })
  }

  const status = mapMercadoPagoPaymentStatus(payment.status)
  const { error: updateTransactionError } = await adminClient
    .from('payment_transactions')
    .update({
      provider_payment_id: payment.id.toString(),
      status,
      status_detail: payment.status_detail ?? null,
      paid_at: status === 'approved' ? payment.date_approved ?? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transaction.id)
  if (updateTransactionError) throw updateTransactionError

  await syncGuestAccessFromPayments(adminClient, transaction.guest_id, transaction.event_id)

  return Response.json({ ok: true })
}

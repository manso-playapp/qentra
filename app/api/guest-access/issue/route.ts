import QRCode from 'qrcode'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { isInvitationAccessReady, parseInvitationDetails } from '@/lib/invitation-response'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

type IssueGuestAccessRequestBody = {
  guestId?: string
  eventId?: string
  eventSlug?: string
  eventDate?: string
  eventStartTime?: string
  guestName?: string
}

function buildInvitationExpiry(eventDate: string, eventStartTime: string) {
  const baseDate = new Date(`${eventDate}T${eventStartTime || '20:00'}:00`)

  if (Number.isNaN(baseDate.getTime())) {
    const fallback = new Date()
    fallback.setDate(fallback.getDate() + 7)
    return fallback.toISOString()
  }

  baseDate.setHours(baseDate.getHours() + 12)
  return baseDate.toISOString()
}

function buildGuestAccessToken() {
  return `qentra_${crypto.randomUUID().replace(/-/g, '')}`
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  try {
    const body = (await request.json()) as IssueGuestAccessRequestBody

    if (!body.guestId || !body.eventId || !body.eventDate || !body.eventStartTime) {
      return Response.json(
        { error: 'Faltan datos para emitir el acceso del invitado.' },
        { status: 400 }
      )
    }

    const tokenValue = buildGuestAccessToken()
    const expiresAt = buildInvitationExpiry(body.eventDate, body.eventStartTime)
    const { data: guestData, error: guestError } = await adminClient
      .from('guests')
      .select('status, notes')
      .eq('id', body.guestId)
      .single()

    if (guestError) {
      throw guestError
    }

    const { data: tokenData, error: tokenError } = await adminClient
      .from('invitation_tokens')
      .insert({
        guest_id: body.guestId,
        token: tokenValue,
        expires_at: expiresAt,
        max_uses: 1,
        used_count: 0,
        is_active: true,
      })
      .select()
      .single()

    if (tokenError) {
      throw tokenError
    }

    const revokedAt = new Date().toISOString()

    const { error: revokeQrError } = await adminClient
      .from('guest_qr_codes')
      .update({ is_active: false, revoked_at: revokedAt })
      .eq('guest_id', body.guestId)
      .eq('is_active', true)

    if (revokeQrError) {
      throw revokeQrError
    }
    const invitationDetails = parseInvitationDetails(guestData?.notes)
    const accessReady = isInvitationAccessReady(guestData?.status, invitationDetails.paymentStatus)
    let qrData = null

    if (accessReady) {
      const qrPayload = buildGuestAccessQrPayload({
        eventId: body.eventId,
        eventSlug: body.eventSlug,
        guestId: body.guestId,
        guestName: body.guestName,
        token: tokenValue,
      })

      const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
      })

      const qrResponse = await adminClient
        .from('guest_qr_codes')
        .upsert({
          guest_id: body.guestId,
          qr_value: qrPayload,
          qr_image_url: qrCodeUrl,
          is_active: true,
          revoked_at: null,
        }, {
          onConflict: 'guest_id',
        })
        .select()
        .single()

      if (qrResponse.error) {
        throw qrResponse.error
      }

      qrData = qrResponse.data
    }

    return Response.json({
      data: {
        invitationToken: tokenData,
        qrCode: qrData,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo emitir el acceso.'
    return Response.json({ error: message }, { status: 500 })
  }
}

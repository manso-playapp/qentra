import QRCode from 'qrcode'
import { getActivationBlockedMessage, resolveActivation } from '@/lib/event-activation'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { buildInvitationExpiry } from '@/lib/invitation-expiry'
import { isInvitationAccessReady } from '@/lib/invitation-response'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

/** La app puede desplegarse unos segundos antes que la migración. */
function isMissingActivationsTable(code: string | undefined) {
  return code === 'PGRST205' || code === '42P01'
}

type IssueGuestAccessRequestBody = {
  guestId?: string
  eventId?: string
  eventSlug?: string
  eventDate?: string
  eventStartTime?: string
  guestName?: string
}

function buildGuestAccessToken() {
  return `alista_${crypto.randomUUID().replace(/-/g, '')}`
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IssueGuestAccessRequestBody

    if (!body.guestId || !body.eventId || !body.eventDate || !body.eventStartTime) {
      return Response.json(
        { error: 'Faltan datos para emitir el acceso del invitado.' },
        { status: 400 }
      )
    }

    const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(body.eventId)
    if (authErrorResponse) return authErrorResponse

    const adminClient = getSupabaseAdminClient()
    if (!adminClient) {
      return Response.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
        { status: 503 }
      )
    }

    // Muro de activación. Es el único punto donde se emiten `invitation_tokens`,
    // así que alcanza con cortar acá. No bloquea editar ni cargar invitados: la
    // dueña llega a sus datos siempre.
    const { data: activationData, error: activationError } = await adminClient
      .from('event_activations')
      .select('status, source, expires_at')
      .eq('event_id', body.eventId)
      .maybeSingle()

    if (activationError && !isMissingActivationsTable(activationError.code)) {
      throw activationError
    }

    // Si la tabla todavía no existe (despliegue antes que la migración) no se
    // bloquea nada: el muro se activa cuando la migración está aplicada.
    if (!activationError) {
      const activationState = resolveActivation(activationData)

      if (!activationState.activated) {
        return Response.json(
          { error: getActivationBlockedMessage(activationState), reason: activationState.reason },
          { status: 402 }
        )
      }
    }

    const tokenValue = buildGuestAccessToken()
    const expiresAt = buildInvitationExpiry(body.eventDate, body.eventStartTime)
    const { data: guestData, error: guestError } = await adminClient
      .from('guests')
      .select('event_id, status, notes, payment_status')
      .eq('id', body.guestId)
      .single()

    if (guestError) {
      throw guestError
    }
    if (guestData.event_id !== body.eventId) {
      return Response.json({ error: 'El invitado no pertenece al evento autorizado.' }, { status: 400 })
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
    const accessReady = isInvitationAccessReady(
      guestData?.status,
      (guestData?.payment_status ?? 'not_required') as 'not_required' | 'pending' | 'approved'
    )
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

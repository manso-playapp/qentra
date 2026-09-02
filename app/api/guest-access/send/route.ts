import { sendGuestAccess } from '@/lib/access-delivery'
import { persistDeliveryLog } from '@/lib/delivery-logs'
import {
  isMissingInvitationDeliveryTableError,
  upsertInvitationDeliveryStatus,
} from '@/lib/invitation-delivery-tracking'
import { isInvitationExpired } from '@/lib/invitation-expiry'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type DeliveryRequestBody = {
  eventId?: string
  guestId?: string
  invitationTokenId?: string
  channel?: 'email'
  recipient?: string
  guestName?: string
  guestFirstName?: string
  eventName?: string
  invitationUrl?: string
  expiresAt?: string
  confirmationDeadline?: string | null
}

export async function POST(request: Request) {
  let body: DeliveryRequestBody | null = null

  try {
    body = (await request.json()) as DeliveryRequestBody

    if (
      !body.eventId ||
      !body.guestId ||
      !body.invitationTokenId ||
      body.channel !== 'email' ||
      !body.recipient ||
      !body.guestName ||
      !body.guestFirstName ||
      !body.eventName ||
      !body.invitationUrl ||
      !body.expiresAt
    ) {
      return Response.json(
        { error: 'Faltan datos para enviar el acceso.' },
        { status: 400 }
      )
    }

    const { response: authErrorResponse, auth } = await ensureAuthorizedEventApiAccess(body.eventId)
    if (authErrorResponse) return authErrorResponse

    const adminClient = getSupabaseAdminClient()
    if (!adminClient) {
      return Response.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
        { status: 503 }
      )
    }

    const [{ data: guest, error: guestError }, { data: invitationToken, error: tokenError }] = await Promise.all([
      adminClient
        .from('guests')
        .select('id, event_id')
        .eq('id', body.guestId)
        .maybeSingle(),
      adminClient
        .from('invitation_tokens')
        .select('id, guest_id, expires_at, is_active')
        .eq('id', body.invitationTokenId)
        .maybeSingle(),
    ])

    if (guestError) throw guestError
    if (tokenError) throw tokenError
    if (!guest || guest.event_id !== body.eventId) {
      return Response.json({ error: 'El invitado no pertenece a este evento.' }, { status: 404 })
    }
    if (
      !invitationToken ||
      invitationToken.guest_id !== guest.id ||
      !invitationToken.is_active ||
      isInvitationExpired(invitationToken.expires_at)
    ) {
      return Response.json({ error: 'La invitacion esta vencida o no pertenece a este invitado.' }, { status: 409 })
    }

    const result = await sendGuestAccess({
      channel: body.channel,
      recipient: body.recipient,
      guestName: body.guestName,
      guestFirstName: body.guestFirstName,
      eventName: body.eventName,
      invitationUrl: body.invitationUrl,
      expiresAt: body.expiresAt,
      confirmationDeadline: body.confirmationDeadline,
    })

    try {
      await persistDeliveryLog({
        event_id: body.eventId,
        guest_id: body.guestId,
        invitation_token_id: body.invitationTokenId,
        channel: body.channel,
        provider: result.provider,
        recipient: body.recipient,
        status: 'sent',
        external_id: result.externalId,
      })
    } catch (logError) {
      console.error('No se pudo guardar el delivery_log exitoso', logError)
    }

    try {
      await upsertInvitationDeliveryStatus({
        adminClient,
        eventId: body.eventId,
        guestId: guest.id,
        invitationTokenId: invitationToken.id,
        channel: 'email',
        status: 'marked_sent',
        actorUserId: auth?.user.id,
      })
    } catch (trackingError) {
      // El correo ya salió: una falla del tracking no debe convertir un envio
      // exitoso en un error ni provocar reintentos duplicados.
      if (!isMissingInvitationDeliveryTableError(trackingError)) {
        console.error('No se pudo guardar el seguimiento del email enviado', trackingError)
      }
    }

    return Response.json({
      ok: true,
      provider: result.provider,
      externalId: result.externalId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar el acceso.'

    try {
      if (body?.eventId && body.guestId && body.channel && body.recipient) {
        await persistDeliveryLog({
          event_id: body.eventId,
          guest_id: body.guestId,
          invitation_token_id: body.invitationTokenId,
          channel: body.channel,
          recipient: body.recipient,
          status: 'failed',
          error_message: message,
        })
      }
    } catch (logError) {
      console.error('No se pudo guardar el delivery_log fallido', logError)
    }

    return Response.json({ error: message }, { status: 500 })
  }
}

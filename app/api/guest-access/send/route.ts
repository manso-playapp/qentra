import { sendGuestAccess } from '@/lib/access-delivery'
import { persistDeliveryLog } from '@/lib/delivery-logs'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'

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

    const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(body.eventId)
    if (authErrorResponse) return authErrorResponse

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

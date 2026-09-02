import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { isInvitationExpired } from '@/lib/invitation-expiry'
import {
  isMissingInvitationDeliveryTableError,
  recordInvitationLinkOpened,
} from '@/lib/invitation-delivery-tracking'

export const runtime = 'nodejs'

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  const adminClient = getSupabaseAdminClient()

  // El tracking nunca puede convertir una invitacion visible en un error.
  // Si el servicio no está configurado o la migración todavía no fue aplicada,
  // la invitación pública continúa funcionando.
  if (!adminClient || !token.trim()) {
    return new Response(null, { status: 204 })
  }

  try {
    const { data: invitation, error: invitationError } = await adminClient
      .from('invitation_tokens')
      .select('id, guest_id, expires_at, is_active')
      .eq('token', token)
      .maybeSingle()

    if (invitationError) throw invitationError
    if (!invitation || !invitation.is_active || isInvitationExpired(invitation.expires_at)) {
      return new Response(null, { status: 204 })
    }

    const { data: guest, error: guestError } = await adminClient
      .from('guests')
      .select('id, event_id')
      .eq('id', invitation.guest_id)
      .maybeSingle()

    if (guestError) throw guestError
    if (!guest) return new Response(null, { status: 204 })

    await recordInvitationLinkOpened({
      adminClient,
      eventId: guest.event_id,
      guestId: guest.id,
      invitationTokenId: invitation.id,
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    if (!isMissingInvitationDeliveryTableError(error)) {
      console.error('[invitacion] no se pudo registrar la visita', error)
    }
    return new Response(null, { status: 204 })
  }
}

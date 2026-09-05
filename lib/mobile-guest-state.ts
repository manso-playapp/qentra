import type { GuestWithType, InvitationDeliveryTracking, InvitationToken } from '@/types'

// El envío, la respuesta y el pago son hechos distintos. link_sent sólo dice
// que existe un enlace; nunca demuestra un envío por WhatsApp.
export function mobileGuestState(guest: GuestWithType, token?: InvitationToken, tracking?: InvitationDeliveryTracking) {
  const inactive = guest.status === 'cancelled' || guest.db_status === 'rejected' || guest.db_status === 'duplicate'
  const responded = guest.status === 'confirmed' || guest.status === 'checked_in' || guest.db_status === 'registered' || guest.db_status === 'enabled'
  const marked = tracking?.status === 'marked_sent'
  const opened = Boolean(tracking?.first_opened_at)
  return {
    inactive,
    responded,
    needsReply: !inactive && !responded,
    needsPayment: !inactive && guest.payment_status === 'pending',
    unmarked: !inactive && !responded && Boolean(token) && !marked && !opened,
    delivery: marked ? 'Marcada como enviada' : opened ? 'Invitación visitada' : responded ? 'Respuesta recibida' : token ? 'Sin registro de envío' : 'Sin invitación generada',
    response: inactive ? 'No habilitado' : guest.status === 'checked_in' ? 'Ya ingresó' : responded ? 'Confirmó asistencia' : 'Sin respuesta',
  }
}

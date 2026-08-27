export type InvitationMessageParams = {
  guestFirstName: string
  eventName: string
  invitationUrl: string
  confirmationDeadline: string
}

/**
 * Plantilla única para el mensaje de acceso por WhatsApp.
 * Mantener las variables limitadas evita que el botón manual y el proveedor
 * automático terminen mostrando copys diferentes.
 */
export function buildInvitationWhatsAppMessage({
  guestFirstName,
  eventName,
  invitationUrl,
  confirmationDeadline,
}: InvitationMessageParams) {
  return [
    `Hola ${guestFirstName}!`,
    `Estás invitado/a al cumple de ${eventName}.`,
    'Te mando el link para que te registres, te espero!',
    'Abrir Invitación:',
    invitationUrl,
    `Fecha límite para confirmar: ${confirmationDeadline}`,
  ].join('\n')
}

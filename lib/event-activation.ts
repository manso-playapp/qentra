/**
 * Habilitacion comercial del evento, sin dependencias de red.
 *
 * Es ESTADO, no permiso. La duena entra a su evento y edita siempre, haya
 * pagado o no; lo unico que la activacion gobierna es si se pueden **emitir**
 * los links de invitacion.
 *
 * Por que los links y no "el envio": Alista no envia nada. La invitacion sale
 * del WhatsApp personal de la quinceañera (§12 del canonico), asi que no hay un
 * boton de enviar que bloquear. Lo que si es bloqueable —y honesto— es la
 * emision del token. Ver `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` §4.
 */

export type ActivationStatus = 'active' | 'revoked'

/** 'cortesia' habilita sin inventar un pago de $0 (§22 del canonico). */
export type ActivationSource = 'payment' | 'cortesia' | 'manual'

export type EventActivation = {
  status: ActivationStatus
  source: ActivationSource
  expires_at?: string | null
}

export type ActivationState =
  | { activated: true; source: ActivationSource }
  | { activated: false; reason: 'never_activated' | 'revoked' | 'expired' }

export function resolveActivation(
  activation: EventActivation | null | undefined,
  now: Date = new Date()
): ActivationState {
  if (!activation) {
    return { activated: false, reason: 'never_activated' }
  }

  if (activation.status === 'revoked') {
    return { activated: false, reason: 'revoked' }
  }

  if (activation.expires_at) {
    const expiresAt = new Date(activation.expires_at)
    // Una fecha ilegible no debe habilitar por accidente: se trata como vencida.
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
      return { activated: false, reason: 'expired' }
    }
  }

  return { activated: true, source: activation.source }
}

export function isEventActivated(
  activation: EventActivation | null | undefined,
  now: Date = new Date()
): boolean {
  return resolveActivation(activation, now).activated
}

export const ALISTA_CONTACT_EMAIL = 'hola@alista.com.ar'

/**
 * Salida concreta desde el muro.
 *
 * Apunta a una conversacion con Alista, NO a un checkout: el precio de
 * lanzamiento todavia no esta validado (§42 del canonico), y estas primeras
 * conversaciones son justamente como se valida. Cuando el cobro exista, cambia
 * el destino de este link y nada mas.
 */
export function buildActivationRequestHref(event: {
  id: string
  name: string
  event_date?: string | null
}) {
  const subject = `Quiero activar mi evento: ${event.name}`
  const body = [
    `Hola, quiero activar mi evento en Alista.`,
    ``,
    `Evento: ${event.name}`,
    event.event_date ? `Fecha: ${event.event_date}` : null,
    `Referencia: ${event.id}`,
    ``,
    `¿Me cuentan cómo sigo?`,
  ]
    .filter((line) => line !== null)
    .join('\n')

  return `mailto:${ALISTA_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Mensaje para la duena cuando intenta emitir invitaciones sin activar.
 *
 * El encuadre es "activá tu evento", no "pagá para enviar": es lo que el
 * producto puede sostener de verdad.
 */
export function getActivationBlockedMessage(state: ActivationState): string {
  if (state.activated) return ''

  switch (state.reason) {
    case 'revoked':
      return 'La activación de este evento fue dada de baja. Escribinos para reactivarlo.'
    case 'expired':
      return 'La activación de este evento venció. Escribinos para reactivarlo.'
    default:
      return 'Activá tu evento para empezar a emitir las invitaciones. Mientras tanto podés seguir configurándolo y cargando invitados.'
  }
}

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
  /** Primer ingreso registrado: la fiesta ocurrio. Ver §4 bis del doc de propiedad y pagos. */
  consumed_at?: string | null
  /** `events.event_date` al momento de consumirse. */
  consumed_for_date?: string | null
}

export type ActivationState =
  | { activated: true; source: ActivationSource }
  | { activated: false; reason: 'never_activated' | 'revoked' | 'expired' | 'consumed' }

/**
 * `eventDate` es la fecha actual del evento. Sin ella no se puede distinguir
 * "sigo operando mi fiesta" de "estoy montando otra sobre la misma fila", asi
 * que en su ausencia la activacion consumida NO se invalida: preferimos no
 * cortar la emision por no saber, antes que cortarla de mas.
 */
export function resolveActivation(
  activation: EventActivation | null | undefined,
  now: Date = new Date(),
  eventDate?: string | null
): ActivationState {
  if (!activation) {
    return { activated: false, reason: 'never_activated' }
  }

  if (activation.status === 'revoked') {
    return { activated: false, reason: 'revoked' }
  }

  // La fiesta ya se celebro. Mientras la fecha siga siendo la misma, todo lo de
  // esa noche sigue funcionando —reponer un QR perdido a las 2 de la manana no
  // puede depender de un pago—. Moverla es empezar otra fiesta.
  if (activation.consumed_at && activation.consumed_for_date && eventDate) {
    if (eventDate !== activation.consumed_for_date) {
      return { activated: false, reason: 'consumed' }
    }
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
  now: Date = new Date(),
  eventDate?: string | null
): boolean {
  return resolveActivation(activation, now, eventDate).activated
}

export const ALISTA_CONTACT_EMAIL = 'hola@alista.com.ar'

/**
 * Salida concreta desde el muro.
 *
 * Apunta a una conversacion con Alista para los casos en que quien mira el
 * evento no es la responsable. La dueña tiene el checkout automatico en su
 * panel; este link no debe permitir que un colaborador pague en su nombre.
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
    case 'consumed':
      return 'Esta fiesta ya se hizo y su activación quedó usada. La próxima es un evento nuevo: podés duplicar esta para no empezar de cero.'
    default:
      return 'Activá tu evento para empezar a emitir las invitaciones. Mientras tanto podés seguir configurándolo y cargando invitados.'
  }
}

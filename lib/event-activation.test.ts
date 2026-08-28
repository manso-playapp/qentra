import { describe, expect, it } from 'vitest'

import {
  getActivationBlockedMessage,
  buildActivationRequestHref,
  isEventActivated,
  resolveActivation,
  type EventActivation,
} from './event-activation'

const NOW = new Date('2026-08-28T12:00:00.000Z')

function activation(overrides: Partial<EventActivation> = {}): EventActivation {
  return { status: 'active', source: 'payment', ...overrides }
}

describe('resolveActivation', () => {
  it('un evento sin fila de activacion no esta habilitado', () => {
    expect(resolveActivation(null, NOW)).toEqual({ activated: false, reason: 'never_activated' })
    expect(resolveActivation(undefined, NOW)).toEqual({ activated: false, reason: 'never_activated' })
  })

  it('habilita con pago', () => {
    expect(resolveActivation(activation(), NOW)).toEqual({ activated: true, source: 'payment' })
  })

  it('la cortesia habilita igual que un pago, sin inventar un pago de $0', () => {
    expect(resolveActivation(activation({ source: 'cortesia' }), NOW)).toEqual({
      activated: true,
      source: 'cortesia',
    })
  })

  it('la activacion manual habilita: es como se otorga mientras no exista el cobro', () => {
    expect(resolveActivation(activation({ source: 'manual' }), NOW)).toEqual({
      activated: true,
      source: 'manual',
    })
  })

  it('una activacion dada de baja no habilita', () => {
    expect(resolveActivation(activation({ status: 'revoked' }), NOW)).toEqual({
      activated: false,
      reason: 'revoked',
    })
  })

  it('sin vencimiento, no vence', () => {
    expect(isEventActivated(activation({ expires_at: null }), NOW)).toBe(true)
  })

  it('respeta el vencimiento', () => {
    expect(isEventActivated(activation({ expires_at: '2026-08-29T12:00:00.000Z' }), NOW)).toBe(true)
    expect(isEventActivated(activation({ expires_at: '2026-08-27T12:00:00.000Z' }), NOW)).toBe(false)
  })

  it('vencer exactamente ahora ya no habilita', () => {
    expect(isEventActivated(activation({ expires_at: NOW.toISOString() }), NOW)).toBe(false)
  })

  it('una fecha ilegible se trata como vencida y no habilita por accidente', () => {
    expect(resolveActivation(activation({ expires_at: 'no-es-una-fecha' }), NOW)).toEqual({
      activated: false,
      reason: 'expired',
    })
  })

  it('la baja pesa mas que un vencimiento futuro', () => {
    const revokedButFresh = activation({ status: 'revoked', expires_at: '2027-01-01T00:00:00.000Z' })
    expect(isEventActivated(revokedButFresh, NOW)).toBe(false)
  })
})

describe('getActivationBlockedMessage', () => {
  it('encuadra como "activá tu evento", no como "pagá para enviar"', () => {
    const message = getActivationBlockedMessage(resolveActivation(null, NOW))
    expect(message).toContain('Activá tu evento')
    // La duena nunca pierde el acceso a sus datos: el mensaje lo dice.
    expect(message).toContain('cargando invitados')
  })

  it('distingue baja de vencimiento', () => {
    expect(getActivationBlockedMessage(resolveActivation(activation({ status: 'revoked' }), NOW))).toContain('dada de baja')
    expect(getActivationBlockedMessage(resolveActivation(activation({ expires_at: '2020-01-01T00:00:00.000Z' }), NOW))).toContain('venció')
  })

  it('no dice nada si esta habilitado', () => {
    expect(getActivationBlockedMessage(resolveActivation(activation(), NOW))).toBe('')
  })
})

describe('buildActivationRequestHref', () => {
  const event = { id: 'evt-123', name: 'Quince de Martina', event_date: '2026-10-03' }

  it('abre un contacto con Alista, no un checkout', () => {
    const href = buildActivationRequestHref(event)
    expect(href.startsWith('mailto:hola@alista.com.ar?')).toBe(true)
  })

  it('lleva el evento identificado para no tener que preguntarlo', () => {
    const decoded = decodeURIComponent(buildActivationRequestHref(event))
    expect(decoded).toContain('Quince de Martina')
    expect(decoded).toContain('2026-10-03')
    expect(decoded).toContain('evt-123')
  })

  it('funciona sin fecha cargada', () => {
    const decoded = decodeURIComponent(buildActivationRequestHref({ id: 'e', name: 'Sin fecha' }))
    expect(decoded).toContain('Sin fecha')
    expect(decoded).not.toContain('Fecha:')
  })
})

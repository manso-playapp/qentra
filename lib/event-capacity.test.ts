import { describe, expect, it } from 'vitest'
import { getEventCapacity } from './event-capacity'

describe('aviso de últimos lugares en recepción', () => {
  it('no avisa cuando quedan cuatro lugares', () => {
    expect(getEventCapacity(220, 216).message).toBeNull()
  })
  it.each([3, 2, 1])('avisa cuando quedan %i personas por admitir', (remaining) => {
    expect(getEventCapacity(220, 220 - remaining)).toMatchObject({ low: true, full: false, spotsLeft: remaining })
  })
  it('usa singular para el último lugar', () => {
    expect(getEventCapacity(220, 219).message).toBe('Últimos lugares: queda 1 lugar.')
  })
  it.each([220, 221])('marca cupo completo con %i personas', (admitted) => {
    expect(getEventCapacity(220, admitted)).toMatchObject({ full: true, low: false, spotsLeft: 0 })
  })
  it.each([null, NaN, -1])('no inventa disponibilidad con conteo desconocido (%s)', (admitted) => {
    expect(getEventCapacity(3, admitted)).toMatchObject({ known: false, spotsLeft: null, message: null })
  })
  it.each([null, undefined, 0, -1])('no avisa sin límite válido (%s)', (capacity) => {
    expect(getEventCapacity(capacity, 2).message).toBeNull()
  })
  it('admite un salto por ingreso grupal sin necesitar pasar por tres', () => {
    expect(getEventCapacity(220, 216).low).toBe(false)
    expect(getEventCapacity(220, 218).low).toBe(true)
  })
})

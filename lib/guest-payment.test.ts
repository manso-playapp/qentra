import { describe, expect, it } from 'vitest'
import { calculateGuestPaymentAmountCents } from './guest-payment'

describe('calculateGuestPaymentAmountCents', () => {
  it('cobra solo al titular cuando no hay acompañantes', () => {
    expect(calculateGuestPaymentAmountCents(50_000, 0)).toBe(50_000)
  })

  it('cobra titular más los acompañantes declarados', () => {
    expect(calculateGuestPaymentAmountCents(50_000, 2)).toBe(150_000)
  })

  it('tolera importes o cantidades inválidas sin inventar un total', () => {
    expect(calculateGuestPaymentAmountCents(-1, 2)).toBe(0)
    expect(calculateGuestPaymentAmountCents(50_000, -1)).toBe(50_000)
    expect(calculateGuestPaymentAmountCents(50_000, 1.5)).toBe(50_000)
  })
})

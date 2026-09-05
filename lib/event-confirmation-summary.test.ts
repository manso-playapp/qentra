import { describe, expect, it } from 'vitest'
import { summarizeEventConfirmations } from './event-confirmation-summary'

describe('event confirmation summary', () => {
  it('counts responses independently of access and payment readiness', () => {
    const guests = [
      { status: 'registered', payment_status: 'pending' },
      { status: 'enabled', payment_status: 'approved' },
      { status: 'checked_in', payment_status: 'not_required' },
      { status: 'link_sent', payment_status: 'approved' },
      { status: 'preinvited', payment_status: 'not_required' },
    ]
    expect(summarizeEventConfirmations(guests)).toEqual({
      confirmed: 3, awaiting: 1, uninvited: 1, disabled: 0, unknown: 0, total: 5,
    })
  })

  it('keeps disabled and unknown records in the denominator without treating them as confirmed', () => {
    expect(summarizeEventConfirmations([
      { status: 'rejected' }, { status: 'duplicate' }, { status: null }, { status: 'future_status' },
    ])).toEqual({ confirmed: 0, awaiting: 0, uninvited: 0, disabled: 2, unknown: 2, total: 4 })
  })

  it('counts groups once, regardless of their companions', () => {
    const guests = [{ status: 'registered', plus_ones_confirmed: 4 }]
    expect(summarizeEventConfirmations(guests).confirmed).toBe(1)
    expect(summarizeEventConfirmations(guests).total).toBe(1)
  })

  it('represents an empty list without inventing confirmations', () => {
    expect(summarizeEventConfirmations([])).toEqual({
      confirmed: 0, awaiting: 0, uninvited: 0, disabled: 0, unknown: 0, total: 0,
    })
  })
})

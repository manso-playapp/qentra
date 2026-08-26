import { describe, expect, it } from 'vitest'
import { formatEventDate, getEventStartInstant, parseEventDate } from './event-date'

describe('event dates', () => {
  it('keeps a date-only event on its calendar day', () => {
    const date = parseEventDate('2026-08-16')

    expect(date?.getUTCFullYear()).toBe(2026)
    expect(date?.getUTCMonth()).toBe(7)
    expect(date?.getUTCDate()).toBe(16)
    expect(formatEventDate('2026-08-16', { day: 'numeric', month: 'long' })).toContain('16')
  })

  it('returns invalid source values unchanged', () => {
    expect(parseEventDate('2026-02-30')).toBeNull()
    expect(formatEventDate('sin fecha')).toBe('sin fecha')
  })
})

describe('getEventStartInstant', () => {
  it('converts the Buenos Aires wall-clock time to the matching UTC instant', () => {
    const instant = getEventStartInstant('2026-03-10', '20:30')
    expect(new Date(instant!).toISOString()).toBe('2026-03-10T23:30:00.000Z')
  })

  it('defaults to midnight when no start time is given', () => {
    const instant = getEventStartInstant('2026-03-10')
    expect(new Date(instant!).toISOString()).toBe('2026-03-10T03:00:00.000Z')
  })

  it('returns null for an invalid date', () => {
    expect(getEventStartInstant('not-a-date', '20:30')).toBeNull()
  })
})

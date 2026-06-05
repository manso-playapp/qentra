import { describe, expect, it } from 'vitest'

import { evaluateGuestAccess } from './access-policy'
import { isInvitationAccessReady, parseInvitationDetails } from './invitation-response'

// NOTE on timezones: buildLocalDate() in access-policy parses `${date}T${time}`
// without a timezone suffix, so it resolves in the runtime's LOCAL timezone.
// Every `now` below is also built from a tz-less ISO string, so both sides of
// the comparison share the same local offset and the tests stay tz-independent.

type AccessInput = Parameters<typeof evaluateGuestAccess>[0]

// Event starts at 22:00 (classic fiesta de 15 / wedding kickoff).
const EVENT: AccessInput['event'] = {
  event_date: '2026-08-16',
  start_time: '22:00',
}

// Window: from 22:00 (same day) until 04:00 (next day, inferred offset +1).
const NIGHT_GUEST_TYPE: NonNullable<AccessInput['guestType']> = {
  name: 'General',
  access_policy_label: 'Acceso nocturno',
  access_start_time: '22:00',
  access_end_time: '04:00',
  access_start_day_offset: undefined,
  access_end_day_offset: undefined,
}

function buildInput(overrides: Partial<AccessInput> = {}): AccessInput {
  return {
    event: EVENT,
    guest: { first_name: 'Ana', last_name: 'Diaz', status: 'enabled' as never },
    guestType: NIGHT_GUEST_TYPE,
    now: new Date('2026-08-17T01:00:00'), // inside the window
    ...overrides,
  }
}

// Helper to set the guest status without fighting the narrow declared union
// (access-policy handles more runtime statuses than types/index.ts declares).
function withStatus(status: string, overrides: Partial<AccessInput> = {}): AccessInput {
  return buildInput({
    guest: { first_name: 'Ana', last_name: 'Diaz', status: status as never },
    ...overrides,
  })
}

describe('evaluateGuestAccess — guest status branches', () => {
  it('allows an enabled guest inside the access window', () => {
    const result = evaluateGuestAccess(withStatus('enabled'))
    expect(result.decision).toBe('allow')
    expect(result.code).toBe('ok')
  })

  it.each(['pending', 'preinvited', 'link_sent', 'registered'])(
    'denies as not_ready when status is "%s"',
    (status) => {
      const result = evaluateGuestAccess(withStatus(status))
      expect(result.decision).toBe('deny')
      expect(result.code).toBe('not_ready')
    }
  )

  it.each(['cancelled', 'rejected'])('denies as cancelled when status is "%s"', (status) => {
    const result = evaluateGuestAccess(withStatus(status))
    expect(result.decision).toBe('deny')
    expect(result.code).toBe('cancelled')
  })

  it('denies a duplicate guest at the door', () => {
    const result = evaluateGuestAccess(withStatus('duplicate'))
    expect(result.decision).toBe('deny')
    expect(result.code).toBe('duplicate')
  })

  it('allows when there is no guest type (no time restriction)', () => {
    const result = evaluateGuestAccess(withStatus('enabled', { guestType: null }))
    expect(result.decision).toBe('allow')
    expect(result.code).toBe('ok')
  })
})

describe('evaluateGuestAccess — time windows with day offset', () => {
  it('allows inside the window that crosses midnight (inferred +1 offset)', () => {
    const result = evaluateGuestAccess(
      withStatus('enabled', { now: new Date('2026-08-17T01:00:00') })
    )
    expect(result.decision).toBe('allow')
    expect(result.code).toBe('ok')
  })

  it('denies before the window opens', () => {
    const result = evaluateGuestAccess(
      withStatus('enabled', { now: new Date('2026-08-16T20:00:00') })
    )
    expect(result.decision).toBe('deny')
    expect(result.code).toBe('outside_window')
  })

  it('denies after the window closes (next-day end time)', () => {
    const result = evaluateGuestAccess(
      withStatus('enabled', { now: new Date('2026-08-17T05:00:00') })
    )
    expect(result.decision).toBe('deny')
    expect(result.code).toBe('outside_window')
  })

  it('allows exactly at the window opening boundary', () => {
    const result = evaluateGuestAccess(
      withStatus('enabled', { now: new Date('2026-08-16T22:00:00') })
    )
    expect(result.decision).toBe('allow')
    expect(result.code).toBe('ok')
  })

  it('honors an explicit same-day offset over the inferred one', () => {
    const sameDayType: NonNullable<AccessInput['guestType']> = {
      name: 'Diurno',
      access_policy_label: 'Acceso diurno',
      access_start_time: '10:00',
      access_end_time: '18:00',
      access_start_day_offset: 0,
      access_end_day_offset: 0,
    }
    const result = evaluateGuestAccess(
      withStatus('enabled', {
        guestType: sameDayType,
        now: new Date('2026-08-16T12:00:00'),
      })
    )
    expect(result.decision).toBe('allow')
    expect(result.code).toBe('ok')
  })
})

describe('evaluateGuestAccess — invitation token expiry', () => {
  it('denies when the token is expired', () => {
    const result = evaluateGuestAccess(
      withStatus('enabled', {
        invitationToken: { expires_at: '2026-08-01T00:00:00' },
      })
    )
    expect(result.decision).toBe('deny')
    expect(result.code).toBe('expired')
  })

  it('allows when the token is still valid', () => {
    const result = evaluateGuestAccess(
      withStatus('enabled', {
        invitationToken: { expires_at: '2026-12-31T00:00:00' },
      })
    )
    expect(result.decision).toBe('allow')
    expect(result.code).toBe('ok')
  })

  it('ignores an unparseable token expiry and falls through to allow', () => {
    const result = evaluateGuestAccess(
      withStatus('enabled', {
        invitationToken: { expires_at: 'not-a-date' },
      })
    )
    expect(result.decision).toBe('allow')
    expect(result.code).toBe('ok')
  })

  it('prioritizes not_ready status over an expired token', () => {
    const result = evaluateGuestAccess(
      withStatus('pending', {
        invitationToken: { expires_at: '2026-08-01T00:00:00' },
      })
    )
    expect(result.code).toBe('not_ready')
  })
})

describe('evaluateGuestAccess — double check-in', () => {
  it('warns (does NOT deny) when the guest status is checked_in', () => {
    const result = evaluateGuestAccess(withStatus('checked_in'))
    expect(result.decision).toBe('warn')
    expect(result.code).toBe('already_checked_in')
  })

  it('warns when a lastCheckinTime is present even if status is enabled', () => {
    const result = evaluateGuestAccess(
      withStatus('enabled', { lastCheckinTime: '2026-08-17T00:30:00' })
    )
    expect(result.decision).toBe('warn')
    expect(result.code).toBe('already_checked_in')
  })

  it('still denies an expired token before reporting an existing check-in', () => {
    // Expiry check runs before the check-in check, so expiry wins.
    const result = evaluateGuestAccess(
      withStatus('checked_in', {
        invitationToken: { expires_at: '2026-08-01T00:00:00' },
      })
    )
    expect(result.decision).toBe('deny')
    expect(result.code).toBe('expired')
  })
})

describe('isInvitationAccessReady — paymentStatus gating', () => {
  // evaluateGuestAccess does not take paymentStatus directly; payment gates
  // access upstream by deciding whether a guest reaches the "enabled" status.
  it('is ready when enabled and payment is not_required', () => {
    expect(isInvitationAccessReady('enabled', 'not_required')).toBe(true)
  })

  it('is ready when enabled and payment is approved', () => {
    expect(isInvitationAccessReady('enabled', 'approved')).toBe(true)
  })

  it('is NOT ready when enabled but payment is pending', () => {
    expect(isInvitationAccessReady('enabled', 'pending')).toBe(false)
  })

  it('is ready when already checked_in regardless of pending payment', () => {
    expect(isInvitationAccessReady('checked_in', 'pending')).toBe(true)
  })

  it('is NOT ready when payment approved but status is not enabled', () => {
    expect(isInvitationAccessReady('pending', 'approved')).toBe(false)
  })

  it('defaults paymentStatus to not_required when omitted', () => {
    expect(isInvitationAccessReady('enabled')).toBe(true)
  })
})

describe('fail-closed: column beats notes for access decisions', () => {
  // These tests document the critical safety guarantee: the `payment_status`
  // COLUMN is the sole source of truth for access gating. Even if `notes`
  // contains a contradictory "Pago: approved" line (corrupt data, manual admin
  // edit, or stale serialization), the decision must honour the column value.
  //
  // Context: before the payment_status column migration (commit 0c0c56a),
  // paymentStatus lived inside the serialized `notes` field, which was fragile
  // and could be edited by anyone with DB access. The column + CHECK constraint
  // closes that vector.

  it('denies access when column says pending even if notes says approved', () => {
    // Simulates: admin or bug wrote "Pago: approved" into notes, but the
    // column still reads 'pending'.  The caller (API routes, invitation page)
    // passes `guest.payment_status` to isInvitationAccessReady, NOT the
    // parsed notes value.  This test locks that contract.
    const corruptNotes = 'DNI: 30111222\nPago: approved'
    const parsedFromNotes = parseInvitationDetails(corruptNotes)

    // The parser correctly extracts what notes says…
    expect(parsedFromNotes.paymentStatus).toBe('approved')

    // …but the access decision uses the COLUMN value ('pending'), not notes.
    const columnValue: 'pending' = 'pending'
    expect(isInvitationAccessReady('enabled', columnValue)).toBe(false)
  })

  it('denies access when column is absent (defaults to not_required) and status is not enabled', () => {
    // Guest registered but not yet enabled — even with no payment requirement,
    // status alone blocks access.
    expect(isInvitationAccessReady('registered', 'not_required')).toBe(false)
  })

  it('denies access when column is pending and notes is empty', () => {
    // No notes at all, but payment is pending in the column.
    const parsedFromNotes = parseInvitationDetails(undefined)
    expect(parsedFromNotes.paymentStatus).toBe('not_required')

    // Column says pending → deny regardless of what notes (or lack thereof) says
    expect(isInvitationAccessReady('enabled', 'pending')).toBe(false)
  })

  it('allows access only when column explicitly says approved', () => {
    expect(isInvitationAccessReady('enabled', 'approved')).toBe(true)
  })

  it('allows access when column says not_required (no payment gate)', () => {
    expect(isInvitationAccessReady('enabled', 'not_required')).toBe(true)
  })
})

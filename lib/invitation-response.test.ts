import { describe, expect, it } from 'vitest'

import {
  isInvitationAccessReady,
  parseInvitationDetails,
  serializeInvitationDetails,
} from './invitation-response'

// The `notes` field is serialized as one `Label: value` line per field, using
// the (accent-less) Spanish labels below. These tests derive every case from
// the real serialize/parse implementation — not an assumed format.
const LABELS = {
  dni: 'DNI',
  dietary: 'Menu',
  companions: 'Acompanantes',
  song: 'Cancion',
  greeting: 'Saludo',
  observations: 'Observaciones',
  payment: 'Pago',
}

describe('serializeInvitationDetails', () => {
  it('serializes all fields in the documented label order', () => {
    const result = serializeInvitationDetails({
      dni: '30111222',
      dietaryRequirements: 'Sin TACC',
      companionNames: 'Juan, Maria',
      observations: 'Llega tarde',
      paymentStatus: 'approved',
    })
    expect(result).toBe(
      ['DNI: 30111222', 'Menu: Sin TACC', 'Acompanantes: Juan, Maria', 'Observaciones: Llega tarde', 'Pago: approved'].join(
        '\n'
      )
    )
  })

  it('omits empty fields entirely', () => {
    const result = serializeInvitationDetails({ dni: '30111222' })
    expect(result).toBe('DNI: 30111222')
  })

  it('returns an empty string when nothing is provided', () => {
    expect(serializeInvitationDetails({})).toBe('')
  })

  it('trims each value before serializing', () => {
    const result = serializeInvitationDetails({ dni: '  30111222  ' })
    expect(result).toBe('DNI: 30111222')
  })

  it('drops paymentStatus when it is not_required (never written to notes)', () => {
    const result = serializeInvitationDetails({ dni: '1', paymentStatus: 'not_required' })
    expect(result).toBe('DNI: 1')
  })

  it.each(['pending', 'approved'] as const)('includes paymentStatus "%s"', (status) => {
    const result = serializeInvitationDetails({ paymentStatus: status })
    expect(result).toBe(`Pago: ${status}`)
  })
})

describe('parseInvitationDetails — well-formed input', () => {
  it('parses every field from a fully populated notes blob', () => {
    const notes = [
      `${LABELS.dni}: 30111222`,
      `${LABELS.dietary}: Sin TACC`,
      `${LABELS.companions}: Juan, Maria`,
      `${LABELS.song}: Despacito`,
      `${LABELS.greeting}: Feliz cumple`,
      `${LABELS.observations}: Llega tarde`,
      `${LABELS.payment}: approved`,
    ].join('\n')

    expect(parseInvitationDetails(notes)).toEqual({
      dni: '30111222',
      dietaryRequirements: 'Sin TACC',
      companionNames: 'Juan, Maria',
      song: 'Despacito',
      greeting: 'Feliz cumple',
      observations: 'Llega tarde',
      paymentStatus: 'approved',
    })
  })

  it('parses a label written without a space after the colon', () => {
    expect(parseInvitationDetails('DNI:30111222').dni).toBe('30111222')
  })

  it('preserves colons inside a value (e.g. a time)', () => {
    expect(parseInvitationDetails('Observaciones: llega 20:30').observations).toBe('llega 20:30')
  })

  it('lets the last duplicate label win', () => {
    expect(parseInvitationDetails('DNI: 111\nDNI: 222').dni).toBe('222')
  })
})

describe('parseInvitationDetails — defaults and missing fields', () => {
  it('defaults all fields when notes is undefined', () => {
    expect(parseInvitationDetails(undefined)).toEqual({
      dni: '',
      dietaryRequirements: '',
      companionNames: '',
      song: '',
      greeting: '',
      observations: '',
      paymentStatus: 'not_required',
    })
  })

  it('defaults all fields when notes is null', () => {
    expect(parseInvitationDetails(null)).toEqual({
      dni: '',
      dietaryRequirements: '',
      companionNames: '',
      song: '',
      greeting: '',
      observations: '',
      paymentStatus: 'not_required',
    })
  })

  it('defaults all fields when notes is an empty string', () => {
    expect(parseInvitationDetails('')).toEqual({
      dni: '',
      dietaryRequirements: '',
      companionNames: '',
      song: '',
      greeting: '',
      observations: '',
      paymentStatus: 'not_required',
    })
  })

  it('defaults paymentStatus to not_required when the Pago line is absent', () => {
    expect(parseInvitationDetails('DNI: 30111222').paymentStatus).toBe('not_required')
  })

  it('ignores blank and whitespace-only lines', () => {
    const notes = '\n   \nDNI: 30111222\n\n'
    expect(parseInvitationDetails(notes).dni).toBe('30111222')
  })
})

describe('parseInvitationDetails — paymentStatus extraction', () => {
  it.each(['not_required', 'pending', 'approved'] as const)(
    'extracts the valid paymentStatus "%s"',
    (status) => {
      expect(parseInvitationDetails(`Pago: ${status}`).paymentStatus).toBe(status)
    }
  )

  it('falls back to not_required for an unrecognized payment value', () => {
    // The Pago line is consumed (not treated as observations) but the invalid
    // value is rejected, so paymentStatus stays at its safe default.
    const result = parseInvitationDetails('Pago: rejected')
    expect(result.paymentStatus).toBe('not_required')
    expect(result.observations).toBe('')
  })
})

describe('parseInvitationDetails — malformed / garbage input (must not throw)', () => {
  it('treats unlabeled garbage as observations via the legacy fallback', () => {
    const result = parseInvitationDetails('texto suelto sin ninguna etiqueta')
    expect(result.observations).toBe('texto suelto sin ninguna etiqueta')
    expect(result.paymentStatus).toBe('not_required')
  })

  it('joins multiple unlabeled (legacy) lines into observations', () => {
    const result = parseInvitationDetails('linea a\nlinea b')
    expect(result.observations).toBe('linea a\nlinea b')
  })

  it('captures a mistyped label as observations (legacy fallback)', () => {
    // Admin typo: "Observacion" instead of "Observaciones" → no label match.
    const result = parseInvitationDetails('Observacion: viene tarde')
    expect(result.observations).toBe('Observacion: viene tarde')
  })

  it('does not match a label that is not at the start of the line', () => {
    const result = parseInvitationDetails('nota DNI: 123')
    expect(result.dni).toBe('')
    expect(result.observations).toBe('nota DNI: 123')
  })

  // FRAGILITY (see QEN-005): a multi-line "Observaciones" value loses every
  // line after the first. The first line is captured as observations, which
  // makes observations non-empty, so the trailing legacy lines are silently
  // dropped instead of appended. This documents CURRENT behavior, not desired.
  it('SILENTLY DROPS trailing lines of a multi-line observation (known risk)', () => {
    const notes = 'Observaciones: linea uno\nlinea dos'
    const result = parseInvitationDetails(notes)
    expect(result.observations).toBe('linea uno')
    expect(result.observations).not.toContain('linea dos')
  })
})

describe('parseInvitationDetails — round-trip with serializeInvitationDetails', () => {
  it('round-trips a fully populated record (pending payment)', () => {
    const input = {
      dni: '30111222',
      dietaryRequirements: 'Sin TACC',
      companionNames: 'Juan',
      song: 'Despacito',
      greeting: 'Feliz cumple',
      observations: 'Llega tarde',
      paymentStatus: 'pending' as const,
    }
    expect(parseInvitationDetails(serializeInvitationDetails(input))).toEqual(input)
  })

  it('round-trips not_required payment back to the default', () => {
    const parsed = parseInvitationDetails(
      serializeInvitationDetails({ dni: '1', paymentStatus: 'not_required' })
    )
    expect(parsed.paymentStatus).toBe('not_required')
    expect(parsed.dni).toBe('1')
  })
})

describe('isInvitationAccessReady — non-payment branches', () => {
  it('is NOT ready when guestStatus is undefined', () => {
    expect(isInvitationAccessReady(undefined)).toBe(false)
  })

  it('is NOT ready when guestStatus is null', () => {
    expect(isInvitationAccessReady(null)).toBe(false)
  })

  it.each(['pending', 'preinvited', 'link_sent', 'registered', 'cancelled', 'rejected'])(
    'is NOT ready when guestStatus is "%s" (not enabled / not checked_in)',
    (status) => {
      expect(isInvitationAccessReady(status, 'approved')).toBe(false)
    }
  )

  it('is ready when checked_in even with no paymentStatus argument', () => {
    expect(isInvitationAccessReady('checked_in')).toBe(true)
  })

  it.each(['not_required', 'pending', 'approved'] as const)(
    'is ready when checked_in regardless of payment "%s"',
    (status) => {
      expect(isInvitationAccessReady('checked_in', status)).toBe(true)
    }
  )
})

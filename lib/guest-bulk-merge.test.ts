import { describe, expect, it } from 'vitest'
import { categorizeBulkGuestRows, type ExistingGuestForMerge } from './guest-bulk-merge'
import type { GuestImportRow } from './guest-import'

function row(overrides: Partial<GuestImportRow> = {}): GuestImportRow {
  return {
    first_name: 'Sofia',
    last_name: 'Gimenez',
    email: '',
    phone: '',
    table_assignment: '',
    source_type: '',
    sender_group: '',
    document_number: '',
    companion_names: [],
    ...overrides,
  }
}

function existing(overrides: Partial<ExistingGuestForMerge> = {}): ExistingGuestForMerge {
  return {
    id: 'guest-1',
    first_name: 'Sofia',
    last_name: 'Gimenez',
    email: null,
    phone: null,
    status: 'preinvited',
    payment_status: 'not_required',
    ...overrides,
  }
}

describe('categorizeBulkGuestRows', () => {
  it('da de alta como nuevo cuando no hay coincidencia', () => {
    const result = categorizeBulkGuestRows([], [row()])
    expect(result.rows).toEqual([{ category: 'new', row: row() }])
    expect(result.missing).toEqual([])
  })

  it('matchea por telefono normalizado y actualiza si el invitado no fue tocado', () => {
    const guest = existing({ phone: '+5493425551234' })
    const result = categorizeBulkGuestRows([guest], [row({ phone: '+5493425551234' })])
    expect(result.rows[0]).toEqual({ category: 'update', row: row({ phone: '+5493425551234' }), existing: guest })
    expect(result.missing).toEqual([])
  })

  it('matchea por email cuando no hay telefono', () => {
    const guest = existing({ email: 'sofia@mail.com' })
    const result = categorizeBulkGuestRows([guest], [row({ email: 'SOFIA@mail.com' })])
    expect(result.rows[0].category).toBe('update')
  })

  it('nunca fusiona solo por nombre: sin telefono ni email, siempre es alta nueva', () => {
    const guest = existing()
    const result = categorizeBulkGuestRows([guest], [row()])
    expect(result.rows[0].category).toBe('new')
    // El invitado existente, al no matchear, queda en missing.
    expect(result.missing).toEqual([guest])
  })

  it('protege a un invitado que ya recibio el link, aunque la fila coincida', () => {
    const guest = existing({ phone: '+5493425551234', status: 'link_sent' })
    const result = categorizeBulkGuestRows([guest], [row({ phone: '+5493425551234' })])
    expect(result.rows[0]).toMatchObject({ category: 'protected', reason: 'Ya fue invitado o respondió' })
  })

  it('protege a un invitado que ya pago aunque el estado siga en preinvited', () => {
    const guest = existing({ phone: '+5493425551234', payment_status: 'approved' })
    const result = categorizeBulkGuestRows([guest], [row({ phone: '+5493425551234' })])
    expect(result.rows[0]).toMatchObject({ category: 'protected', reason: 'Ya pagó' })
  })

  it('reporta como missing a los invitados existentes que no aparecen en la planilla, sin borrarlos', () => {
    const stays = existing({ id: 'a', phone: '+5493425551111' })
    const goesMissing = existing({ id: 'b', phone: '+5493425552222' })
    const result = categorizeBulkGuestRows(
      [stays, goesMissing],
      [row({ phone: '+5493425551111' })]
    )
    expect(result.missing).toEqual([goesMissing])
  })
})

import { describe, expect, it } from 'vitest'
import { buildGuestImportWorkbookBlob, readGuestImportWorkbookAsText } from './guest-import-workbook'
import { parseGuestImportRows } from './guest-import'

describe('guest import workbook (.xlsx)', () => {
  it('genera un .xlsx cuyo texto se puede reimportar salteando el encabezado de marca', async () => {
    const blob = await buildGuestImportWorkbookBlob({ name: 'Fiesta de Sofía', dateLabel: '12 de diciembre de 2026' })
    const file = new File([blob], 'plantilla.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const text = await readGuestImportWorkbookAsText(file)
    expect(text).toContain('Nombre\tApellido\tTelefono\tEmail\tTipo\tInvitado de\tAcompañantes\tDNI\tDestino')

    const rows = parseGuestImportRows(text + '\nSofia\tGimenez\t3424496166\t\t\t\t\t\t')
    expect(rows).toEqual([
      {
        first_name: 'Sofia',
        last_name: 'Gimenez',
        email: '',
        phone: '+5493424496166',
        table_assignment: '',
        source_type: '',
        sender_group: '',
        document_number: '',
        companion_names: [],
      },
    ])
  })

  it('sin datos de evento, sigue produciendo un encabezado reimportable', async () => {
    const blob = await buildGuestImportWorkbookBlob()
    const file = new File([blob], 'plantilla.xlsx')
    const text = await readGuestImportWorkbookAsText(file)
    const rows = parseGuestImportRows(text + '\nJuan\tPerez\t\t\t\t\t\t\t')
    expect(rows).toHaveLength(1)
    expect(rows[0].first_name).toBe('Juan')
  })
})

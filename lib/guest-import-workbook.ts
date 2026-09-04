// Genera y lee la plantilla de invitados como .xlsx real (con colores,
// encabezado congelado y ancho de columnas) en vez de un CSV pelado. Todo
// corre en el navegador; exceljs se importa dinámicamente para no engordar
// el bundle inicial del panel de invitados.
//
// El archivo sigue siendo compatible con el importador de texto: las filas
// se convierten a TSV (una celda por columna, separadas por tab) y pasan por
// el mismo `parseGuestImportRows`, que ya sabe saltear las filas
// decorativas del encabezado (ver lib/guest-import.ts).

import type { GuestImportTemplateEventInfo } from '@/lib/guest-import'

const NAVY = '213480'
const CYAN = '009CDD'
const PINK = 'F23C6E'
const POWDER_LIGHT = 'E9F1F4'
const WARN_BG = 'FDEBEF'
const WHITE = 'FFFFFF'

const COLUMNS = [
  { header: 'Nombre', width: 16 },
  { header: 'Apellido', width: 16 },
  { header: 'Telefono', width: 15 },
  { header: 'Email', width: 24 },
  { header: 'Tipo', width: 12 },
  { header: 'Invitado de', width: 16 },
  { header: 'Acompañantes', width: 26 },
  { header: 'DNI', width: 12 },
  { header: 'Destino', width: 14 },
] as const

const LAST_COL_LETTER = String.fromCharCode('A'.charCodeAt(0) + COLUMNS.length - 1)

export async function buildGuestImportWorkbookBlob(
  event?: GuestImportTemplateEventInfo
): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Alista'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Invitados', {
    views: [{ state: 'frozen', ySplit: 6 }],
  })
  sheet.columns = COLUMNS.map((col) => ({ width: col.width }))

  const fill = (color: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF' + color } })
  const font = (opts: Record<string, unknown>) => ({ name: 'Arial', color: { argb: 'FF' + ((opts.color as string) || NAVY) }, ...opts })

  // Fila 1: banner de marca.
  const row1 = sheet.getRow(1)
  row1.height = 30
  sheet.mergeCells(`A1:${LAST_COL_LETTER}1`)
  const brandCell = sheet.getCell('A1')
  brandCell.fill = fill(POWDER_LIGHT)
  brandCell.value = {
    richText: [
      { font: font({ bold: true, size: 14, color: CYAN }), text: 'ALISTA  ' },
      { font: font({ bold: true, size: 14, color: NAVY }), text: 'Planilla de invitados' },
    ],
  }
  brandCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  // Fila 2: datos del evento (si se conocen) o instrucciones generales.
  const row2 = sheet.getRow(2)
  row2.height = 28
  sheet.mergeCells(`A2:${LAST_COL_LETTER}2`)
  const cell2 = sheet.getCell('A2')
  const eventLine = [event?.name, event?.dateLabel].filter(Boolean).join(' · ')
  cell2.value = eventLine
    ? `Evento: ${eventLine}`
    : 'Completá una fila por invitado. Alista reconoce cada columna por su título, no importa el orden en que las pongas.'
  cell2.font = font({ size: 10.5, italic: true })
  cell2.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
  cell2.fill = fill(WHITE)

  // Fila 3: advertencia.
  const row3 = sheet.getRow(3)
  row3.height = 30
  sheet.mergeCells(`A3:${LAST_COL_LETTER}3`)
  const cell3 = sheet.getCell('A3')
  cell3.value =
    'No borres ni cambies los títulos de columna (Nombre / Apellido / Telefono / Email / Tipo / Invitado de / Acompañantes / DNI / Destino).'
  cell3.font = font({ size: 10.5, bold: true, color: PINK })
  cell3.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
  cell3.fill = fill(WARN_BG)
  cell3.border = { left: { style: 'medium', color: { argb: 'FF' + PINK } } }

  // Fila 4: significado de los campos nuevos.
  const row4 = sheet.getRow(4)
  row4.height = 30
  sheet.mergeCells(`A4:${LAST_COL_LETTER}4`)
  const cell4 = sheet.getCell('A4')
  cell4.value =
    'Solo el Nombre es obligatorio. Invitado de = quién se ocupa de esa invitación (Mamá / la quinceañera / etc). Acompañantes = nombres separados por punto y coma.'
  cell4.font = font({ size: 10.5 })
  cell4.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
  cell4.fill = fill(POWDER_LIGHT)

  // Fila 5: separador vacío (se saltea solo al reimportar).
  sheet.getRow(5).height = 6

  // Fila 6: encabezado real de columnas.
  const headerRow = sheet.getRow(6)
  headerRow.height = 22
  COLUMNS.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = col.header
    cell.font = font({ bold: true, size: 10.5, color: WHITE })
    cell.fill = fill(NAVY)
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF' + CYAN } } }
  })

  // Telefono y DNI como texto: sin esto, Excel/Sheets pueden comerse ceros a
  // la izquierda o pasar un DNI largo a notación científica.
  sheet.getColumn(3).numFmt = '@'
  sheet.getColumn(8).numFmt = '@'

  // Filas de cortesía con zebra striping suave para que se note dónde
  // completar, sin necesidad de escribir nada todavía.
  for (let r = 7; r <= 30; r += 1) {
    const isEven = (r - 7) % 2 === 1
    for (let c = 1; c <= COLUMNS.length; c += 1) {
      const cell = sheet.getRow(r).getCell(c)
      cell.fill = fill(isEven ? POWDER_LIGHT : WHITE)
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFBBD4DE' } } }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    const rich = value as { richText?: { text: string }[]; text?: string; result?: unknown }
    if (Array.isArray(rich.richText)) return rich.richText.map((part) => part.text).join('')
    if (typeof rich.text === 'string') return rich.text
    if (rich.result !== undefined) return cellToText(rich.result)
  }
  return String(value)
}

/**
 * Lee un .xlsx subido y lo convierte a texto separado por tabs, para
 * reusar tal cual el mismo `parseGuestImportRows` que ya entiende CSV y
 * pegado desde Sheets (incluida la fila de marca/instrucciones al inicio).
 */
export async function readGuestImportWorkbookAsText(file: File): Promise<string> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.worksheets[0]
  if (!sheet) return ''

  const lines: string[] = []
  sheet.eachRow((row) => {
    const cells: string[] = []
    for (let c = 1; c <= sheet.columnCount; c += 1) {
      cells.push(cellToText(row.getCell(c).value).replace(/\t|\r?\n/g, ' ').trim())
    }
    lines.push(cells.join('\t'))
  })

  return lines.join('\n')
}

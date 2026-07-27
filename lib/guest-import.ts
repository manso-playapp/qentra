import { toE164 } from '@/lib/phone'

export type GuestImportRow = {
  first_name: string
  last_name: string
  email: string
  phone: string
  table_assignment: string
  source_type: string
}

function normalized(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .replace(/[^a-z0-9]/g, '')
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }

  cells.push(cell.trim())
  return cells
}

function detectDelimiter(line: string) {
  return ['\t', ';', ','].reduce(
    (selected, candidate) =>
      line.split(candidate).length > line.split(selected).length ? candidate : selected,
    ','
  )
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    first_name: parts.shift() ?? '',
    last_name: parts.join(' '),
  }
}

function normalizedPhone(value: string) {
  return /\d/.test(value) ? toE164(value) : ''
}

const HEADER_ALIASES = {
  name: ['nombre', 'nombres', 'nombrecompleto', 'fullname'],
  lastName: ['apellido', 'apellidos', 'lastname'],
  email: ['email', 'correo', 'correoelectronico'],
  phone: ['telefono', 'celular', 'whatsapp', 'phone'],
  destination: ['destino', 'mesa', 'sector', 'tableassignment'],
  type: ['tipo', 'tipodeinvitado', 'guesttype'],
} as const

function columnIndex(headers: string[], aliases: readonly string[]) {
  return headers.findIndex((header) => aliases.some((alias) => alias === normalized(header)))
}

// Admite tanto la plantilla de la app como CSVs de proveedores con columnas
// NOMBRE, TELEFONO, DESTINO y TIPO. Los teléfonos no numéricos (por ejemplo,
// "SIN INGRESO") quedan vacíos para no generar un destino de WhatsApp inválido.
export function parseGuestImportRows(text: string): GuestImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    // Algunas exportaciones de Excel dejan filas visualmente vacías (",,,,")
    // antes de la cabecera; no deben confundirse con datos sin cabecera.
    .filter((line) => line.replace(/[,;\t\s]/g, '').length > 0)

  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines[0])
  const firstLine = parseDelimitedLine(lines[0], delimiter)
  const nameIndex = columnIndex(firstLine, HEADER_ALIASES.name)
  const isHeader = nameIndex >= 0 || columnIndex(firstLine, HEADER_ALIASES.phone) >= 0
  const headers = isHeader ? firstLine : []
  const startIndex = isHeader ? 1 : 0

  const lastNameIndex = columnIndex(headers, HEADER_ALIASES.lastName)
  const emailIndex = columnIndex(headers, HEADER_ALIASES.email)
  const phoneIndex = columnIndex(headers, HEADER_ALIASES.phone)
  const destinationIndex = columnIndex(headers, HEADER_ALIASES.destination)
  const typeIndex = columnIndex(headers, HEADER_ALIASES.type)

  return lines
    .slice(startIndex)
    .map((line) => parseDelimitedLine(line, delimiter))
    .map((cells) => {
      if (!isHeader) {
        return {
          first_name: cells[0] ?? '',
          last_name: cells[1] ?? '',
          email: cells[2] ?? '',
          phone: normalizedPhone(cells[3] ?? ''),
          table_assignment: cells[4] ?? '',
          source_type: '',
        }
      }

      const fullName = nameIndex >= 0 ? cells[nameIndex] ?? '' : ''
      const name = lastNameIndex >= 0 ? { first_name: fullName, last_name: cells[lastNameIndex] ?? '' } : splitFullName(fullName)

      return {
        ...name,
        email: emailIndex >= 0 ? cells[emailIndex] ?? '' : '',
        phone: phoneIndex >= 0 ? normalizedPhone(cells[phoneIndex] ?? '') : '',
        table_assignment: destinationIndex >= 0 ? cells[destinationIndex] ?? '' : '',
        source_type: typeIndex >= 0 ? cells[typeIndex] ?? '' : '',
      }
    })
    .filter((row) => row.first_name.trim().length > 0)
}

export function normalizeGuestTypeName(value: string) {
  return normalized(value)
}

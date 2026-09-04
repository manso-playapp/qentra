import { toE164 } from '@/lib/phone'

// Los campos opcionales distinguen "la planilla no trae esta columna"
// (undefined) de "la trae, pero la celda esta vacia" (''/[]). Reimportar sin
// una columna no debe borrar ese dato en un invitado ya cargado: ver como se
// arma el payload de update en app/api/guests/bulk/route.ts.
export type GuestImportRow = {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  table_assignment?: string
  source_type: string
  /** Etiqueta del grupo de envío ("Invitado de: Mamá", "Amigas del colegio"). */
  sender_group?: string
  document_number?: string
  companion_names?: string[]
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

// Se mide sobre una muestra de varias lineas (no solo la primera) para que
// una linea decorativa suelta al principio ("Alista - Planilla de...") no
// haga elegir mal el separador.
function detectDelimiter(lines: string[]) {
  const sample = lines.slice(0, 15).join('\n')
  return ['\t', ';', ','].reduce(
    (selected, candidate) =>
      sample.split(candidate).length > sample.split(selected).length ? candidate : selected,
    ','
  )
}

// La plantilla personalizada trae lineas de marca/instrucciones antes de la
// fila de encabezados real. Se busca esa fila en las primeras lineas en vez
// de asumir que es la primera: asi la plantilla se puede reimportar tal cual
// se descarga, sin que la persona tenga que borrar nada a mano.
function findHeaderLineIndex(lines: string[], delimiter: string) {
  const searchWindow = Math.min(lines.length, 15)
  for (let index = 0; index < searchWindow; index += 1) {
    const cells = parseDelimitedLine(lines[index], delimiter)
    if (columnIndex(cells, HEADER_ALIASES.name) >= 0 || columnIndex(cells, HEADER_ALIASES.phone) >= 0) {
      return index
    }
  }
  return -1
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

// Una celda de acompañantes trae varios nombres. Si hay punto y coma se usa
// como separador (evita choques con "Apellido, Nombre" o nombres compuestos
// con coma); si no, se separa por coma.
function splitCompanionNames(value: string) {
  if (!value.trim()) return []
  const parts = value.includes(';') ? value.split(';') : value.split(',')
  return parts.map((part) => part.trim()).filter(Boolean)
}

const HEADER_ALIASES = {
  name: ['nombre', 'nombres', 'nombrecompleto', 'fullname'],
  lastName: ['apellido', 'apellidos', 'lastname'],
  email: ['email', 'correo', 'correoelectronico'],
  phone: ['telefono', 'celular', 'whatsapp', 'phone'],
  destination: ['destino', 'mesa', 'sector', 'tableassignment'],
  type: ['tipo', 'tipodeinvitado', 'guesttype'],
  senderGroup: ['invitadode', 'grupodeenvio', 'grupo', 'seocupa'],
  documentNumber: ['dni', 'documento', 'nrodocumento', 'numerodocumento', 'documentnumber'],
  companions: ['acompanantes', 'acompanante', 'invitadosadicionales', 'plusones'],
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

  const delimiter = detectDelimiter(lines)
  const headerLineIndex = findHeaderLineIndex(lines, delimiter)
  const isHeader = headerLineIndex >= 0
  const headers = isHeader ? parseDelimitedLine(lines[headerLineIndex], delimiter) : []
  const nameIndex = columnIndex(headers, HEADER_ALIASES.name)
  const startIndex = isHeader ? headerLineIndex + 1 : 0

  const lastNameIndex = columnIndex(headers, HEADER_ALIASES.lastName)
  const emailIndex = columnIndex(headers, HEADER_ALIASES.email)
  const phoneIndex = columnIndex(headers, HEADER_ALIASES.phone)
  const destinationIndex = columnIndex(headers, HEADER_ALIASES.destination)
  const typeIndex = columnIndex(headers, HEADER_ALIASES.type)
  const senderGroupIndex = columnIndex(headers, HEADER_ALIASES.senderGroup)
  const documentIndex = columnIndex(headers, HEADER_ALIASES.documentNumber)
  const companionsIndex = columnIndex(headers, HEADER_ALIASES.companions)

  return lines
    .slice(startIndex)
    .map((line) => parseDelimitedLine(line, delimiter))
    .map((cells) => {
      if (!isHeader) {
        // Formato clasico de 5 columnas fijas: las 5 se consideran "presentes"
        // aunque la celda este vacia (siempre se pueden actualizar).
        return {
          first_name: cells[0] ?? '',
          last_name: cells[1] ?? '',
          email: cells[2] ?? '',
          phone: normalizedPhone(cells[3] ?? ''),
          table_assignment: cells[4] ?? '',
          source_type: '',
          sender_group: undefined,
          document_number: undefined,
          companion_names: undefined,
        }
      }

      const fullName = nameIndex >= 0 ? cells[nameIndex] ?? '' : ''
      const name = lastNameIndex >= 0 ? { first_name: fullName, last_name: cells[lastNameIndex] ?? '' } : splitFullName(fullName)

      return {
        ...name,
        email: emailIndex >= 0 ? cells[emailIndex] ?? '' : undefined,
        phone: phoneIndex >= 0 ? normalizedPhone(cells[phoneIndex] ?? '') : undefined,
        table_assignment: destinationIndex >= 0 ? cells[destinationIndex] ?? '' : undefined,
        source_type: typeIndex >= 0 ? cells[typeIndex] ?? '' : '',
        sender_group: senderGroupIndex >= 0 ? cells[senderGroupIndex] ?? '' : undefined,
        document_number: documentIndex >= 0 ? cells[documentIndex] ?? '' : undefined,
        companion_names: companionsIndex >= 0 ? splitCompanionNames(cells[companionsIndex] ?? '') : undefined,
      }
    })
    .filter((row) => row.first_name.trim().length > 0)
}

export function normalizeGuestTypeName(value: string) {
  return normalized(value)
}

const TEMPLATE_HEADER_ROW = [
  'Nombre',
  'Apellido',
  'Telefono',
  'Email',
  'Tipo',
  'Invitado de',
  'Acompañantes',
  'DNI',
  'Destino',
]

export type GuestImportTemplateEventInfo = {
  name?: string
  dateLabel?: string
}

// Plantilla con encabezado de marca e instrucciones antes de la fila de
// columnas real. Esas lineas decorativas se saltean solas al reimportar
// (ver findHeaderLineIndex): la persona puede descargar, completar y volver
// a subir el mismo archivo sin tocar nada.
//
// Ojo al redactar estas lineas: si el separador detectado es coma, una lista
// de nombres de columna separados por coma en la prosa generaria una celda
// exactamente igual a un alias ("Nombre") y el parser confundiria esa linea
// con el encabezado real. Por eso los nombres de columna van separados por
// "/" en el texto, nunca por coma.
export function buildGuestImportTemplateCsv(event?: GuestImportTemplateEventInfo): string {
  const lines = ['ALISTA · Planilla de invitados']
  if (event?.name) lines.push(`Evento: ${event.name}`)
  if (event?.dateLabel) lines.push(`Fecha: ${event.dateLabel}`)
  lines.push(
    'Completá una fila por invitado. Alista reconoce cada columna por su título, no importa el orden en que las pongas.'
  )
  lines.push(
    'No borres ni cambies los títulos de columna (Nombre / Apellido / Telefono / Email / Tipo / Invitado de / Acompañantes / DNI / Destino).'
  )
  lines.push(
    'Solo el Nombre es obligatorio. Invitado de = quién se ocupa de esa invitación (Mamá / la quinceañera / etc). Acompañantes = nombres separados por punto y coma.'
  )
  lines.push('')
  lines.push(TEMPLATE_HEADER_ROW.join(','))
  return lines.join('\r\n') + '\r\n'
}

// Planilla maestra en el Drive de Alista, con las mismas columnas que el CSV.
// El sufijo /copy fuerza "Hacer una copia" en el Drive de quien abre el
// link: no hace falta pedirle a nadie que tenga Excel instalado, ni integrar
// la API de Google Sheets.
export const GUEST_IMPORT_TEMPLATE_SHEET_ID = '1z1f1flhu94AlHkZN047wtMyeyKWwEkQpcwS8IIgPbhE'

export function buildGuestImportTemplateSheetCopyUrl() {
  return `https://docs.google.com/spreadsheets/d/${GUEST_IMPORT_TEMPLATE_SHEET_ID}/copy`
}

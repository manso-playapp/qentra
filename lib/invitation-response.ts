type InvitationDetailsInput = {
  dni?: string
  dietaryRequirements?: string
  companionNames?: string
  song?: string
  greeting?: string
  observations?: string
  tableAssignment?: string
  paymentStatus?: 'not_required' | 'pending' | 'approved'
}

export type ParsedInvitationDetails = {
  dni: string
  dietaryRequirements: string
  companionNames: string
  song: string
  greeting: string
  observations: string
  tableAssignment: string
  paymentStatus: 'not_required' | 'pending' | 'approved'
}

const LABELS = {
  dni: 'DNI',
  dietaryRequirements: 'Menu',
  companionNames: 'Acompanantes',
  song: 'Cancion',
  greeting: 'Saludo',
  observations: 'Observaciones',
  // Label visible para el destino (mesa). Se escribe como "Destino:" en notes,
  // pero el parser acepta el prefijo legacy "Mesa:" para no perder datos viejos.
  tableAssignment: 'Destino',
  paymentStatus: 'Pago',
} as const

// Prefijos legacy aceptados al leer notes (backward-compat con datos existentes).
const TABLE_ASSIGNMENT_LEGACY_PREFIX = 'Mesa'

export function serializeInvitationDetails({
  dni,
  dietaryRequirements,
  companionNames,
  song,
  greeting,
  observations,
  tableAssignment,
  paymentStatus,
}: InvitationDetailsInput) {
  const sections = [
    { label: LABELS.dni, value: dni?.trim() },
    { label: LABELS.dietaryRequirements, value: dietaryRequirements?.trim() },
    { label: LABELS.companionNames, value: companionNames?.trim() },
    { label: LABELS.song, value: song?.trim() },
    { label: LABELS.greeting, value: greeting?.trim() },
    { label: LABELS.tableAssignment, value: tableAssignment?.trim() },
    { label: LABELS.observations, value: observations?.trim() },
    {
      label: LABELS.paymentStatus,
      value: paymentStatus && paymentStatus !== 'not_required' ? paymentStatus : undefined,
    },
  ].filter((section) => section.value)

  return sections.map((section) => `${section.label}: ${section.value}`).join('\n')
}

export function parseInvitationDetails(value?: string | null): ParsedInvitationDetails {
  const lines = (value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed: ParsedInvitationDetails = {
    dni: '',
    dietaryRequirements: '',
    companionNames: '',
    song: '',
    greeting: '',
    observations: '',
    tableAssignment: '',
    paymentStatus: 'not_required',
  }

  const legacyLines: string[] = []

  for (const line of lines) {
    if (line.startsWith(`${LABELS.dni}:`)) {
      parsed.dni = line.replace(`${LABELS.dni}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.dietaryRequirements}:`)) {
      parsed.dietaryRequirements = line.replace(`${LABELS.dietaryRequirements}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.companionNames}:`)) {
      parsed.companionNames = line.replace(`${LABELS.companionNames}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.song}:`)) {
      parsed.song = line.replace(`${LABELS.song}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.greeting}:`)) {
      parsed.greeting = line.replace(`${LABELS.greeting}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.observations}:`)) {
      parsed.observations = line.replace(`${LABELS.observations}:`, '').trim()
      continue
    }

    if (
      line.startsWith(`${LABELS.tableAssignment}:`) ||
      line.startsWith(`${TABLE_ASSIGNMENT_LEGACY_PREFIX}:`)
    ) {
      parsed.tableAssignment = line
        .replace(`${LABELS.tableAssignment}:`, '')
        .replace(`${TABLE_ASSIGNMENT_LEGACY_PREFIX}:`, '')
        .trim()
      continue
    }

    if (line.startsWith(`${LABELS.paymentStatus}:`)) {
      const value = line.replace(`${LABELS.paymentStatus}:`, '').trim()
      if (value === 'pending' || value === 'approved' || value === 'not_required') {
        parsed.paymentStatus = value
      }
      continue
    }

    legacyLines.push(line)
  }

  if (!parsed.observations && legacyLines.length > 0) {
    parsed.observations = legacyLines.join('\n')
  }

  return parsed
}

// Inserta o reemplaza la linea "Destino: ..." dentro de notes.
// Se usa como fallback de almacenamiento cuando la columna nativa
// table_assignment no existe aun en el esquema de la base de datos.
// Idempotente: si tableAssignment esta vacio, elimina la linea existente.
export function upsertTableAssignmentInNotes(
  notes: string | null | undefined,
  tableAssignment: string | null | undefined
): string | null {
  const trimmed = tableAssignment?.trim() || ''
  const existingLines = (notes || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const preservedLines = existingLines.filter(
    (line) =>
      !line.startsWith(`${LABELS.tableAssignment}:`) &&
      !line.startsWith(`${TABLE_ASSIGNMENT_LEGACY_PREFIX}:`)
  )

  if (trimmed) {
    preservedLines.push(`${LABELS.tableAssignment}: ${trimmed}`)
  }

  const result = preservedLines.join('\n')
  return result || null
}

export function isTableAssignmentColumnMissingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return message.includes("Could not find the column 'table_assignment'")
}

export function isInvitationAccessReady(
  guestStatus?: string | null,
  paymentStatus: ParsedInvitationDetails['paymentStatus'] = 'not_required'
) {
  // Un invitado que ya ingreso no debe volver a recibir un QR aunque el token
  // siga activo por un registro historico. La puerta y la invitacion comparten
  // esta regla: solo un invitado habilitado puede mostrar acceso.
  if (guestStatus === 'checked_in') return false

  if (guestStatus !== 'enabled') {
    return false
  }

  return paymentStatus === 'not_required' || paymentStatus === 'approved'
}

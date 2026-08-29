import type { Guest, GuestWithType } from '@/types'
import { parseCompanionNames, parseInvitationDetails } from '@/lib/invitation-response'

export type DbGuestStatus =
  | 'preinvited'
  | 'link_sent'
  | 'registered'
  | 'enabled'
  | 'checked_in'
  | 'rejected'
  | 'duplicate'

export const DB_GUEST_STATUSES: readonly DbGuestStatus[] = [
  'preinvited',
  'link_sent',
  'registered',
  'enabled',
  'checked_in',
  'rejected',
  'duplicate',
]

type GuestTypeSubset = GuestWithType['guest_types']

type DbGuestRow = {
  id: string
  event_id: string
  guest_type_id: string
  user_id?: string | null
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  photo_url?: string | null
  document_number?: string | null
  status?: string | null
  payment_status?: string | null
  notes?: string | null
  table_assignment?: string | null
  plus_ones_allowed?: number | null
  plus_ones_confirmed?: number | null
  companion_names?: string[] | null
  created_at: string
  updated_at: string
  guest_types?: GuestTypeSubset | GuestTypeSubset[]
}

export function normalizeGuestStatus(status?: string | null): Guest['status'] {
  switch (status as DbGuestStatus | undefined) {
    case 'checked_in':
      return 'checked_in'
    case 'enabled':
    case 'registered':
      return 'confirmed'
    case 'rejected':
    case 'duplicate':
      return 'cancelled'
    case 'preinvited':
    case 'link_sent':
    default:
      return 'pending'
  }
}

export function mapGuestStatusToDb(status: Guest['status']): DbGuestStatus {
  switch (status) {
    case 'checked_in':
      return 'checked_in'
    case 'confirmed':
      return 'enabled'
    case 'cancelled':
      return 'rejected'
    case 'pending':
    default:
      return 'preinvited'
  }
}

/**
 * Que estado guardar cuando llega el vocabulario corto de 4 estados.
 *
 * El panel edita en 4 estados y la base tiene 7, asi que el viaje de ida y
 * vuelta pierde informacion: abrir a un invitado con `link_sent`, que se muestra
 * como "Pendiente", y guardar cualquier otro campo lo devolvia a `preinvited`
 * —o sea, editarle el telefono le borraba el hecho de tener su invitacion
 * emitida—.
 *
 * La regla: si el estado corto NO cambio, el estado fino no se toca. Solo se
 * escribe cuando la persona efectivamente eligio otro estado.
 */
export function resolveNextDbStatus(
  currentDbStatus: string | null | undefined,
  nextCollapsedStatus: Guest['status']
): DbGuestStatus {
  // Solo se conserva un estado que la base reconoce: `normalizeGuestStatus`
  // colapsa a "pending" cualquier cosa que no entienda, y conservar por esa vía
  // escribiría de vuelta un valor inventado.
  const current = DB_GUEST_STATUSES.find((status) => status === currentDbStatus)

  if (current && normalizeGuestStatus(current) === nextCollapsedStatus) {
    return current
  }

  return mapGuestStatusToDb(nextCollapsedStatus)
}

export function buildGuestFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim()
}

export function normalizeGuestRecord(row: DbGuestRow): GuestWithType {
  const legacyCompanionNames = parseCompanionNames(parseInvitationDetails(row.notes).companionNames)
  const companionNames = (row.companion_names ?? []).map((name) => name.trim()).filter(Boolean)
  const resolvedCompanionNames = companionNames.length > 0 ? companionNames : legacyCompanionNames
  const plusOnesAllowed = Math.max(0, row.plus_ones_allowed ?? resolvedCompanionNames.length)
  const plusOnesConfirmed = Math.min(
    plusOnesAllowed,
    Math.max(0, row.plus_ones_confirmed ?? resolvedCompanionNames.length)
  )
  return {
    id: row.id,
    event_id: row.event_id,
    guest_type_id: row.guest_type_id,
    user_id: row.user_id ?? undefined,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    photo_url: row.photo_url ?? null,
    // DNI: fuente de verdad es la columna propia. Fallback legacy si solo esta
    // embebido en notes (invitaciones respondidas antes de la columna propia).
    document_number:
      row.document_number?.trim() ||
      parseInvitationDetails(row.notes).dni.trim() ||
      null,
    status: normalizeGuestStatus(row.status),
    db_status: (row.status as DbGuestStatus | null) ?? undefined,
    payment_status:
      (row.payment_status as Guest['payment_status'] | null) ?? 'not_required',
    // Fuente de verdad: columna propia. Fallback legacy: valor embebido en notes.
    table_assignment:
      row.table_assignment?.trim() ||
      parseInvitationDetails(row.notes).tableAssignment ||
      null,
    plus_ones_allowed: plusOnesAllowed,
    plus_ones_confirmed: plusOnesConfirmed,
    companion_names: resolvedCompanionNames,
    special_requests: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    guest_types: Array.isArray(row.guest_types)
      ? row.guest_types[0] ?? null
      : row.guest_types ?? null,
  }
}

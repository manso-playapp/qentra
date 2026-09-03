import { toE164 } from '@/lib/phone'
import type { GuestImportRow } from '@/lib/guest-import'

// Reimportar una lista no debe pisar a un invitado que ya fue tocado por el
// evento: si ya se le mando invitacion, si ya respondio, o si ya pago. La
// linea de corte es el propio estado de la fila: `preinvited` sin pago
// aprobado es "todavia no paso nada", cualquier otra cosa es dato que ya no
// le pertenece a la planilla de origen.

export type ExistingGuestForMerge = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: string | null
  payment_status: string | null
}

export type BulkMergeRowResult =
  | { category: 'new'; row: GuestImportRow }
  | { category: 'update'; row: GuestImportRow; existing: ExistingGuestForMerge }
  | { category: 'protected'; row: GuestImportRow; existing: ExistingGuestForMerge; reason: string }

export type BulkMergeResult = {
  rows: BulkMergeRowResult[]
  missing: ExistingGuestForMerge[]
}

export type BulkGuestPreviewSample = { name: string; detail: string }

export type BulkGuestPreview = {
  newCount: number
  updateCount: number
  protectedCount: number
  missingCount: number
  protectedSample: BulkGuestPreviewSample[]
  missingSample: BulkGuestPreviewSample[]
}

function normalizedPhoneKey(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  return /\d/.test(trimmed) ? toE164(trimmed) : ''
}

function normalizedEmailKey(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase('es-AR') ?? ''
}

export function isProtectedGuest(guest: Pick<ExistingGuestForMerge, 'status' | 'payment_status'>) {
  return guest.status !== 'preinvited' || guest.payment_status === 'approved'
}

export function protectionReason(guest: Pick<ExistingGuestForMerge, 'status' | 'payment_status'>) {
  if (guest.payment_status === 'approved') return 'Ya pagó'
  if (guest.status === 'checked_in') return 'Ya hizo check-in'
  if (guest.status === 'rejected' || guest.status === 'duplicate') return 'Fue dado de baja en Alista'
  return 'Ya fue invitado o respondió'
}

/**
 * Compara filas importadas contra los invitados existentes de un mismo tipo
 * y decide, fila por fila, si son altas nuevas, actualizaciones seguras
 * (invitado sin tocar todavia) o coincidencias protegidas que no se deben
 * escribir. Tambien devuelve los invitados existentes que no aparecieron en
 * la planilla, solo a modo informativo (nunca se borran solos).
 *
 * El cruce es por telefono normalizado primero, email despues. Sin ninguno
 * de los dos, la fila siempre se trata como alta nueva: fusionar solo por
 * nombre es riesgoso (homonimos, hermanos, primas con el mismo nombre).
 */
export function categorizeBulkGuestRows(
  existingGuests: ExistingGuestForMerge[],
  rows: GuestImportRow[]
): BulkMergeResult {
  const byPhone = new Map<string, ExistingGuestForMerge>()
  const byEmail = new Map<string, ExistingGuestForMerge>()

  for (const guest of existingGuests) {
    const phoneKey = normalizedPhoneKey(guest.phone)
    if (phoneKey) byPhone.set(phoneKey, guest)
    const emailKey = normalizedEmailKey(guest.email)
    if (emailKey) byEmail.set(emailKey, guest)
  }

  const matchedIds = new Set<string>()

  const results: BulkMergeRowResult[] = rows.map((row) => {
    const phoneKey = normalizedPhoneKey(row.phone)
    const emailKey = normalizedEmailKey(row.email)
    const existing = (phoneKey && byPhone.get(phoneKey)) || (emailKey && byEmail.get(emailKey)) || undefined

    if (!existing) return { category: 'new', row }

    matchedIds.add(existing.id)

    if (isProtectedGuest(existing)) {
      return { category: 'protected', row, existing, reason: protectionReason(existing) }
    }

    return { category: 'update', row, existing }
  })

  const missing = existingGuests.filter((guest) => !matchedIds.has(guest.id))

  return { rows: results, missing }
}

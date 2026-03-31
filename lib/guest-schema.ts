import type { Guest, GuestWithType } from '@/types'

type DbGuestStatus =
  | 'preinvited'
  | 'link_sent'
  | 'registered'
  | 'enabled'
  | 'checked_in'
  | 'rejected'
  | 'duplicate'

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
  status?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  guest_types?: GuestTypeSubset
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

export function buildGuestFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim()
}

export function normalizeGuestRecord(row: DbGuestRow): GuestWithType {
  return {
    id: row.id,
    event_id: row.event_id,
    guest_type_id: row.guest_type_id,
    user_id: row.user_id ?? undefined,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    status: normalizeGuestStatus(row.status),
    plus_ones_allowed: 0,
    plus_ones_confirmed: 0,
    special_requests: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    guest_types: row.guest_types ?? null,
  }
}

import type { DbGuestStatus } from '@/lib/guest-schema'

// Presentacion de los 7 estados reales del ciclo del invitado. Fuente unica para
// el panel del evento y la vista global de invitados, para que el badge se lea
// igual en todos lados.
//
// `link_sent` es un nombre historico de la base y NO significa que Alista haya
// enviado nada: Alista no envia, el link sale del WhatsApp de la familia. Lo
// unico que el sistema sabe es que la invitacion quedo generada. El texto
// visible dice eso y solo eso.
export const GUEST_DB_STATUS_LABELS: Record<DbGuestStatus, string> = {
  preinvited: 'Sin invitación',
  link_sent: 'Invitación generada',
  registered: 'Registrado',
  enabled: 'Habilitado',
  checked_in: 'Ingreso',
  rejected: 'No habilitado',
  duplicate: 'Duplicado',
}

export const GUEST_DB_STATUS_STYLES: Record<DbGuestStatus, string> = {
  preinvited: 'bg-gray-100 text-gray-700',
  link_sent: 'bg-indigo-100 text-indigo-800',
  registered: 'bg-teal-100 text-teal-800',
  enabled: 'bg-emerald-100 text-emerald-800',
  checked_in: 'bg-blue-100 text-blue-800',
  rejected: 'bg-rose-100 text-rose-700',
  duplicate: 'bg-orange-100 text-orange-800',
}

// Estado del pago/aporte del invitado.
export type GuestPaymentStatus = 'not_required' | 'pending' | 'approved'

export const GUEST_PAYMENT_LABELS: Record<GuestPaymentStatus, string> = {
  not_required: 'Sin cobro',
  pending: 'Pago pendiente',
  approved: 'Pago confirmado',
}

export const GUEST_PAYMENT_STYLES: Record<GuestPaymentStatus, string> = {
  not_required: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
}

// Orden del ciclo, de "recien cargado" a "cerrado", para listas y filtros.
export const GUEST_DB_STATUS_ORDER: DbGuestStatus[] = [
  'preinvited',
  'link_sent',
  'registered',
  'enabled',
  'checked_in',
  'rejected',
  'duplicate',
]

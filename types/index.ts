// Core types for Alista platform

export interface Event {
  id: string
  name: string
  slug: string
  event_type: 'quince' | 'wedding' | 'corporate' | 'private'
  event_date: string
  start_time: string
  venue_name: string
  venue_address: string
  max_capacity: number
  status: 'active' | 'inactive' | 'cancelled'
  description?: string
  contact_phone?: string
  delivery_profile_id?: string
  created_by_user_id?: string
  created_at: string
  updated_at: string
}

/**
 * Espejo de la tabla `event_branding`.
 *
 * Antes declaraba `banner_url`, `font_family` y `custom_css`: ninguna existe en
 * la base. Las superficies pedian `banner_url` en el select, PostgREST devolvia
 * 400, y como el error se descartaba el branding quedaba en null y todo caia al
 * color por defecto. Cualquier campo que se agregue aca tiene que existir en la
 * tabla.
 */
export interface EventBranding {
  id: string
  event_id: string
  primary_color: string
  secondary_color: string
  logo_url?: string | null
  /** Portada de la invitacion. */
  cover_image_url?: string | null
  /** Fondo del totem y de la puerta. */
  background_image_url?: string | null
  totem_idle_video_url?: string | null
  welcome_message?: string | null
  approved_message?: string | null
  assistance_message?: string | null
  invalid_message?: string | null
  return_to_idle_seconds?: number | null
  created_at: string
  updated_at: string
}

/**
 * Lo que las superficies publicas (totem, puerta, invitacion) necesitan del
 * branding. Un solo lugar donde mirar cuando se cambia el select.
 */
export type SurfaceBranding = Pick<
  EventBranding,
  | 'primary_color'
  | 'secondary_color'
  | 'logo_url'
  | 'cover_image_url'
  | 'background_image_url'
  | 'welcome_message'
  | 'approved_message'
>

/** Columnas exactas a pedir para poblar `SurfaceBranding`. */
export const SURFACE_BRANDING_COLUMNS =
  'primary_color, secondary_color, logo_url, cover_image_url, background_image_url, welcome_message, approved_message'

/** Campos que el editor de branding puede escribir. */
export type UpdateEventBrandingForm = Partial<
  Pick<
    EventBranding,
    | 'primary_color'
    | 'secondary_color'
    | 'logo_url'
    | 'cover_image_url'
    | 'background_image_url'
    | 'welcome_message'
    | 'approved_message'
    | 'assistance_message'
    | 'invalid_message'
    | 'return_to_idle_seconds'
  >
>

export interface DeliveryProfile {
  id: string
  name: string
  channel_mode: 'email' | 'whatsapp' | 'hybrid'
  provider_email?: 'resend' | 'manual'
  provider_whatsapp?: 'twilio' | 'manual'
  from_email?: string
  from_phone?: string
  reply_to_phone?: string
  whatsapp_content_sid?: string
  active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface OperatorProfile {
  user_id: string
  email?: string | null
  full_name?: string | null
  roles: Array<'admin' | 'door' | 'security_supervisor'>
  active: boolean
  last_sign_in_at?: string | null
  created_at: string
  updated_at: string
}

export interface DeliveryLog {
  id: string
  event_id: string
  guest_id: string
  invitation_token_id?: string
  delivery_profile_id?: string
  channel: 'email' | 'whatsapp'
  provider?: 'resend' | 'twilio' | 'manual'
  recipient: string
  status: 'sent' | 'failed'
  external_id?: string
  error_message?: string
  created_at: string
}

export interface DeliveryHealthStatus {
  serviceRoleConfigured: boolean
  recoveryRedirectConfigured: boolean
  operatorAccessEmail: {
    ready: boolean
    missing: string[]
  }
  guestEmail: {
    ready: boolean
    missing: string[]
  }
  guestWhatsApp: {
    ready: boolean
    missing: string[]
  }
}

export interface GuestType {
  id: string
  event_id: string
  name: string
  description?: string
  is_active?: boolean
  access_policy_label?: string
  access_start_time?: string
  access_end_time?: string
  access_start_day_offset?: number
  access_end_day_offset?: number
  created_at: string
  updated_at: string
}

/**
 * Invitado. OJO: no todos los campos son columnas de la tabla `guests`.
 * Columnas reales: id, event_id, guest_type_id, first_name, last_name,
 * full_name, phone, email, document_number, photo_url, status, notes,
 * payment_status, table_assignment, created_manually, created_by_user_id,
 * created_at, updated_at.
 *
 * Campos VIRTUALES (no consultar por nombre en un select/insert, romperia):
 * - `special_requests`: alias de la columna `notes` (mapeado en la capa de API).
 * - `plus_ones_allowed` / `plus_ones_confirmed`: NO se persisten (hoy 0 fijo);
 *   los acompañantes viven serializados dentro de `notes`.
 * - `user_id`: no existe; la columna real es `created_by_user_id`.
 */
export interface Guest {
  id: string
  event_id: string
  guest_type_id: string
  user_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  /** Foto del invitado. URL firmada del bucket privado guest-photos. */
  photo_url?: string | null
  /** Documento de identidad (DNI). Columna real `document_number`. */
  document_number?: string | null
  status: 'pending' | 'confirmed' | 'checked_in' | 'cancelled'
  /**
   * Estado crudo de la base (7 valores del ciclo real). `status` lo colapsa a 4
   * para la logica de acceso; este campo lo conserva para mostrarlo en el panel.
   * Ver normalizeGuestRecord y QEN-007.
   */
  db_status?:
    | 'preinvited'
    | 'link_sent'
    | 'registered'
    | 'enabled'
    | 'checked_in'
    | 'rejected'
    | 'duplicate'
  /** Estado del pago/aporte. Gatea la emision del acceso (ver isInvitationAccessReady). */
  payment_status?: 'not_required' | 'pending' | 'approved'
  /**
   * Destino (mesa) asignado al invitado. Se muestra solo en el totem/puerta al
   * ingresar, nunca en la invitacion. Antes se embebia en `notes` como "Mesa:".
   */
  table_assignment?: string | null
  plus_ones_allowed: number
  plus_ones_confirmed: number
  special_requests?: string
  created_at: string
  updated_at: string
}

export interface GuestWithType extends Guest {
  guest_types?: Pick<
    GuestType,
    | 'name'
    | 'description'
    | 'access_policy_label'
    | 'access_start_time'
    | 'access_end_time'
    | 'access_start_day_offset'
    | 'access_end_day_offset'
  > | null
}

export interface GuestAccessArtifacts {
  invitationToken: InvitationToken
  qrCode?: GuestQrCode | null
}

export interface InvitationToken {
  id: string
  guest_id: string
  token: string
  expires_at: string
  max_uses?: number
  used_count?: number
  is_active?: boolean
  last_used_at?: string
  created_at: string
}

export interface GuestQrCode {
  id: string
  guest_id: string
  qr_value: string
  qr_image_url?: string | null
  is_active?: boolean
  generated_at?: string
  revoked_at?: string | null
}

/** Cómo se hizo el check-in. Se persiste en la columna `device_name`. */
export type CheckinMethod = 'qr' | 'manual' | 'totem'

/**
 * Espejo de la tabla `checkins`.
 *
 * El tipo anterior declaraba columnas inexistentes (`checkin_time`,
 * `checkin_method`, `notes`, `verified_by`): por eso TODO insert de check-in
 * fallaba con 400 y la tabla quedaba siempre vacía. La tabla real registra el
 * resultado del acceso (`result`/`reason`), no solo ingresos exitosos.
 */
export interface Checkin {
  id: string
  event_id: string
  guest_id: string
  qr_code_id?: string | null
  operator_user_id?: string | null
  /** Guardamos acá el método (qr/manual/totem). */
  device_name?: string | null
  result: 'approved' | 'denied'
  reason?: string | null
  checked_in_at: string
  created_at: string
}

/**
 * Espejo de la tabla `totem_sessions`.
 *
 * El tipo anterior declaraba columnas que no existen (totem_id, session_start,
 * total_scans, status...). La tabla real modela el estado visual del totem por
 * ingreso. Hoy la tabla no se usa (el totem lee el feed de checkins), pero si
 * se implementa, este tipo tiene que coincidir con estas columnas.
 */
export interface TotemSession {
  id: string
  event_id: string
  triggered_by_checkin_id?: string | null
  screen_state: string
  guest_display_name?: string | null
  guest_photo_url?: string | null
  message_text?: string | null
  started_at: string
  ends_at?: string | null
  created_at: string
}

// Form types
export interface CreateEventForm {
  name: string
  slug: string
  event_type: Event['event_type']
  event_date: string
  start_time: string
  venue_name: string
  venue_address: string
  max_capacity: number
  description?: string
  contact_phone?: string
  delivery_profile_id?: string
}

export interface CreateGuestForm {
  event_id: string
  guest_type_id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  plus_ones_allowed: number
  special_requests?: string
  table_assignment?: string
}

export interface CreateGuestTypeForm {
  event_id: string
  name: string
  description?: string
  access_policy_label?: string
  access_start_time?: string
  access_end_time?: string
  access_start_day_offset?: number
  access_end_day_offset?: number
}

export interface UpdateGuestTypeForm {
  name?: string
  description?: string
  is_active?: boolean
  access_policy_label?: string
  access_start_time?: string
  access_end_time?: string
  access_start_day_offset?: number
  access_end_day_offset?: number
}

export interface CreateDeliveryProfileForm {
  name: string
  channel_mode: DeliveryProfile['channel_mode']
  provider_email?: DeliveryProfile['provider_email']
  provider_whatsapp?: DeliveryProfile['provider_whatsapp']
  from_email?: string
  from_phone?: string
  reply_to_phone?: string
  whatsapp_content_sid?: string
  active: boolean
  notes?: string
}

export interface CreateOperatorForm {
  email: string
  password: string
  full_name: string
  roles: OperatorProfile['roles']
  active: boolean
}

export interface UpdateOperatorForm {
  full_name: string
  roles: OperatorProfile['roles']
  active: boolean
}

export interface UpdateGuestForm {
  guest_type_id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  status?: Guest['status']
  payment_status?: Guest['payment_status']
  plus_ones_allowed?: number
  plus_ones_confirmed?: number
  special_requests?: string
  table_assignment?: string | null
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// Core types for Qentra platform

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

export interface EventBranding {
  id: string
  event_id: string
  primary_color: string
  secondary_color: string
  logo_url?: string
  banner_url?: string
  font_family?: string
  custom_css?: string
  created_at: string
  updated_at: string
}

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
  max_guests?: number
  requires_invitation: boolean
  access_policy_label?: string
  access_start_time?: string
  access_end_time?: string
  access_start_day_offset?: number
  access_end_day_offset?: number
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  event_id: string
  guest_type_id: string
  user_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  status: 'pending' | 'confirmed' | 'checked_in' | 'cancelled'
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
  qrCode: GuestQrCode
}

export interface InvitationToken {
  id: string
  event_id: string
  guest_id: string
  token: string
  expires_at: string
  used_at?: string
  created_at: string
}

export interface GuestQrCode {
  id: string
  guest_id: string
  qr_code_url: string
  qr_data: string
  status: 'active' | 'inactive' | 'revoked'
  created_at: string
  updated_at: string
}

export interface Checkin {
  id: string
  guest_id: string
  event_id: string
  checkin_time: string
  checkin_method: 'qr' | 'manual' | 'totem'
  verified_by?: string
  notes?: string
  created_at: string
}

export interface TotemSession {
  id: string
  event_id: string
  totem_id: string
  session_start: string
  session_end?: string
  total_scans: number
  status: 'active' | 'completed' | 'error'
  created_at: string
  updated_at: string
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
}

export interface CreateGuestTypeForm {
  event_id: string
  name: string
  description?: string
  max_guests?: number
  requires_invitation: boolean
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
  plus_ones_allowed?: number
  plus_ones_confirmed?: number
  special_requests?: string
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

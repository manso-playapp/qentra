import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type {
  DeliveryProfile,
  DeliveryLog,
  DeliveryHealthStatus,
  Event,
  Guest,
  GuestType,
  GuestWithType,
  OperatorProfile,
  InvitationToken,
  GuestQrCode,
  GuestAccessArtifacts,
  Checkin,
  ApiResponse,
  CreateOperatorForm,
  CreateDeliveryProfileForm,
  UpdateGuestForm,
  UpdateOperatorForm,
} from '@/types'

type UpdateGuestOptions = {
  previousStatus?: Guest['status']
  checkinMethod?: Checkin['checkin_method']
  checkinNotes?: string
}

type CreateGuestAccessOptions = {
  eventSlug: string
  eventDate: string
  eventStartTime: string
}

function buildInvitationExpiry(eventDate: string, eventStartTime: string) {
  const baseDate = new Date(`${eventDate}T${eventStartTime || '20:00'}:00`)

  if (Number.isNaN(baseDate.getTime())) {
    const fallback = new Date()
    fallback.setDate(fallback.getDate() + 7)
    return fallback.toISOString()
  }

  baseDate.setHours(baseDate.getHours() + 12)
  return baseDate.toISOString()
}

function buildGuestAccessToken() {
  return `qentra_${crypto.randomUUID().replace(/-/g, '')}`
}

// Hook para perfiles de delivery
export function useDeliveryProfiles() {
  const [deliveryProfiles, setDeliveryProfiles] = useState<DeliveryProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliveryProfiles()
  }, [])

  const fetchDeliveryProfiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('delivery_profiles')
        .select('*')
        .order('active', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      setDeliveryProfiles((data ?? []) as DeliveryProfile[])
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const createDeliveryProfile = async (
    profileData: CreateDeliveryProfileForm
  ): Promise<ApiResponse<DeliveryProfile>> => {
    try {
      const { data, error } = await supabase
        .from('delivery_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) throw error

      setDeliveryProfiles((current) => [...current, data as DeliveryProfile])
      return { data: data as DeliveryProfile }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  return {
    deliveryProfiles,
    loading,
    error,
    fetchDeliveryProfiles,
    createDeliveryProfile,
  }
}

export function useDeliveryLogs(limit = 20) {
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeliveryLogs = useCallback(async (nextLimit = limit) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('delivery_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(nextLimit)

      if (error) throw error
      setDeliveryLogs((data ?? []) as DeliveryLog[])
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchDeliveryLogs(limit)
  }, [fetchDeliveryLogs, limit])

  return {
    deliveryLogs,
    loading,
    error,
    fetchDeliveryLogs,
  }
}

export function useDeliveryHealth() {
  const [deliveryHealth, setDeliveryHealth] = useState<DeliveryHealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeliveryHealth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/settings/delivery-health')
      const payload = (await response.json().catch(() => null)) as
        | { data?: DeliveryHealthStatus; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo cargar el estado de delivery.')
      }

      setDeliveryHealth(payload?.data ?? null)
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDeliveryHealth()
  }, [fetchDeliveryHealth])

  return {
    deliveryHealth,
    loading,
    error,
    fetchDeliveryHealth,
  }
}

export function useOperatorProfiles() {
  const [operatorProfiles, setOperatorProfiles] = useState<OperatorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOperatorProfiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/operators')
      const payload = (await response.json().catch(() => null)) as
        | { data?: OperatorProfile[]; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudieron cargar los operadores.')
      }

      setOperatorProfiles(payload?.data ?? [])
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOperatorProfiles()
  }, [fetchOperatorProfiles])

  const createOperatorProfile = async (
    operatorData: CreateOperatorForm
  ): Promise<ApiResponse<OperatorProfile>> => {
    try {
      const response = await fetch('/api/operators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: operatorData.email,
          password: operatorData.password,
          fullName: operatorData.full_name,
          roles: operatorData.roles,
          active: operatorData.active,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: OperatorProfile; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo crear el operador.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el operador creado.')
      }

      setOperatorProfiles((current) => [payload.data as OperatorProfile, ...current])
      return { data: payload.data as OperatorProfile }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  const updateOperatorProfile = async (
    userId: string,
    operatorData: UpdateOperatorForm
  ): Promise<ApiResponse<OperatorProfile>> => {
    try {
      const response = await fetch(`/api/operators/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: operatorData.full_name,
          roles: operatorData.roles,
          active: operatorData.active,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: OperatorProfile; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el operador.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el operador actualizado.')
      }

      setOperatorProfiles((current) =>
        current.map((profile) =>
          profile.user_id === userId ? payload.data as OperatorProfile : profile
        )
      )

      return { data: payload.data as OperatorProfile }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  return {
    operatorProfiles,
    loading,
    error,
    fetchOperatorProfiles,
    createOperatorProfile,
    updateOperatorProfile,
  }
}

// Hook para eventos
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Event>> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (error) throw error

      setEvents(prev => [data, ...prev])
      return { data }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  const updateEvent = async (id: string, updates: Partial<Event>): Promise<ApiResponse<Event>> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setEvents(prev => prev.map(event => event.id === id ? data : event))
      return { data }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent
  }
}

// Hook para tipos de invitados
export function useGuestTypes(eventId?: string) {
  const [guestTypes, setGuestTypes] = useState<GuestType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuestTypes = async (id?: string) => {
    if (!id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('guest_types')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setGuestTypes(data || [])
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchGuestTypes(eventId)
    }
  }, [eventId])

  const createGuestType = async (guestTypeData: Omit<GuestType, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<GuestType>> => {
    try {
      const { data, error } = await supabase
        .from('guest_types')
        .insert(guestTypeData)
        .select()
        .single()

      if (error) throw error

      setGuestTypes(prev => [...prev, data])
      return { data }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  return {
    guestTypes,
    loading,
    error,
    fetchGuestTypes,
    createGuestType
  }
}

// Hook para invitados
export function useGuests(eventId?: string) {
  const [guests, setGuests] = useState<GuestWithType[]>([])
  const [invitationTokens, setInvitationTokens] = useState<InvitationToken[]>([])
  const [guestQrCodes, setGuestQrCodes] = useState<GuestQrCode[]>([])
  const [loading, setLoading] = useState(false)
  const [accessLoading, setAccessLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)

  const fetchGuests = async (id?: string) => {
    if (!id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('guests')
        .select(`
          *,
          guest_types (
            name,
            description,
            access_policy_label,
            access_start_time,
            access_end_time,
            access_start_day_offset,
            access_end_day_offset
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGuests((data ?? []) as GuestWithType[])
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      fetchGuests(eventId)
    }
  }, [eventId])

  const fetchGuestAccess = useCallback(async (guestList?: GuestWithType[]) => {
    if (!eventId) return

    try {
      setAccessLoading(true)
      const currentGuests = guestList ?? guests
      const guestIds = currentGuests.map((guest) => guest.id)

      const { data: tokenData, error: tokenError } = await supabase
        .from('invitation_tokens')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (tokenError) throw tokenError

      setInvitationTokens((tokenData ?? []) as InvitationToken[])

      if (guestIds.length === 0) {
        setGuestQrCodes([])
        setAccessError(null)
        return
      }

      const { data: qrData, error: qrError } = await supabase
        .from('guest_qr_codes')
        .select('*')
        .in('guest_id', guestIds)
        .order('created_at', { ascending: false })

      if (qrError) throw qrError

      setGuestQrCodes((qrData ?? []) as GuestQrCode[])
      setAccessError(null)
    } catch (error) {
      setAccessError(getErrorMessage(error))
    } finally {
      setAccessLoading(false)
    }
  }, [eventId, guests])

  useEffect(() => {
    if (eventId) {
      fetchGuestAccess(guests)
    }
  }, [eventId, guests, fetchGuestAccess])

  const createGuest = async (guestData: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Guest>> => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .insert(guestData)
        .select()
        .single()

      if (error) throw error

      // Refetch para obtener los datos completos con guest_types
      await fetchGuests(eventId)
      return { data }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  const updateGuest = async (
    id: string,
    updates: UpdateGuestForm,
    options?: UpdateGuestOptions
  ): Promise<ApiResponse<Guest>> => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const shouldCreateCheckin =
        updates.status === 'checked_in' &&
        options?.previousStatus !== 'checked_in'

      const shouldRevokeQrCodes =
        updates.status === 'cancelled' &&
        options?.previousStatus !== 'cancelled'

      if (shouldCreateCheckin) {
        const { error: checkinError } = await supabase
          .from('checkins')
          .insert({
            guest_id: data.id,
            event_id: data.event_id,
            checkin_time: new Date().toISOString(),
            checkin_method: options?.checkinMethod ?? 'manual',
            notes: options?.checkinNotes,
          })

        if (checkinError) {
          await fetchGuests(eventId)
          return {
            data,
            error: `El invitado se actualizo, pero no se pudo registrar el check-in: ${checkinError.message}`,
          }
        }
      }

      if (shouldRevokeQrCodes) {
        const { error: revokeQrError } = await supabase
          .from('guest_qr_codes')
          .update({ status: 'revoked' })
          .eq('guest_id', data.id)
          .eq('status', 'active')

        if (revokeQrError) {
          await fetchGuests(eventId)
          await fetchGuestAccess()
          return {
            data,
            error: `El invitado se actualizo, pero no se pudieron revocar sus QR activos: ${revokeQrError.message}`,
          }
        }
      }

      await fetchGuests(eventId)
      await fetchGuestAccess()
      return { data }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  const createGuestAccess = async (
    guest: Pick<Guest, 'id' | 'event_id' | 'first_name' | 'last_name'>,
    options: CreateGuestAccessOptions
  ): Promise<ApiResponse<GuestAccessArtifacts>> => {
    try {
      const tokenValue = buildGuestAccessToken()
      const expiresAt = buildInvitationExpiry(options.eventDate, options.eventStartTime)
      const qrPayload = buildGuestAccessQrPayload({
        eventId: guest.event_id,
        eventSlug: options.eventSlug,
        guestId: guest.id,
        guestName: `${guest.first_name} ${guest.last_name}`.trim(),
        token: tokenValue,
      })

      const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
      })

      const { data: tokenData, error: tokenError } = await supabase
        .from('invitation_tokens')
        .insert({
          event_id: guest.event_id,
          guest_id: guest.id,
          token: tokenValue,
          expires_at: expiresAt,
        })
        .select()
        .single()

      if (tokenError) throw tokenError

      const { error: revokeQrError } = await supabase
        .from('guest_qr_codes')
        .update({ status: 'inactive' })
        .eq('guest_id', guest.id)
        .eq('status', 'active')

      if (revokeQrError) throw revokeQrError

      const { data: qrData, error: qrError } = await supabase
        .from('guest_qr_codes')
        .insert({
          guest_id: guest.id,
          qr_code_url: qrCodeUrl,
          qr_data: qrPayload,
          status: 'active',
        })
        .select()
        .single()

      if (qrError) throw qrError

      await fetchGuestAccess()
      return {
        data: {
          invitationToken: tokenData as InvitationToken,
          qrCode: qrData as GuestQrCode,
        },
      }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  return {
    guests,
    invitationTokens,
    guestQrCodes,
    loading,
    accessLoading,
    error,
    accessError,
    fetchGuests,
    fetchGuestAccess,
    createGuest,
    updateGuest,
    createGuestAccess
  }
}

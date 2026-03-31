import { useState, useEffect, useCallback } from 'react'
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
  CreateGuestTypeForm,
  UpdateGuestForm,
  UpdateGuestTypeForm,
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
export function useGuestTypes(eventId?: string, initialGuestTypes: GuestType[] = []) {
  const [guestTypes, setGuestTypes] = useState<GuestType[]>(initialGuestTypes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuestTypes = async (id?: string) => {
    if (!id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/guest-types?eventId=${id}`)
      const payload = (await response.json().catch(() => null)) as
        | { data?: GuestType[]; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudieron cargar los tipos de invitado.')
      }

      setGuestTypes(payload?.data ?? [])
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

  const createGuestType = async (
    guestTypeData: CreateGuestTypeForm
  ): Promise<ApiResponse<GuestType>> => {
    try {
      const response = await fetch('/api/guest-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestTypeData),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: GuestType; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo crear el tipo de invitado.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el tipo de invitado creado.')
      }

      setGuestTypes((prev) => [...prev, payload.data as GuestType])
      return { data: payload.data as GuestType }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  const updateGuestType = async (
    guestTypeId: string,
    guestTypeData: UpdateGuestTypeForm
  ): Promise<ApiResponse<GuestType>> => {
    try {
      const response = await fetch(`/api/guest-types/${guestTypeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestTypeData),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: GuestType; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el tipo de invitado.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el tipo de invitado actualizado.')
      }

      setGuestTypes((current) =>
        current.map((guestType) =>
          guestType.id === guestTypeId ? (payload.data as GuestType) : guestType
        )
      )

      return { data: payload.data as GuestType }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  const deleteGuestType = async (guestTypeId: string): Promise<ApiResponse<{ id: string }>> => {
    try {
      const response = await fetch(`/api/guest-types/${guestTypeId}`, {
        method: 'DELETE',
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: { id: string }; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo borrar el tipo de invitado.')
      }

      setGuestTypes((current) => current.filter((guestType) => guestType.id !== guestTypeId))
      return { data: payload?.data ?? { id: guestTypeId } }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  return {
    guestTypes,
    loading,
    error,
    fetchGuestTypes,
    createGuestType,
    updateGuestType,
    deleteGuestType,
  }
}

// Hook para invitados
export function useGuests(eventId?: string, initialGuests: GuestWithType[] = []) {
  const [guests, setGuests] = useState<GuestWithType[]>(initialGuests)
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
      const response = await fetch(`/api/guests?eventId=${id}`)
      const payload = (await response.json().catch(() => null)) as
        | { data?: GuestWithType[]; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudieron cargar los invitados.')
      }

      setGuests(payload?.data ?? [])
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

      if (guestIds.length === 0) {
        setInvitationTokens([])
        setGuestQrCodes([])
        setAccessError(null)
        return
      }

      const response = await fetch(`/api/guest-access?eventId=${eventId}`)
      const payload = (await response.json().catch(() => null)) as
        | {
            data?: {
              invitationTokens?: InvitationToken[]
              guestQrCodes?: GuestQrCode[]
            }
            error?: string
          }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudieron cargar los accesos emitidos.')
      }

      setInvitationTokens(payload?.data?.invitationTokens ?? [])
      setGuestQrCodes(payload?.data?.guestQrCodes ?? [])
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
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestData),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: GuestWithType; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo crear el invitado.')
      }

      if (payload?.data) {
        setGuests((current) => {
          const nextGuest = payload.data as GuestWithType
          const deduped = current.filter((guest) => guest.id !== nextGuest.id)
          return [nextGuest, ...deduped]
        })
      }

      void fetchGuests(eventId)
      return { data: payload?.data as Guest }
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
      const response = await fetch(`/api/guests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: GuestWithType; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo actualizar el invitado.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el invitado actualizado.')
      }

      const data = payload.data as GuestWithType

      setGuests((current) =>
        current.map((guest) => (guest.id === id ? data : guest))
      )

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
        const revokedAt = new Date().toISOString()
        const { error: revokeQrError } = await supabase
          .from('guest_qr_codes')
          .update({ is_active: false, revoked_at: revokedAt })
          .eq('guest_id', data.id)
          .eq('is_active', true)

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

  const deleteGuest = async (id: string): Promise<ApiResponse<{ id: string }>> => {
    try {
      const response = await fetch(`/api/guests/${id}`, {
        method: 'DELETE',
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: { id: string }; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo borrar el invitado.')
      }

      setGuests((current) => current.filter((guest) => guest.id !== id))
      setInvitationTokens((current) => current.filter((token) => token.guest_id !== id))
      setGuestQrCodes((current) => current.filter((qrCode) => qrCode.guest_id !== id))

      return { data: payload?.data ?? { id } }
    } catch (error) {
      return { error: getErrorMessage(error) }
    }
  }

  const createGuestAccess = async (
    guest: Pick<Guest, 'id' | 'event_id' | 'first_name' | 'last_name'>,
    options: CreateGuestAccessOptions
  ): Promise<ApiResponse<GuestAccessArtifacts>> => {
    try {
      const response = await fetch('/api/guest-access/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: guest.id,
          eventId: guest.event_id,
          eventSlug: options.eventSlug,
          eventDate: options.eventDate,
          eventStartTime: options.eventStartTime,
          guestName: `${guest.first_name} ${guest.last_name}`.trim(),
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            data?: GuestAccessArtifacts
            error?: string
          }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo emitir el acceso del invitado.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el acceso emitido.')
      }

      setInvitationTokens((current) => {
        const nextToken = payload.data!.invitationToken
        const deduped = current.filter((token) => token.id !== nextToken.id)
        return [nextToken, ...deduped]
      })

      if (payload.data?.qrCode) {
        setGuestQrCodes((current) => {
          const nextQr = payload.data!.qrCode as GuestQrCode
          const remaining = current.filter((qrCode) => qrCode.guest_id !== nextQr.guest_id)
          return [nextQr, ...remaining]
        })
      } else {
        setGuestQrCodes((current) => current.filter((qrCode) => qrCode.guest_id !== guest.id))
      }

      void fetchGuestAccess()
      return {
        data: payload.data,
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
    deleteGuest,
    createGuestAccess
  }
}

'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatGuestTypeAccessPolicy } from '@/lib/access-policy'
import { useGuestTypes, useGuests } from '@/lib/hooks'
import type {
  CreateGuestForm,
  CreateGuestTypeForm,
  Event,
  Guest,
  GuestType,
  GuestWithType,
  InvitationToken,
  GuestQrCode,
  UpdateGuestForm,
} from '@/types'

type EventGuestsManagerProps = {
  event: Pick<Event, 'id' | 'name' | 'slug' | 'max_capacity' | 'event_date' | 'start_time' | 'delivery_profile_id'>
}

type GuestFormState = {
  guest_type_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  plus_ones_allowed: string
  special_requests: string
}

type GuestTypeFormState = {
  name: string
  description: string
  max_guests: string
  requires_invitation: boolean
  access_policy_label: string
  access_start_time: string
  access_end_time: string
  access_start_day_offset: string
  access_end_day_offset: string
}

type GuestEditFormState = {
  guest_type_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  status: Guest['status']
  plus_ones_allowed: string
  plus_ones_confirmed: string
  special_requests: string
}

const GUEST_STATUS_LABELS: Record<Guest['status'], string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  checked_in: 'Check-in',
  cancelled: 'Cancelado',
}

const GUEST_STATUS_STYLES: Record<Guest['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  checked_in: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

const INITIAL_GUEST_FORM: GuestFormState = {
  guest_type_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  plus_ones_allowed: '0',
  special_requests: '',
}

const INITIAL_GUEST_TYPE_FORM: GuestTypeFormState = {
  name: '',
  description: '',
  max_guests: '',
  requires_invitation: true,
  access_policy_label: '',
  access_start_time: '',
  access_end_time: '',
  access_start_day_offset: '0',
  access_end_day_offset: '0',
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

function trimOptionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number.parseInt(trimmed, 10) : undefined
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function buildInvitationPath(token: string, guestName?: string) {
  const params = new URLSearchParams()

  if (guestName?.trim()) {
    params.set('guest', guestName.trim())
  }

  const query = params.toString()
  return `/invitacion/${token}${query ? `?${query}` : ''}`
}

function createGuestEditForm(guest: GuestWithType): GuestEditFormState {
  return {
    guest_type_id: guest.guest_type_id,
    first_name: guest.first_name,
    last_name: guest.last_name,
    email: guest.email ?? '',
    phone: guest.phone ?? '',
    status: guest.status,
    plus_ones_allowed: String(guest.plus_ones_allowed),
    plus_ones_confirmed: String(guest.plus_ones_confirmed),
    special_requests: guest.special_requests ?? '',
  }
}

export default function EventGuestsManager({ event }: EventGuestsManagerProps) {
  const { guestTypes, loading: guestTypesLoading, error: guestTypesError, createGuestType } = useGuestTypes(event.id)
  const {
    guests,
    invitationTokens,
    guestQrCodes,
    loading: guestsLoading,
    accessLoading,
    error: guestsError,
    accessError,
    createGuest,
    updateGuest,
    createGuestAccess,
  } = useGuests(event.id)

  const [guestForm, setGuestForm] = useState<GuestFormState>(INITIAL_GUEST_FORM)
  const [guestTypeForm, setGuestTypeForm] = useState<GuestTypeFormState>(INITIAL_GUEST_TYPE_FORM)
  const [guestSubmitError, setGuestSubmitError] = useState<string | null>(null)
  const [guestTypeSubmitError, setGuestTypeSubmitError] = useState<string | null>(null)
  const [guestSubmitting, setGuestSubmitting] = useState(false)
  const [guestTypeSubmitting, setGuestTypeSubmitting] = useState(false)
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editGuestForm, setEditGuestForm] = useState<GuestEditFormState | null>(null)
  const [guestRowActionError, setGuestRowActionError] = useState<string | null>(null)
  const [guestRowActionNotice, setGuestRowActionNotice] = useState<string | null>(null)
  const [guestRowActionLoadingId, setGuestRowActionLoadingId] = useState<string | null>(null)
  const [guestAccessActionLoadingId, setGuestAccessActionLoadingId] = useState<string | null>(null)
  const [copiedInvitationGuestId, setCopiedInvitationGuestId] = useState<string | null>(null)
  const [deliveryLoadingKey, setDeliveryLoadingKey] = useState<string | null>(null)
  const selectedGuestTypeId = guestForm.guest_type_id || guestTypes[0]?.id || ''
  const latestInvitationTokenByGuestId = useMemo(() => {
    const map = new Map<string, InvitationToken>()

    for (const token of invitationTokens) {
      if (!map.has(token.guest_id)) {
        map.set(token.guest_id, token)
      }
    }

    return map
  }, [invitationTokens])

  const latestGuestQrByGuestId = useMemo(() => {
    const map = new Map<string, GuestQrCode>()

    for (const qrCode of guestQrCodes) {
      if (!map.has(qrCode.guest_id)) {
        map.set(qrCode.guest_id, qrCode)
      }
    }

    return map
  }, [guestQrCodes])

  const totals = useMemo(() => {
    const pending = guests.filter((guest) => guest.status === 'pending').length
    const confirmed = guests.filter((guest) => guest.status === 'confirmed' || guest.status === 'checked_in').length
    const checkedIn = guests.filter((guest) => guest.status === 'checked_in').length
    const reservedSeats = guests.length + guests.reduce((sum, guest) => sum + guest.plus_ones_confirmed, 0)

    return {
      pending,
      confirmed,
      checkedIn,
      reservedSeats,
      remainingCapacity: Math.max(event.max_capacity - reservedSeats, 0),
    }
  }, [event.max_capacity, guests])

  const handleGuestInputChange = (
    eventInput: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = eventInput.target
    setGuestForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleGuestTypeInputChange = (
    eventInput: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setGuestTypeForm((current) => ({
      ...current,
      [eventInput.target.name]:
        eventInput.target instanceof HTMLInputElement && eventInput.target.type === 'checkbox'
          ? eventInput.target.checked
          : eventInput.target.value,
    }))
  }

  const handleCreateGuestType = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setGuestTypeSubmitting(true)
    setGuestTypeSubmitError(null)

    const payload: CreateGuestTypeForm = {
      event_id: event.id,
      name: guestTypeForm.name.trim(),
      description: trimOptionalValue(guestTypeForm.description),
      max_guests: parseOptionalInteger(guestTypeForm.max_guests),
      requires_invitation: guestTypeForm.requires_invitation,
      access_policy_label: trimOptionalValue(guestTypeForm.access_policy_label),
      access_start_time: trimOptionalValue(guestTypeForm.access_start_time),
      access_end_time: trimOptionalValue(guestTypeForm.access_end_time),
      access_start_day_offset: parseOptionalInteger(guestTypeForm.access_start_day_offset),
      access_end_day_offset: parseOptionalInteger(guestTypeForm.access_end_day_offset),
    }

    const result = await createGuestType(payload)

    if (result.error) {
      setGuestTypeSubmitError(result.error)
    } else {
      const createdGuestType = result.data as GuestType | undefined
      setGuestTypeForm(INITIAL_GUEST_TYPE_FORM)

      if (createdGuestType) {
        setGuestForm((current) => ({
          ...current,
          guest_type_id: createdGuestType.id,
        }))
      }
    }

    setGuestTypeSubmitting(false)
  }

  const handleCreateGuest = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setGuestSubmitting(true)
    setGuestSubmitError(null)

    const payload: CreateGuestForm & {
      status: Guest['status']
      plus_ones_confirmed: number
    } = {
      event_id: event.id,
      guest_type_id: selectedGuestTypeId,
      first_name: guestForm.first_name.trim(),
      last_name: guestForm.last_name.trim(),
      email: trimOptionalValue(guestForm.email),
      phone: trimOptionalValue(guestForm.phone),
      plus_ones_allowed: Number.parseInt(guestForm.plus_ones_allowed || '0', 10),
      plus_ones_confirmed: 0,
      special_requests: trimOptionalValue(guestForm.special_requests),
      status: 'pending',
    }

    const result = await createGuest(payload)

    if (result.error) {
      setGuestSubmitError(result.error)
    } else {
      setGuestForm((current) => ({
        ...INITIAL_GUEST_FORM,
        guest_type_id: current.guest_type_id,
      }))
    }

    setGuestSubmitting(false)
  }

  const startEditingGuest = (guest: GuestWithType) => {
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)
    setEditingGuestId(guest.id)
    setEditGuestForm(createGuestEditForm(guest))
  }

  const cancelEditingGuest = () => {
    setEditingGuestId(null)
    setEditGuestForm(null)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)
  }

  const handleEditGuestInputChange = (
    eventInput: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = eventInput.target
    setEditGuestForm((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        [name]: value,
      }
    })
  }

  const saveGuestUpdates = async (guestId: string) => {
    if (!editGuestForm) {
      return
    }

    setGuestRowActionLoadingId(guestId)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    const payload: UpdateGuestForm = {
      guest_type_id: editGuestForm.guest_type_id,
      first_name: editGuestForm.first_name.trim(),
      last_name: editGuestForm.last_name.trim(),
      email: trimOptionalValue(editGuestForm.email),
      phone: trimOptionalValue(editGuestForm.phone),
      status: editGuestForm.status,
      plus_ones_allowed: Number.parseInt(editGuestForm.plus_ones_allowed || '0', 10),
      plus_ones_confirmed: Number.parseInt(editGuestForm.plus_ones_confirmed || '0', 10),
      special_requests: trimOptionalValue(editGuestForm.special_requests),
    }

    const result = await updateGuest(guestId, payload, {
      previousStatus: guests.find((guest) => guest.id === guestId)?.status,
      checkinMethod: 'manual',
      checkinNotes: 'Registro desde Qentra Admin',
    })

    if (result.error) {
      setGuestRowActionError(result.error)
    } else {
      setEditingGuestId(null)
      setEditGuestForm(null)
    }

    setGuestRowActionLoadingId(null)
  }

  const runQuickStatusUpdate = async (guest: GuestWithType, status: Guest['status']) => {
    setGuestRowActionLoadingId(guest.id)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    const payload: UpdateGuestForm = { status }

    if (status === 'checked_in' && guest.status === 'pending') {
      payload.plus_ones_confirmed = guest.plus_ones_allowed
    }

    const result = await updateGuest(guest.id, payload, {
      previousStatus: guest.status,
      checkinMethod: 'manual',
      checkinNotes: 'Registro desde Qentra Admin',
    })

    if (result.error) {
      setGuestRowActionError(result.error)
    }

    setGuestRowActionLoadingId(null)
  }

  const issueGuestAccess = async (guest: GuestWithType) => {
    setGuestAccessActionLoadingId(guest.id)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    const result = await createGuestAccess(guest, {
      eventSlug: event.slug,
      eventDate: event.event_date,
      eventStartTime: event.start_time,
    })

    if (result.error) {
      setGuestRowActionError(result.error)
    }

    setGuestAccessActionLoadingId(null)
  }

  const buildAbsoluteInvitationUrl = (token: string, guestName?: string) => {
    const invitationPath = buildInvitationPath(token, guestName)

    if (typeof window === 'undefined') {
      return invitationPath
    }

    return new URL(invitationPath, window.location.origin).toString()
  }

  const buildShareMessage = (guest: GuestWithType, token: InvitationToken) => {
    const guestName = `${guest.first_name} ${guest.last_name}`.trim()
    const invitationUrl = buildAbsoluteInvitationUrl(token.token, guestName)

    return {
      invitationUrl,
      whatsappText: `Hola ${guest.first_name}, aqui tienes tu acceso para ${event.name}. Presenta este enlace en puerta: ${invitationUrl}`,
      emailSubject: `Tu acceso para ${event.name}`,
      emailBody: `Hola ${guestName},\n\nTe compartimos tu acceso para ${event.name}.\n\nAbre este enlace desde tu celular y muestra el QR en puerta:\n${invitationUrl}\n\nVigencia: ${formatDateTime(token.expires_at)}\n`,
    }
  }

  const copyInvitationLink = async (guest: GuestWithType, token: InvitationToken) => {
    const { invitationUrl } = buildShareMessage(guest, token)

    try {
      await navigator.clipboard.writeText(invitationUrl)
      setCopiedInvitationGuestId(guest.id)
      window.setTimeout(() => {
        setCopiedInvitationGuestId((current) => (current === guest.id ? null : current))
      }, 2500)
    } catch (error) {
      setGuestRowActionError(error instanceof Error ? error.message : 'No se pudo copiar el enlace de invitacion.')
    }
  }

  const sendGuestAccessThroughProvider = async (
    guest: GuestWithType,
    token: InvitationToken,
    channel: 'email' | 'whatsapp'
  ) => {
    const guestName = `${guest.first_name} ${guest.last_name}`.trim()
    const recipient = channel === 'email' ? guest.email?.trim() : guest.phone?.trim()

    if (!recipient) {
      setGuestRowActionError(
        channel === 'email'
          ? `Falta email para enviar el acceso a ${guestName}.`
          : `Falta telefono para enviar el acceso a ${guestName}.`
      )
      setGuestRowActionNotice(null)
      return
    }

    const requestKey = `${guest.id}:${channel}`
    setDeliveryLoadingKey(requestKey)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    try {
      const invitationUrl = buildAbsoluteInvitationUrl(token.token, guestName)
      const response = await fetch('/api/guest-access/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: guest.event_id,
          guestId: guest.id,
          invitationTokenId: token.id,
          deliveryProfileId: event.delivery_profile_id,
          channel,
          recipient,
          guestName,
          guestFirstName: guest.first_name,
          eventName: event.name,
          invitationUrl,
          expiresAt: token.expires_at,
        }),
      })

      const payload = (await response.json()) as { error?: string; provider?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo enviar el acceso.')
      }

      setGuestRowActionNotice(
        `${channel === 'email' ? 'Email' : 'WhatsApp'} enviado a ${guestName} por ${payload.provider}.`
      )
    } catch (error) {
      setGuestRowActionError(error instanceof Error ? error.message : 'No se pudo enviar el acceso.')
    } finally {
      setDeliveryLoadingKey(null)
    }
  }

  const openWhatsAppShare = (guest: GuestWithType, token: InvitationToken) => {
    const { whatsappText } = buildShareMessage(guest, token)
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer')
  }

  const openEmailShare = (guest: GuestWithType, token: InvitationToken) => {
    const { emailSubject, emailBody } = buildShareMessage(guest, token)
    window.location.href = `mailto:${guest.email ?? ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href={`/admin/events/${event.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
            ← Volver al evento
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Invitados de {event.name}</h1>
          <p className="mt-2 text-gray-600">
            {formatDate(event.event_date)} · {event.start_time} · slug <span className="font-mono text-sm">{event.slug}</span>
          </p>
        </div>

        <Link
          href="/admin/events/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Crear otro evento
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Invitados cargados</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{guests.length}</p>
          <p className="mt-1 text-sm text-gray-600">Registros manuales actuales</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Confirmados</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totals.confirmed}</p>
          <p className="mt-1 text-sm text-gray-600">{totals.checkedIn} ya hicieron check-in</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totals.pending}</p>
          <p className="mt-1 text-sm text-gray-600">Esperando confirmacion</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Capacidad restante</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{totals.remainingCapacity}</p>
          <p className="mt-1 text-sm text-gray-600">Sobre {event.max_capacity} plazas totales</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <section className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tipos de invitado</h2>
                <p className="mt-1 text-sm text-gray-600">Primero define las categorias que luego podras asignar.</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                {guestTypes.length} activos
              </span>
            </div>

            {guestTypesError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Error al cargar tipos: {guestTypesError}
              </div>
            )}

            {guestTypesLoading ? (
              <div className="mt-4 flex h-32 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : guestTypes.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                Todavia no hay tipos creados. Crea al menos uno para habilitar el alta manual de invitados.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {guestTypes.map((guestType) => (
                  <div key={guestType.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{guestType.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {guestType.description?.trim() || 'Sin descripcion adicional.'}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        guestType.requires_invitation
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {guestType.requires_invitation ? 'Con invitacion' : 'Libre'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                      Cupo: {guestType.max_guests ?? 'sin limite'}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Acceso: {formatGuestTypeAccessPolicy(guestType, event.start_time)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Listado de invitados</h2>
                <p className="mt-1 text-sm text-gray-600">Vista operativa para confirmar, revisar contactos y capacidad.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {guests.length} registros
              </span>
            </div>

            {(guestsError || accessError) && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Error al cargar invitados: {guestsError || accessError}
              </div>
            )}

            {guestsLoading || accessLoading ? (
              <div className="mt-4 flex h-40 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : guests.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                Todavia no hay invitados cargados para este evento.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {guestRowActionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Error al actualizar invitado: {guestRowActionError}
                  </div>
                )}
                {guestRowActionNotice && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    {guestRowActionNotice}
                  </div>
                )}
                {guests.map((guest) => (
                  <div key={guest.id} className="rounded-lg border border-gray-200 p-4">
                    {editingGuestId === guest.id && editGuestForm ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-gray-900">Editando invitado</h3>
                            <p className="mt-1 text-sm text-gray-600">{guest.first_name} {guest.last_name}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${GUEST_STATUS_STYLES[editGuestForm.status]}`}>
                            {GUEST_STATUS_LABELS[editGuestForm.status]}
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label htmlFor={`edit-first-name-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Nombre
                            </label>
                            <input
                              id={`edit-first-name-${guest.id}`}
                              name="first_name"
                              value={editGuestForm.first_name}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-last-name-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Apellido
                            </label>
                            <input
                              id={`edit-last-name-${guest.id}`}
                              name="last_name"
                              value={editGuestForm.last_name}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-email-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Email
                            </label>
                            <input
                              id={`edit-email-${guest.id}`}
                              name="email"
                              type="email"
                              value={editGuestForm.email}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-phone-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Telefono
                            </label>
                            <input
                              id={`edit-phone-${guest.id}`}
                              name="phone"
                              value={editGuestForm.phone}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-type-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Tipo
                            </label>
                            <select
                              id={`edit-type-${guest.id}`}
                              name="guest_type_id"
                              value={editGuestForm.guest_type_id}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              {guestTypes.map((guestType) => (
                                <option key={guestType.id} value={guestType.id}>
                                  {guestType.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`edit-status-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Estado
                            </label>
                            <select
                              id={`edit-status-${guest.id}`}
                              name="status"
                              value={editGuestForm.status}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              {Object.entries(GUEST_STATUS_LABELS).map(([status, label]) => (
                                <option key={status} value={status}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`edit-plus-ones-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Acompanantes permitidos
                            </label>
                            <input
                              id={`edit-plus-ones-${guest.id}`}
                              name="plus_ones_allowed"
                              type="number"
                              min="0"
                              value={editGuestForm.plus_ones_allowed}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-plus-ones-confirmed-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Acompanantes confirmados
                            </label>
                            <input
                              id={`edit-plus-ones-confirmed-${guest.id}`}
                              name="plus_ones_confirmed"
                              type="number"
                              min="0"
                              value={editGuestForm.plus_ones_confirmed}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor={`edit-special-requests-${guest.id}`} className="block text-sm font-medium text-gray-700">
                            Pedido especial
                          </label>
                          <textarea
                            id={`edit-special-requests-${guest.id}`}
                            name="special_requests"
                            rows={3}
                            value={editGuestForm.special_requests}
                            onChange={handleEditGuestInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => saveGuestUpdates(guest.id)}
                            disabled={guestRowActionLoadingId === guest.id}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {guestRowActionLoadingId === guest.id ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingGuest}
                            disabled={guestRowActionLoadingId === guest.id}
                            className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const latestToken = latestInvitationTokenByGuestId.get(guest.id)
                          const latestQrCode = latestGuestQrByGuestId.get(guest.id)

                          return (
                            <>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-gray-900">
                                {guest.first_name} {guest.last_name}
                              </h3>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${GUEST_STATUS_STYLES[guest.status]}`}>
                                {GUEST_STATUS_LABELS[guest.status]}
                              </span>
                            </div>

                            <div className="mt-2 grid gap-1 text-sm text-gray-600">
                              <p>Tipo: {guest.guest_types?.name || 'Sin tipo asociado'}</p>
                              <p>Email: {guest.email || 'No cargado'}</p>
                              <p>Telefono: {guest.phone || 'No cargado'}</p>
                              <p>Acceso: {formatGuestTypeAccessPolicy(guest.guest_types, event.start_time)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 lg:min-w-[270px]">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <p className="text-xs uppercase tracking-wide text-gray-500">Acompanantes</p>
                              <p className="mt-1 font-medium text-gray-900">
                                {guest.plus_ones_confirmed}/{guest.plus_ones_allowed}
                              </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                              <p className="text-xs uppercase tracking-wide text-gray-500">Creado</p>
                              <p className="mt-1 font-medium text-gray-900">{formatDate(guest.created_at)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_120px]">
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Acceso digital</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">
                                  {latestToken ? 'Invitacion emitida' : 'Sin invitacion emitida'}
                                </p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                latestQrCode?.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : latestQrCode?.status === 'revoked'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {latestQrCode?.status === 'active'
                                  ? 'QR activo'
                                  : latestQrCode?.status === 'revoked'
                                  ? 'QR revocado'
                                  : latestQrCode?.status === 'inactive'
                                  ? 'QR inactivo'
                                  : 'Sin QR'}
                              </span>
                            </div>

                            <div className="mt-3 space-y-1 text-sm text-gray-600">
                              <p>
                                Token:{' '}
                                <span className="font-mono text-xs text-gray-800">
                                  {latestToken ? latestToken.token.slice(0, 18) : 'No generado'}
                                  {latestToken ? '...' : ''}
                                </span>
                              </p>
                              <p>
                                Vence:{' '}
                                {latestToken ? formatDateTime(latestToken.expires_at) : 'No disponible'}
                              </p>
                              <p>
                                Uso:{' '}
                                {latestToken?.used_at ? `Utilizado ${formatDateTime(latestToken.used_at)}` : 'Sin registrar'}
                              </p>
                              <p>
                                Invitacion:{' '}
                                {latestToken ? (
                                  <Link
                                    href={buildInvitationPath(latestToken.token, `${guest.first_name} ${guest.last_name}`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-blue-700 hover:text-blue-900"
                                  >
                                    Abrir pagina publica
                                  </Link>
                                ) : (
                                  'No disponible'
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
                            {latestQrCode?.qr_code_url ? (
                              <Image
                                src={latestQrCode.qr_code_url}
                                alt={`QR de acceso para ${guest.first_name} ${guest.last_name}`}
                                width={104}
                                height={104}
                                unoptimized
                                className="h-[104px] w-[104px] rounded-md"
                              />
                            ) : (
                              <div className="text-center text-xs text-gray-500">
                                QR pendiente
                              </div>
                            )}
                          </div>
                        </div>

                        {guest.special_requests && (
                          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                            Pedido especial: {guest.special_requests}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => issueGuestAccess(guest)}
                            disabled={guestAccessActionLoadingId === guest.id}
                            className="inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {guestAccessActionLoadingId === guest.id
                              ? 'Generando acceso...'
                              : latestToken || latestQrCode
                              ? 'Regenerar invitacion/QR'
                              : 'Emitir invitacion/QR'}
                          </button>
                          {latestToken && (
                            <>
                              <button
                                type="button"
                                onClick={() => sendGuestAccessThroughProvider(guest, latestToken, 'email')}
                                disabled={deliveryLoadingKey === `${guest.id}:email`}
                                className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deliveryLoadingKey === `${guest.id}:email` ? 'Enviando email...' : 'Enviar email'}
                              </button>
                              <button
                                type="button"
                                onClick={() => sendGuestAccessThroughProvider(guest, latestToken, 'whatsapp')}
                                disabled={deliveryLoadingKey === `${guest.id}:whatsapp`}
                                className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deliveryLoadingKey === `${guest.id}:whatsapp` ? 'Enviando WhatsApp...' : 'Enviar WhatsApp'}
                              </button>
                              <Link
                                href={buildInvitationPath(latestToken.token, `${guest.first_name} ${guest.last_name}`)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
                              >
                                Ver invitacion
                              </Link>
                              <button
                                type="button"
                                onClick={() => copyInvitationLink(guest, latestToken)}
                                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                              >
                                {copiedInvitationGuestId === guest.id ? 'Enlace copiado' : 'Copiar enlace'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openWhatsAppShare(guest, latestToken)}
                                className="inline-flex items-center rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                              >
                                Compartir WhatsApp
                              </button>
                              <button
                                type="button"
                                onClick={() => openEmailShare(guest, latestToken)}
                                className="inline-flex items-center rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
                              >
                                Compartir email
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => runQuickStatusUpdate(guest, 'confirmed')}
                            disabled={guestRowActionLoadingId === guest.id || guest.status === 'confirmed'}
                            className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => runQuickStatusUpdate(guest, 'checked_in')}
                            disabled={guestRowActionLoadingId === guest.id || guest.status === 'checked_in'}
                            className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Marcar check-in
                          </button>
                          <button
                            type="button"
                            onClick={() => runQuickStatusUpdate(guest, 'cancelled')}
                            disabled={guestRowActionLoadingId === guest.id || guest.status === 'cancelled'}
                            className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditingGuest(guest)}
                            disabled={guestRowActionLoadingId === guest.id}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Editar
                          </button>
                        </div>
                            </>
                          )
                        })()}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Crear tipo de invitado</h2>
            <p className="mt-1 text-sm text-gray-600">Define reglas simples antes de empezar a cargar personas.</p>

            <form onSubmit={handleCreateGuestType} className="mt-5 space-y-4">
              <div>
                <label htmlFor="guest-type-name" className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  id="guest-type-name"
                  name="name"
                  required
                  value={guestTypeForm.name}
                  onChange={handleGuestTypeInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Familia, VIP, Staff"
                />
              </div>

              <div>
                <label htmlFor="guest-type-description" className="block text-sm font-medium text-gray-700">
                  Descripcion
                </label>
                <textarea
                  id="guest-type-description"
                  name="description"
                  rows={3}
                  value={guestTypeForm.description}
                  onChange={handleGuestTypeInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Notas internas para el equipo"
                />
              </div>

              <div>
                <label htmlFor="guest-type-max-guests" className="block text-sm font-medium text-gray-700">
                  Cupo sugerido
                </label>
                <input
                  id="guest-type-max-guests"
                  name="max_guests"
                  type="number"
                  min="1"
                  value={guestTypeForm.max_guests}
                  onChange={handleGuestTypeInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Opcional"
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-900">Ventana de acceso</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Define desde cuando y hasta cuando puede ingresar este tipo. Si dejas ambos vacios, no se aplica restriccion horaria.
                </p>

                <div className="mt-4">
                  <label htmlFor="guest-type-access-policy-label" className="block text-sm font-medium text-gray-700">
                    Etiqueta operativa
                  </label>
                  <input
                    id="guest-type-access-policy-label"
                    name="access_policy_label"
                    value={guestTypeForm.access_policy_label}
                    onChange={handleGuestTypeInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Ej: Solo despues de la cena"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="guest-type-access-start-time" className="block text-sm font-medium text-gray-700">
                      Desde
                    </label>
                    <input
                      id="guest-type-access-start-time"
                      name="access_start_time"
                      type="time"
                      value={guestTypeForm.access_start_time}
                      onChange={handleGuestTypeInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="guest-type-access-end-time" className="block text-sm font-medium text-gray-700">
                      Hasta
                    </label>
                    <input
                      id="guest-type-access-end-time"
                      name="access_end_time"
                      type="time"
                      value={guestTypeForm.access_end_time}
                      onChange={handleGuestTypeInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="guest-type-access-start-day-offset" className="block text-sm font-medium text-gray-700">
                      Dia offset desde
                    </label>
                    <input
                      id="guest-type-access-start-day-offset"
                      name="access_start_day_offset"
                      type="number"
                      value={guestTypeForm.access_start_day_offset}
                      onChange={handleGuestTypeInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="guest-type-access-end-day-offset" className="block text-sm font-medium text-gray-700">
                      Dia offset hasta
                    </label>
                    <input
                      id="guest-type-access-end-day-offset"
                      name="access_end_day_offset"
                      type="number"
                      value={guestTypeForm.access_end_day_offset}
                      onChange={handleGuestTypeInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Ejemplo: para un QR valido despues de las 00:00, usa `Desde 00:00` y `Dia offset desde 1`.
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                <input
                  type="checkbox"
                  name="requires_invitation"
                  checked={guestTypeForm.requires_invitation}
                  onChange={handleGuestTypeInputChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-900">Requiere invitacion</span>
                  <span className="mt-1 block text-sm text-gray-600">
                    Activalo para categorias que no deberian ingresar sin validacion previa.
                  </span>
                </div>
              </label>

              {guestTypeSubmitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Error al crear tipo: {guestTypeSubmitError}
                </div>
              )}

              <button
                type="submit"
                disabled={guestTypeSubmitting}
                className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guestTypeSubmitting ? 'Guardando tipo...' : 'Guardar tipo'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Alta manual de invitado</h2>
            <p className="mt-1 text-sm text-gray-600">Carga invitados individuales con el tipo correspondiente.</p>

            <form onSubmit={handleCreateGuest} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="guest-first-name" className="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    id="guest-first-name"
                    name="first_name"
                    required
                    value={guestForm.first_name}
                    onChange={handleGuestInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Martina"
                  />
                </div>
                <div>
                  <label htmlFor="guest-last-name" className="block text-sm font-medium text-gray-700">
                    Apellido *
                  </label>
                  <input
                    id="guest-last-name"
                    name="last_name"
                    required
                    value={guestForm.last_name}
                    onChange={handleGuestInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Perez"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="guest-type-id" className="block text-sm font-medium text-gray-700">
                  Tipo de invitado *
                </label>
                <select
                  id="guest-type-id"
                  name="guest_type_id"
                  required
                  disabled={guestTypes.length === 0}
                  value={selectedGuestTypeId}
                  onChange={handleGuestInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  {guestTypes.length === 0 ? (
                    <option value="">Primero crea un tipo</option>
                  ) : (
                    guestTypes.map((guestType) => (
                      <option key={guestType.id} value={guestType.id}>
                        {guestType.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="guest-email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="guest-email"
                    name="email"
                    type="email"
                    value={guestForm.email}
                    onChange={handleGuestInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="martina@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="guest-phone" className="block text-sm font-medium text-gray-700">
                    Telefono
                  </label>
                  <input
                    id="guest-phone"
                    name="phone"
                    value={guestForm.phone}
                    onChange={handleGuestInputChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="+54 9 ..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="guest-plus-ones-allowed" className="block text-sm font-medium text-gray-700">
                  Acompanantes permitidos
                </label>
                <input
                  id="guest-plus-ones-allowed"
                  name="plus_ones_allowed"
                  type="number"
                  min="0"
                  value={guestForm.plus_ones_allowed}
                  onChange={handleGuestInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label htmlFor="guest-special-requests" className="block text-sm font-medium text-gray-700">
                  Pedido especial
                </label>
                <textarea
                  id="guest-special-requests"
                  name="special_requests"
                  rows={3}
                  value={guestForm.special_requests}
                  onChange={handleGuestInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Mesa preferida, acceso especial, alergias..."
                />
              </div>

              {guestSubmitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Error al crear invitado: {guestSubmitError}
                </div>
              )}

              <button
                type="submit"
                disabled={guestSubmitting || guestTypes.length === 0}
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guestSubmitting ? 'Guardando invitado...' : 'Crear invitado'}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  )
}

'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatGuestTypeAccessPolicy } from '@/lib/access-policy'
import { formatEventDate } from '@/lib/event-date'
import { buildActivationRequestHref } from '@/lib/event-activation'
import { mapGuestStatusToDb, type DbGuestStatus } from '@/lib/guest-schema'
import { isInvitationExpired } from '@/lib/invitation-expiry'
import {
  GUEST_DB_STATUS_LABELS,
  GUEST_DB_STATUS_STYLES,
  GUEST_PAYMENT_LABELS,
  GUEST_PAYMENT_STYLES,
  type GuestPaymentStatus,
} from '@/lib/guest-status-display'
import { isInvitationAccessReady, parseInvitationDetails } from '@/lib/invitation-response'
import { useGuestTypes, useGuests } from '@/lib/hooks'
import { buildAbsoluteAppUrl } from '@/lib/public-url'
import { toE164 } from '@/lib/phone'
import { buildInvitationWhatsAppMessage } from '@/lib/invitation-message'
import {
  buildGuestImportTemplateSheetCopyUrl,
  normalizeGuestTypeName,
  parseGuestImportRows,
  type GuestImportRow,
} from '@/lib/guest-import'
import type { BulkGuestPreview } from '@/lib/guest-bulk-merge'
import type {
  CreateGuestForm,
  CreateGuestTypeForm,
  Event,
  Guest,
  GuestType,
  GuestWithType,
  InvitationToken,
  GuestQrCode,
  InvitationDeliveryChannel,
  InvitationDeliveryTracking,
  InvitationSenderGroup,
  UpdateGuestForm,
  UpdateGuestTypeForm,
} from '@/types'

type EventGuestsManagerProps = {
  event: Pick<Event, 'id' | 'name' | 'slug' | 'max_capacity' | 'event_date' | 'confirmation_deadline' | 'start_time'>
  initialGuestTypes?: GuestType[]
  initialGuests?: GuestWithType[]
}

type GuestFormState = {
  guest_type_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  table_assignment: string
  plus_ones_allowed: string
  special_requests: string
}

type GuestTypeFormState = {
  name: string
  description: string
  access_policy_label: string
  access_start_time: string
  access_end_time: string
  access_start_day_offset: string
  access_end_day_offset: string
  payment_amount_ars: string
  show_gift_info: boolean
  invitation_message: string
}

type GuestTypeEditFormState = GuestTypeFormState

type GuestEditFormState = {
  guest_type_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  table_assignment: string
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

// Solo las transiciones manuales que aplican al estado actual: un invitado que
// ya ingreso no ofrece "Confirmar" ni "Marcar ingreso". Las acciones operan
// sobre el vocabulario de 4 estados (el que sabe escribir runQuickStatusUpdate).
type StatusAction = {
  label: string
  target: Guest['status']
}


function statusActionsFor(status: Guest['status']): StatusAction[] {
  switch (status) {
    case 'pending':
      return [
        { label: 'Confirmar a mano', target: 'confirmed' },
        { label: 'Cancelar', target: 'cancelled' },
      ]
    case 'confirmed':
      return [
        { label: 'Marcar ingreso', target: 'checked_in' },
        { label: 'Cancelar', target: 'cancelled' },
      ]
    case 'checked_in':
      return [{ label: 'Revertir ingreso', target: 'confirmed' }]
    case 'cancelled':
      return [{ label: 'Reactivar', target: 'pending' }]
    default:
      return []
  }
}

const INITIAL_GUEST_FORM: GuestFormState = {
  guest_type_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  table_assignment: '',
  plus_ones_allowed: '0',
  special_requests: '',
}

const INITIAL_GUEST_TYPE_FORM: GuestTypeFormState = {
  name: '',
  description: '',
  access_policy_label: '',
  access_start_time: '',
  access_end_time: '',
  access_start_day_offset: '0',
  access_end_day_offset: '0',
  payment_amount_ars: '0',
  show_gift_info: true,
  invitation_message: '',
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

function invitationHasGuestResponse(guest: GuestWithType) {
  return guest.status === 'confirmed' || guest.status === 'checked_in'
}

function getInvitationDeliveryLabel(
  guest: GuestWithType,
  tracking?: InvitationDeliveryTracking
) {
  if (guest.db_status === 'rejected') return 'Enviado → No asistirá'

  if (invitationHasGuestResponse(guest)) {
    const companionCount = Math.max(0, guest.plus_ones_confirmed)
    return companionCount > 0
      ? `Enviado → Confirmado + ${companionCount} acompañantes`
      : 'Enviado → Confirmado'
  }

  if (tracking?.status === 'marked_sent' || tracking?.first_opened_at) {
    return 'Enviado → Sin respuesta'
  }

  return 'Pendiente de envío'
}

// Reporte del evento: CSV con los invitados y su estado real, pago y contacto.
// Comillas dobladas y BOM para que Excel lo abra bien en UTF-8.
function buildGuestsCsv(guests: GuestWithType[]): string {
  const cell = (value: string | null | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const header = ['Nombre', 'Apellido', 'Tipo', 'Estado', 'Pago', 'Email', 'Telefono', 'Creado']
  const rows = guests.map((guest) => {
    const dbStatus = guest.db_status ?? mapGuestStatusToDb(guest.status)
    return [
      cell(guest.first_name),
      cell(guest.last_name),
      cell(guest.guest_types?.name ?? ''),
      cell(GUEST_DB_STATUS_LABELS[dbStatus]),
      cell(GUEST_PAYMENT_LABELS[guest.payment_status ?? 'not_required']),
      cell(guest.email ?? ''),
      cell(guest.phone ?? ''),
      cell(formatDate(guest.created_at)),
    ].join(',')
  })
  return [header.map(cell).join(','), ...rows].join('\r\n')
}

function pesosToCents(value: string) {
  const pesos = Number.parseInt(value.trim() || '0', 10)
  return Number.isFinite(pesos) && pesos > 0 ? pesos * 100 : 0
}

// Plantilla vacia lista para completar en Excel o Google Sheets. Los nombres
// de columna coinciden exactamente con el orden que entiende la importacion.
function buildGuestImportTemplateCsv(): string {
  return (
    ['Nombre', 'Apellido', 'Telefono', 'Email', 'Tipo', 'Invitado de', 'Acompañantes', 'DNI', 'Destino'].join(',') +
    '\r\n'
  )
}

function buildInvitationPath(token: string, guestName?: string) {
  const params = new URLSearchParams()

  // Fuerza a WhatsApp a volver a leer la metadata cuando cambia la miniatura.
  // Sin este versionado conserva en caché la previsualización anterior.
    params.set('v', '5')

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
    table_assignment: guest.table_assignment ?? '',
    status: guest.status,
    plus_ones_allowed: String(guest.plus_ones_allowed),
    plus_ones_confirmed: String(guest.plus_ones_confirmed),
    special_requests: guest.special_requests ?? '',
  }
}

export default function EventGuestsManager({
  event,
  initialGuestTypes = [],
  initialGuests = [],
}: EventGuestsManagerProps) {
  const {
    guestTypes,
    loading: guestTypesLoading,
    error: guestTypesError,
    createGuestType,
    updateGuestType,
    deleteGuestType,
  } = useGuestTypes(event.id, initialGuestTypes)
  const {
    guests,
    invitationTokens,
    guestQrCodes,
    loading: guestsLoading,
    accessLoading,
    error: guestsError,
    accessError,
    createGuest,
    previewBulkGuests,
    bulkCreateGuests,
    updateGuest,
    deleteGuest,
    createGuestAccess,
    fetchGuests,
  } = useGuests(event.id, initialGuests)
  const visibleGuestTypes = guestTypes
  const visibleGuests = guests

  const [guestForm, setGuestForm] = useState<GuestFormState>(INITIAL_GUEST_FORM)
  const [guestTypeForm, setGuestTypeForm] = useState<GuestTypeFormState>(INITIAL_GUEST_TYPE_FORM)
  // El alta de tipo vive como anexo colapsable dentro de "Tipos de invitado":
  // se usa casi solo al armar el evento, no merece un panel fijo.
  const [showGuestTypeForm, setShowGuestTypeForm] = useState(false)
  // Carga masiva: panel de importacion desde texto pegado.
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importGuestTypeId, setImportGuestTypeId] = useState('')
  const [importGuestTypeIdsBySource, setImportGuestTypeIdsBySource] = useState<Record<string, string>>({})
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  // Reimportar no debe pisar a nadie que ya fue tocado por el evento: antes
  // de escribir se arma un resumen (altas / actualizaciones seguras /
  // protegidos) y se pide confirmacion explicita. Ver lib/guest-bulk-merge.ts.
  const [importPreview, setImportPreview] = useState<BulkGuestPreview | null>(null)
  const [importPreviewBatches, setImportPreviewBatches] = useState<
    { guestTypeId: string; rows: GuestImportRow[] }[] | null
  >(null)
  const [importPreviewLoading, setImportPreviewLoading] = useState(false)
  const [guestSubmitError, setGuestSubmitError] = useState<string | null>(null)
  const [guestTypeSubmitError, setGuestTypeSubmitError] = useState<string | null>(null)
  const [guestSubmitting, setGuestSubmitting] = useState(false)
  const [guestTypeSubmitting, setGuestTypeSubmitting] = useState(false)
  const [editingGuestTypeId, setEditingGuestTypeId] = useState<string | null>(null)
  const [editGuestTypeForm, setEditGuestTypeForm] = useState<GuestTypeEditFormState | null>(null)
  const [guestTypeActionError, setGuestTypeActionError] = useState<string | null>(null)
  const [guestTypeActionNotice, setGuestTypeActionNotice] = useState<string | null>(null)
  const [guestTypeActionLoadingId, setGuestTypeActionLoadingId] = useState<string | null>(null)
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  // Lista desplegable: cada invitado arranca colapsado y se expande al tocarlo.
  const [expandedGuestIds, setExpandedGuestIds] = useState<Set<string>>(new Set())

  const parsedImportRows = useMemo(() => parseGuestImportRows(importText), [importText])
  const importSourceTypes = useMemo(
    () =>
      [...new Set(parsedImportRows.map((row) => row.source_type.trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'es-AR')
      ),
    [parsedImportRows]
  )

  const matchingGuestTypeId = (sourceType: string) => {
    const normalizedSourceType = normalizeGuestTypeName(sourceType)
    return visibleGuestTypes.find(
      (guestType) => normalizeGuestTypeName(guestType.name) === normalizedSourceType
    )?.id
  }

  const toggleGuestExpanded = (guestId: string) => {
    setExpandedGuestIds((current) => {
      if (current.has(guestId)) {
        return new Set()
      }
      return new Set([guestId])
    })
  }
  const [editGuestForm, setEditGuestForm] = useState<GuestEditFormState | null>(null)
  const [guestRowActionError, setGuestRowActionError] = useState<string | null>(null)
  // El muro de activacion no es un error: se guarda aparte para darle su propio
  // tratamiento visual y una salida concreta.
  const [activationBlocked, setActivationBlocked] = useState<string | null>(null)
  const [guestRowActionNotice, setGuestRowActionNotice] = useState<string | null>(null)
  const [guestRowActionLoadingId, setGuestRowActionLoadingId] = useState<string | null>(null)
  const [guestAccessActionLoadingId, setGuestAccessActionLoadingId] = useState<string | null>(null)
  const [copiedInvitationGuestId, setCopiedInvitationGuestId] = useState<string | null>(null)
  const [deliveryLoadingKey, setDeliveryLoadingKey] = useState<string | null>(null)
  const [invitationDeliveryGroups, setInvitationDeliveryGroups] = useState<InvitationSenderGroup[]>([])
  const [invitationDeliveryTracking, setInvitationDeliveryTracking] = useState<InvitationDeliveryTracking[]>([])
  const [invitationDeliveryAvailable, setInvitationDeliveryAvailable] = useState(false)
  const [invitationDeliveryLoading, setInvitationDeliveryLoading] = useState(true)
  const [invitationDeliveryError, setInvitationDeliveryError] = useState<string | null>(null)
  const [invitationDeliveryActionKey, setInvitationDeliveryActionKey] = useState<string | null>(null)
  const [newSenderGroupLabel, setNewSenderGroupLabel] = useState('')
  const [destinationDrafts, setDestinationDrafts] = useState<Record<string, string>>({})
  const [destinationSavingGuestId, setDestinationSavingGuestId] = useState<string | null>(null)
  const [destinationError, setDestinationError] = useState<string | null>(null)
  const [destinationNotice, setDestinationNotice] = useState<string | null>(null)
  const [destinationFilter, setDestinationFilter] = useState('')
  const [guestQuery, setGuestQuery] = useState('')
  const [guestStatusFilter, setGuestStatusFilter] = useState<'all' | Guest['status']>('all')
  const [guestTypeFilter, setGuestTypeFilter] = useState('all')
  const [senderGroupFilter, setSenderGroupFilter] = useState('all')
  const [csvGuestTypeId, setCsvGuestTypeId] = useState('all')
  const [guestPage, setGuestPage] = useState(0)
  // La lista abre completa: el organizador busca a una persona concreta, y
  // paginar de a 25 esconde a la mayoria detras de un control que no pidio.
  const [guestsPerPage, setGuestsPerPage] = useState<25 | 50 | 'all'>('all')
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set())
  const [bulkGuestTypeId, setBulkGuestTypeId] = useState('')
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [bulkIssueProgress, setBulkIssueProgress] = useState<{ done: number; total: number } | null>(null)
  // Cargar invitados y emitir sus invitaciones son dos actos distintos a
  // proposito (el muro de activacion vive en la emision), pero el segundo no
  // deberia haber que ir a buscarlo: el alta lo ofrece como cierre.
  const [showIssuePrompt, setShowIssuePrompt] = useState(false)
  const selectedGuestTypeId = guestForm.guest_type_id || visibleGuestTypes[0]?.id || ''
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

  useEffect(() => {
    let cancelled = false

    const fetchInvitationDelivery = async () => {
      setInvitationDeliveryLoading(true)
      setInvitationDeliveryError(null)

      try {
        const response = await fetch(`/api/events/${event.id}/invitation-delivery`, { cache: 'no-store' })
        const payload = (await response.json().catch(() => null)) as {
          data?: {
            available?: boolean
            groups?: InvitationSenderGroup[]
            tracking?: InvitationDeliveryTracking[]
          }
          error?: string
        } | null

        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudo cargar el seguimiento de invitaciones.')
        }

        if (!cancelled) {
          setInvitationDeliveryAvailable(payload?.data?.available === true)
          setInvitationDeliveryGroups(payload?.data?.groups ?? [])
          setInvitationDeliveryTracking(payload?.data?.tracking ?? [])
        }
      } catch (error) {
        if (!cancelled) {
          setInvitationDeliveryError(error instanceof Error ? error.message : 'No se pudo cargar el seguimiento de invitaciones.')
        }
      } finally {
        if (!cancelled) setInvitationDeliveryLoading(false)
      }
    }

    void fetchInvitationDelivery()

    return () => {
      cancelled = true
    }
  }, [event.id])

  const invitationDeliveryByTokenId = useMemo(
    () => new Map(invitationDeliveryTracking.map((tracking) => [tracking.invitation_token_id, tracking])),
    [invitationDeliveryTracking]
  )

  const invitationDeliverySummary = useMemo(() => {
    const eligibleGuests = visibleGuests.filter(
      (guest) => guest.status !== 'cancelled' && latestInvitationTokenByGuestId.has(guest.id)
    )
    const getTracking = (guest: GuestWithType) => {
      const token = latestInvitationTokenByGuestId.get(guest.id)
      return token ? invitationDeliveryByTokenId.get(token.id) : undefined
    }

    return {
      pending: eligibleGuests.filter(
        (guest) => !invitationHasGuestResponse(guest) && getTracking(guest)?.status !== 'marked_sent'
      ).length,
      markedSent: eligibleGuests.filter(
        (guest) => invitationHasGuestResponse(guest) || getTracking(guest)?.status === 'marked_sent'
      ).length,
      visited: eligibleGuests.filter(
        (guest) => invitationHasGuestResponse(guest) || Boolean(getTracking(guest)?.first_opened_at)
      ).length,
      unassigned: eligibleGuests.filter(
        (guest) => !invitationHasGuestResponse(guest) && !guest.invitation_sender_group_id
      ).length,
    }
  }, [invitationDeliveryByTokenId, latestInvitationTokenByGuestId, visibleGuests])

  const totals = useMemo(() => {
    const pending = visibleGuests.filter((guest) => guest.status === 'pending').length
    const confirmed = visibleGuests.filter((guest) => guest.status === 'confirmed' || guest.status === 'checked_in').length
    const checkedIn = visibleGuests.filter((guest) => guest.status === 'checked_in').length
    const reservedSeats = visibleGuests.length + visibleGuests.reduce((sum, guest) => sum + guest.plus_ones_confirmed, 0)

    return {
      pending,
      confirmed,
      checkedIn,
      reservedSeats,
      remainingCapacity: Math.max(event.max_capacity - reservedSeats, 0),
    }
  }, [event.max_capacity, visibleGuests])

  // El destino pertenece al titular de la invitacion: sus acompanantes viajan
  // con el grupo y cuentan para la capacidad de esa mesa/sector.
  const destinationGuests = useMemo(
    () => visibleGuests.filter((guest) => guest.status === 'confirmed' || guest.status === 'checked_in'),
    [visibleGuests]
  )

  const destinationSummary = useMemo(() => {
    const groups = new Map<string, { guests: number; people: number }>()
    let unassignedGuests = 0
    let unassignedPeople = 0

    for (const guest of destinationGuests) {
      const people = 1 + guest.plus_ones_confirmed
      const destination = guest.table_assignment?.trim()

      if (!destination) {
        unassignedGuests += 1
        unassignedPeople += people
        continue
      }

      const current = groups.get(destination) ?? { guests: 0, people: 0 }
      groups.set(destination, {
        guests: current.guests + 1,
        people: current.people + people,
      })
    }

    return {
      unassignedGuests,
      unassignedPeople,
      groups: [...groups.entries()]
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    }
  }, [destinationGuests])

  const filteredDestinationGuests = useMemo(() => {
    const query = destinationFilter.trim().toLocaleLowerCase('es-AR')
    if (!query) return destinationGuests

    return destinationGuests.filter((guest) => {
      const searchable = `${guest.first_name} ${guest.last_name} ${guest.table_assignment ?? ''}`
      return searchable.toLocaleLowerCase('es-AR').includes(query)
    })
  }, [destinationFilter, destinationGuests])

  const guestCountByGuestTypeId = useMemo(() => {
    const map = new Map<string, number>()

    for (const guest of visibleGuests) {
      map.set(guest.guest_type_id, (map.get(guest.guest_type_id) ?? 0) + 1)
    }

    return map
  }, [visibleGuests])

  const activeGuestTypesCount = useMemo(
    () => visibleGuestTypes.filter((guestType) => guestType.is_active !== false).length,
    [visibleGuestTypes]
  )

  const filteredGuests = useMemo(() => {
    const query = guestQuery.trim().toLocaleLowerCase('es-AR')

    return [...visibleGuests]
      .filter((guest) => {
        if (guestStatusFilter !== 'all' && guest.status !== guestStatusFilter) return false
        if (guestTypeFilter !== 'all' && guest.guest_type_id !== guestTypeFilter) return false
        if (senderGroupFilter === 'unassigned' && guest.invitation_sender_group_id) return false
        if (
          senderGroupFilter !== 'all' &&
          senderGroupFilter !== 'unassigned' &&
          guest.invitation_sender_group_id !== senderGroupFilter
        ) return false
        if (!query) return true

        return `${guest.first_name} ${guest.last_name} ${guest.email ?? ''} ${guest.phone ?? ''} ${guest.table_assignment ?? ''}`
          .toLocaleLowerCase('es-AR')
          .includes(query)
      })
      .sort((a, b) =>
        `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, 'es-AR')
      )
  }, [guestQuery, guestStatusFilter, guestTypeFilter, senderGroupFilter, visibleGuests])

  const guestsForCsv = useMemo(
    () =>
      csvGuestTypeId === 'all'
        ? visibleGuests
        : visibleGuests.filter((guest) => guest.guest_type_id === csvGuestTypeId),
    [csvGuestTypeId, visibleGuests]
  )

  const effectiveGuestsPerPage = guestsPerPage === 'all' ? Math.max(filteredGuests.length, 1) : guestsPerPage
  const guestPageCount = Math.max(1, Math.ceil(filteredGuests.length / effectiveGuestsPerPage))
  const currentGuestPage = Math.min(guestPage, guestPageCount - 1)
  const pagedGuests = filteredGuests.slice(
    currentGuestPage * effectiveGuestsPerPage,
    currentGuestPage * effectiveGuestsPerPage + effectiveGuestsPerPage
  )
  const selectedGuests = visibleGuests.filter((guest) => selectedGuestIds.has(guest.id))
  // Quien todavia no tiene link emitido. Un invitado cancelado no cuenta: no
  // hay nada que mandarle.
  useEffect(() => {
    const closeMenus = (domEvent: globalThis.Event) => {
      const target = domEvent.target as Node | null
      document.querySelectorAll<HTMLDetailsElement>('details[data-menu][open]').forEach((menu) => {
        if (!target || !menu.contains(target)) menu.open = false
      })
    }
    const closeOnEscape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== 'Escape') return
      document.querySelectorAll<HTMLDetailsElement>('details[data-menu][open]').forEach((menu) => {
        menu.open = false
      })
    }

    document.addEventListener('pointerdown', closeMenus)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeMenus)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const guestTypePriceById = useMemo(() => {
    const map = new Map<string, number>()
    for (const guestType of visibleGuestTypes) map.set(guestType.id, guestType.payment_amount_cents ?? 0)
    return map
  }, [visibleGuestTypes])

  const guestsWithoutInvitation = useMemo(
    () =>
      visibleGuests.filter(
        (guest) => guest.status !== 'cancelled' && !latestInvitationTokenByGuestId.has(guest.id)
      ),
    [latestInvitationTokenByGuestId, visibleGuests]
  )
  const allPageGuestsSelected = pagedGuests.length > 0 && pagedGuests.every((guest) => selectedGuestIds.has(guest.id))

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

  const handleEditGuestTypeInputChange = (
    eventInput: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = eventInput.target
    const nextValue = eventInput.target instanceof HTMLInputElement && eventInput.target.type === 'checkbox'
      ? eventInput.target.checked
      : value

    setEditGuestTypeForm((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        [name]: nextValue,
      }
    })
  }

  const handleCreateGuestType = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setGuestTypeSubmitting(true)
    setGuestTypeSubmitError(null)

    const payload: CreateGuestTypeForm = {
      event_id: event.id,
      name: guestTypeForm.name.trim(),
      description: trimOptionalValue(guestTypeForm.description),
      access_policy_label: trimOptionalValue(guestTypeForm.access_policy_label),
      access_start_time: trimOptionalValue(guestTypeForm.access_start_time),
      access_end_time: trimOptionalValue(guestTypeForm.access_end_time),
      access_start_day_offset: parseOptionalInteger(guestTypeForm.access_start_day_offset),
      access_end_day_offset: parseOptionalInteger(guestTypeForm.access_end_day_offset),
      payment_amount_cents: pesosToCents(guestTypeForm.payment_amount_ars),
      show_gift_info: guestTypeForm.show_gift_info,
      invitation_message: trimOptionalValue(guestTypeForm.invitation_message),
    }

    const result = await createGuestType(payload)

    if (result.error) {
      setGuestTypeSubmitError(result.error)
    } else {
      const createdGuestType = result.data as GuestType | undefined
      setGuestTypeForm(INITIAL_GUEST_TYPE_FORM)
      setShowGuestTypeForm(false)

      if (createdGuestType) {
        setGuestForm((current) => ({
          ...current,
          guest_type_id: createdGuestType.id,
        }))
      }
    }

    setGuestTypeSubmitting(false)
  }

  const createGuestTypeEditForm = (guestType: GuestType): GuestTypeEditFormState => ({
    name: guestType.name,
    description: guestType.description ?? '',
    access_policy_label: guestType.access_policy_label ?? '',
    access_start_time: guestType.access_start_time ?? '',
    access_end_time: guestType.access_end_time ?? '',
    access_start_day_offset: String(guestType.access_start_day_offset ?? 0),
    access_end_day_offset: String(guestType.access_end_day_offset ?? 0),
    payment_amount_ars: String((guestType.payment_amount_cents ?? 0) / 100),
    show_gift_info: guestType.show_gift_info ?? true,
    invitation_message: guestType.invitation_message ?? '',
  })

  const startEditingGuestType = (guestType: GuestType) => {
    setEditingGuestTypeId(guestType.id)
    setEditGuestTypeForm(createGuestTypeEditForm(guestType))
    setGuestTypeActionError(null)
    setGuestTypeActionNotice(null)
  }

  const cancelEditingGuestType = () => {
    setEditingGuestTypeId(null)
    setEditGuestTypeForm(null)
    setGuestTypeActionError(null)
    setGuestTypeActionNotice(null)
  }

  const saveGuestTypeUpdates = async (guestTypeId: string) => {
    if (!editGuestTypeForm) {
      return
    }

    setGuestTypeActionLoadingId(guestTypeId)
    setGuestTypeActionError(null)
    setGuestTypeActionNotice(null)

    const payload: UpdateGuestTypeForm = {
      name: editGuestTypeForm.name.trim(),
      description: trimOptionalValue(editGuestTypeForm.description),
      access_policy_label: trimOptionalValue(editGuestTypeForm.access_policy_label),
      access_start_time: trimOptionalValue(editGuestTypeForm.access_start_time),
      access_end_time: trimOptionalValue(editGuestTypeForm.access_end_time),
      access_start_day_offset: parseOptionalInteger(editGuestTypeForm.access_start_day_offset),
      access_end_day_offset: parseOptionalInteger(editGuestTypeForm.access_end_day_offset),
      payment_amount_cents: pesosToCents(editGuestTypeForm.payment_amount_ars),
      show_gift_info: editGuestTypeForm.show_gift_info,
      invitation_message: trimOptionalValue(editGuestTypeForm.invitation_message),
    }

    const result = await updateGuestType(guestTypeId, payload)

    if (result.error) {
      setGuestTypeActionError(result.error)
    } else {
      setEditingGuestTypeId(null)
      setEditGuestTypeForm(null)
      setGuestTypeActionNotice('Tipo de invitado actualizado correctamente.')
    }

    setGuestTypeActionLoadingId(null)
  }

  const toggleGuestTypeActiveState = async (guestType: GuestType, nextActive: boolean) => {
    setGuestTypeActionLoadingId(guestType.id)
    setGuestTypeActionError(null)
    setGuestTypeActionNotice(null)

    const result = await updateGuestType(guestType.id, { is_active: nextActive })

    if (result.error) {
      setGuestTypeActionError(result.error)
    } else {
      setGuestTypeActionNotice(
        nextActive
          ? `Tipo ${guestType.name} reactivado.`
          : `Tipo ${guestType.name} desactivado.`
      )
    }

    setGuestTypeActionLoadingId(null)
  }

  const removeGuestType = async (guestType: GuestType) => {
    setGuestTypeActionLoadingId(guestType.id)
    setGuestTypeActionError(null)
    setGuestTypeActionNotice(null)

    const result = await deleteGuestType(guestType.id)

    if (result.error) {
      setGuestTypeActionError(result.error)
    } else {
      setGuestTypeActionNotice(`Tipo ${guestType.name} borrado correctamente.`)
    }

    setGuestTypeActionLoadingId(null)
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
      table_assignment: trimOptionalValue(guestForm.table_assignment),
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
      setShowIssuePrompt(true)
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
      table_assignment: trimOptionalValue(editGuestForm.table_assignment),
      status: editGuestForm.status,
      plus_ones_allowed: Number.parseInt(editGuestForm.plus_ones_allowed || '0', 10),
      plus_ones_confirmed: Number.parseInt(editGuestForm.plus_ones_confirmed || '0', 10),
      special_requests: trimOptionalValue(editGuestForm.special_requests),
    }

    const result = await updateGuest(guestId, payload)

    if (result.error) {
      setGuestRowActionError(result.error)
    } else {
      setEditingGuestId(null)
      setEditGuestForm(null)
      setGuestRowActionNotice('Datos del invitado actualizados correctamente.')
    }

    setGuestRowActionLoadingId(null)
  }

  const runQuickStatusUpdate = async (guest: GuestWithType, status: Guest['status']) => {
    setGuestRowActionLoadingId(guest.id)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    const payload: UpdateGuestForm = { status }

    if (status === 'confirmed' && guest.status === 'checked_in') {
      payload.restore_invitation_access = true
    }

    if (status === 'checked_in' && guest.status === 'pending') {
      payload.plus_ones_confirmed = guest.plus_ones_allowed
    }

    const result = await updateGuest(guest.id, payload)

    if (result.error) {
      setGuestRowActionError(result.error)
    }

    setGuestRowActionLoadingId(null)
  }

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuestIds((current) => {
      const next = new Set(current)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  const togglePageSelection = () => {
    setSelectedGuestIds((current) => {
      const next = new Set(current)
      const shouldSelect = !pagedGuests.every((guest) => next.has(guest.id))
      for (const guest of pagedGuests) {
        if (shouldSelect) next.add(guest.id)
        else next.delete(guest.id)
      }
      return next
    })
  }

  // La seleccion masiva no confirma: confirmar es un acto del invitado, no del
  // organizador. Lo que se hace en lote es emitir los links de invitacion.
  const issueAccessForGuests = async (guests: GuestWithType[]) => {
    if (guests.length === 0) return

    setBulkActionLoading(true)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)
    setActivationBlocked(null)
    setBulkIssueProgress({ done: 0, total: guests.length })

    let issued = 0
    let failed = 0
    let blocked: string | null = null

    // De a tandas: cada invitacion escribe token y QR. Si aparece el muro de
    // activacion se corta ahi, porque ninguna de las siguientes va a poder
    // emitirse tampoco.
    const BATCH_SIZE = 5

    for (let index = 0; index < guests.length; index += BATCH_SIZE) {
      const batch = guests.slice(index, index + BATCH_SIZE)
      const results = await Promise.all(
        batch.map((guest) =>
          createGuestAccess(guest, {
            eventSlug: event.slug,
            eventDate: event.event_date,
            eventStartTime: event.start_time,
          })
        )
      )

      for (const result of results) {
        if (result.activationBlocked) blocked = result.activationBlocked
        else if (result.error) failed += 1
        else issued += 1
      }

      setBulkIssueProgress({ done: Math.min(index + BATCH_SIZE, guests.length), total: guests.length })
      if (blocked) break
    }

    if (blocked) {
      setActivationBlocked(blocked)
    } else if (failed > 0) {
      setGuestRowActionError(
        `Se generaron ${issued} invitaciones y ${failed} no pudieron emitirse. Volvé a intentar con las que quedaron sin link.`
      )
    } else {
      setGuestRowActionNotice(
        `${issued} ${issued === 1 ? 'invitación generada' : 'invitaciones generadas'}. Ya podés enviarlas desde cada invitado.`
      )
      setSelectedGuestIds(new Set())
      setShowIssuePrompt(false)
    }

    setBulkIssueProgress(null)
    setBulkActionLoading(false)
  }

  const runBulkIssueAccess = () => issueAccessForGuests(selectedGuests)

  const runBulkCancel = async () => {
    if (selectedGuests.length === 0) return

    setBulkActionLoading(true)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    const results = await Promise.all(
      selectedGuests.map((guest) => updateGuest(guest.id, { status: 'cancelled' }))
    )
    const failed = results.filter((result) => result.error)

    if (failed.length > 0) {
      setGuestRowActionError(`No se pudieron actualizar ${failed.length} de ${selectedGuests.length} invitados.`)
    } else {
      setGuestRowActionNotice(`${selectedGuests.length} invitados quedaron cancelados.`)
      setSelectedGuestIds(new Set())
    }

    setBulkActionLoading(false)
  }

  const runBulkGuestTypeUpdate = async () => {
    if (!bulkGuestTypeId || selectedGuests.length === 0) return

    setBulkActionLoading(true)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    const results = await Promise.all(
      selectedGuests.map((guest) => updateGuest(guest.id, { guest_type_id: bulkGuestTypeId }))
    )
    const failed = results.filter((result) => result.error)

    if (failed.length > 0) {
      setGuestRowActionError(`No se pudieron cambiar ${failed.length} de ${selectedGuests.length} tipos.`)
    } else {
      const guestTypeName = visibleGuestTypes.find((guestType) => guestType.id === bulkGuestTypeId)?.name ?? 'seleccionado'
      setGuestRowActionNotice(`${selectedGuests.length} invitados pasaron al tipo ${guestTypeName}.`)
      setSelectedGuestIds(new Set())
      setBulkGuestTypeId('')
    }

    setBulkActionLoading(false)
  }

  // Conciliacion de pagos: el admin marca el aporte como sin cobro / pendiente /
  // confirmado. Confirmarlo destraba la emision del acceso (isInvitationAccessReady).
  const runPaymentUpdate = async (guest: GuestWithType, paymentStatus: GuestPaymentStatus) => {
    setGuestRowActionLoadingId(guest.id)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    const result = await updateGuest(guest.id, { payment_status: paymentStatus })

    if (result.error) {
      setGuestRowActionError(result.error)
    } else {
      setGuestRowActionNotice(
        `Pago de ${guest.first_name} ${guest.last_name}: ${GUEST_PAYMENT_LABELS[paymentStatus].toLowerCase()}.`
      )
    }

    setGuestRowActionLoadingId(null)
  }

  const downloadGuestsCsv = () => {
    // BOM (﻿) al inicio para que Excel abra el CSV como UTF-8 y no rompa acentos.
    const blob = new Blob(['﻿' + buildGuestsCsv(guestsForCsv)], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    const guestType = visibleGuestTypes.find((item) => item.id === csvGuestTypeId)
    const typeSuffix = guestType ? `-${guestType.name.toLocaleLowerCase('es-AR').replace(/[^a-z0-9]+/g, '-')}` : ''
    anchor.download = `invitados-${event.slug}${typeSuffix}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const downloadGuestImportTemplate = () => {
    const blob = new Blob(['ï»¿' + buildGuestImportTemplateCsv()], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'plantilla-carga-invitados.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (file?: File) => {
    if (!file) return

    setImportError(null)
    setImportPreview(null)
    setImportPreviewBatches(null)
    try {
      const bytes = await file.arrayBuffer()
      const utf8 = new TextDecoder('utf-8').decode(bytes)
      // Muchas listas exportadas por Excel en Windows usan ANSI/Windows-1252.
      // Si UTF-8 deja caracteres de reemplazo o mojibake, leemos esa variante.
      const text = /\uFFFD|\u00C3/.test(utf8) ? new TextDecoder('windows-1252').decode(bytes) : utf8
      setImportText(text)
    } catch {
      setImportError('No se pudo leer el archivo. Probá exportarlo como CSV UTF-8 o pegá su contenido.')
    }
  }

  const buildImportBatches = (): { batches: { guestTypeId: string; rows: GuestImportRow[] }[] } | null => {
    const rows = parsedImportRows
    const guestTypeId = importGuestTypeId || visibleGuestTypes[0]?.id

    if (!guestTypeId) {
      setImportError('Primero crea un tipo de invitado para asignar el lote.')
      return null
    }
    if (rows.length === 0) {
      setImportError('No se detectaron invitados. Poné al menos un nombre por linea.')
      return null
    }

    const guestTypeIdForRow = (row: GuestImportRow) => {
      if (!row.source_type.trim()) return guestTypeId
      return importGuestTypeIdsBySource[row.source_type] || matchingGuestTypeId(row.source_type) || ''
    }
    const unmappedTypes = [
      ...new Set(rows.filter((row) => !guestTypeIdForRow(row)).map((row) => row.source_type)),
    ]

    if (unmappedTypes.length > 0) {
      setImportError(`Asigná un tipo de invitado para: ${unmappedTypes.join(', ')}.`)
      return null
    }

    const batchesByType = new Map<string, GuestImportRow[]>()
    for (const row of rows) {
      const typeId = guestTypeIdForRow(row)
      const batch = batchesByType.get(typeId) ?? []
      batch.push(row)
      batchesByType.set(typeId, batch)
    }

    return {
      batches: [...batchesByType.entries()].map(([guestTypeId, rows]) => ({ guestTypeId, rows })),
    }
  }

  // Paso 1: nunca se escribe directo. Se arma un resumen por lote (altas,
  // actualizaciones seguras, protegidos) para que la persona confirme antes
  // de que se toque la base — reimportar una lista vieja no debe sorprender
  // pisando a alguien que ya pago o ya respondio.
  const handlePreviewImport = async () => {
    setImportError(null)
    setImportPreview(null)
    setImportPreviewBatches(null)

    const built = buildImportBatches()
    if (!built) return

    setImportPreviewLoading(true)
    const previews: BulkGuestPreview[] = []
    let previewFailure: string | undefined

    for (const batch of built.batches) {
      const result = await previewBulkGuests(batch.guestTypeId, batch.rows)
      if (result.error) {
        previewFailure = result.error
        break
      }
      if (result.data) previews.push(result.data)
    }

    setImportPreviewLoading(false)

    if (previewFailure) {
      setImportError(previewFailure)
      return
    }

    const combined = previews.reduce<BulkGuestPreview>(
      (total, preview) => ({
        newCount: total.newCount + preview.newCount,
        updateCount: total.updateCount + preview.updateCount,
        protectedCount: total.protectedCount + preview.protectedCount,
        missingCount: total.missingCount + preview.missingCount,
        protectedSample: [...total.protectedSample, ...preview.protectedSample].slice(0, 20),
        missingSample: [...total.missingSample, ...preview.missingSample].slice(0, 20),
      }),
      { newCount: 0, updateCount: 0, protectedCount: 0, missingCount: 0, protectedSample: [], missingSample: [] }
    )

    setImportPreview(combined)
    setImportPreviewBatches(built.batches)
  }

  const handleCancelImportPreview = () => {
    setImportPreview(null)
    setImportPreviewBatches(null)
    setImportError(null)
  }

  // Paso 2: recien acá se escribe, y con exactamente lo que se mostró en el
  // resumen (los mismos lotes armados en el preview, no se vuelven a leer del
  // texto por si la persona lo edito mientras miraba el resumen).
  const handleConfirmImport = async () => {
    if (!importPreviewBatches) return

    setImportError(null)
    setImportLoading(true)
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let importFailure: string | undefined

    for (const batch of importPreviewBatches) {
      const result = await bulkCreateGuests(batch.guestTypeId, batch.rows)
      if (result.error) {
        importFailure = result.error
        break
      }
      createdCount += result.data?.created ?? 0
      updatedCount += result.data?.updated ?? 0
      skippedCount += result.data?.skippedProtected ?? 0
    }

    setImportLoading(false)

    if (importFailure) {
      setImportError(
        createdCount + updatedCount > 0
          ? `${importFailure} Ya se procesaron ${createdCount + updatedCount} invitados de los lotes anteriores.`
          : importFailure
      )
      return
    }

    setImportText('')
    setImportGuestTypeIdsBySource({})
    setImportPreview(null)
    setImportPreviewBatches(null)
    setShowImport(false)
    setGuestRowActionError(null)
    const skippedNote = skippedCount > 0 ? ` ${skippedCount} ya estaban invitados o pagados y no se tocaron.` : ''
    setGuestRowActionNotice(
      `Se importaron ${createdCount} invitados nuevos y se actualizaron ${updatedCount}.${skippedNote}`
    )
    setShowIssuePrompt(true)
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

    if (result.activationBlocked) {
      // El muro tiene su propio cartel: no se rompio nada, falta activar.
      setActivationBlocked(result.activationBlocked)
    } else if (result.error) {
      setGuestRowActionError(result.error)
    } else {
      setGuestRowActionNotice(
        result.data?.qrCode
          ? `Acceso final emitido para ${guest.first_name} ${guest.last_name}. Ya puedes abrir la invitacion o enviarla por email/WhatsApp.`
          : `Link de gestion emitido para ${guest.first_name} ${guest.last_name}. El QR final se habilitara cuando el acceso quede listo.`
      )
    }

    setGuestAccessActionLoadingId(null)
  }

  const removeGuest = async (guest: GuestWithType) => {
    setGuestRowActionLoadingId(guest.id)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    const result = await deleteGuest(guest.id)

    if (result.error) {
      setGuestRowActionError(result.error)
    } else {
      setGuestRowActionNotice(`Invitado ${guest.first_name} ${guest.last_name} borrado correctamente.`)
    }

    setGuestRowActionLoadingId(null)
  }

  const buildAbsoluteInvitationUrl = (token: string, guestName?: string) => {
    const invitationPath = buildInvitationPath(token, guestName)
    return buildAbsoluteAppUrl(invitationPath)
  }

  const buildShareMessage = (guest: GuestWithType, token: InvitationToken) => {
    const guestName = `${guest.first_name} ${guest.last_name}`.trim()
    const invitationUrl = buildAbsoluteInvitationUrl(token.token)
    const confirmationDeadline = event.confirmation_deadline
      ? formatEventDate(event.confirmation_deadline, { dateStyle: 'long' })
      : formatDateTime(token.expires_at)

    return {
      invitationUrl,
      whatsappText: buildInvitationWhatsAppMessage({
        guestFirstName: guest.first_name,
        eventName: event.name,
        invitationUrl,
        confirmationDeadline,
      }),
      emailSubject: `Tu acceso para ${event.name}`,
      emailBody: `Hola ${guestName},\n\nTe compartimos tu acceso para ${event.name}.\n\nAbrir Invitación:\n${invitationUrl}\n\nFecha límite para confirmar: ${confirmationDeadline}\nVigencia del acceso: ${formatDateTime(token.expires_at)}\n`,
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
      const invitationUrl = buildAbsoluteInvitationUrl(token.token)
      const response = await fetch('/api/guest-access/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: guest.event_id,
          guestId: guest.id,
          invitationTokenId: token.id,
          channel,
          recipient,
          guestName,
          guestFirstName: guest.first_name,
          eventName: event.name,
          invitationUrl,
          expiresAt: token.expires_at,
          confirmationDeadline: event.confirmation_deadline,
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
    // Si el invitado tiene telefono, abrimos el chat directo (wa.me/<numero>);
    // si no, abrimos WhatsApp con el mensaje y se elige el contacto a mano.
    const phone = guest.phone?.trim()
    const waNumber = phone ? toE164(phone).replace(/\D/g, '') : ''
    const base = waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/'
    window.open(`${base}?text=${encodeURIComponent(whatsappText)}`, '_blank', 'noopener,noreferrer')
  }

  const openEmailShare = (guest: GuestWithType, token: InvitationToken) => {
    const { emailSubject, emailBody } = buildShareMessage(guest, token)
    window.location.href = `mailto:${guest.email ?? ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
  }

  const updateInvitationDelivery = async (
    guest: GuestWithType,
    token: InvitationToken,
    channel: InvitationDeliveryChannel,
    action: 'mark_sent' | 'unmark_sent'
  ) => {
    if (!invitationDeliveryAvailable) return

    const actionKey = `${guest.id}:${channel}`
    setInvitationDeliveryActionKey(actionKey)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    try {
      const response = await fetch(`/api/events/${event.id}/invitation-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          guestId: guest.id,
          invitationTokenId: token.id,
          channel,
          senderGroupId: guest.invitation_sender_group_id ?? null,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        data?: InvitationDeliveryTracking
        error?: string
      } | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'No se pudo actualizar el seguimiento.')
      }

      setInvitationDeliveryTracking((current) => [
        payload.data as InvitationDeliveryTracking,
        ...current.filter((item) => item.invitation_token_id !== token.id),
      ])
      setGuestRowActionNotice(
        action === 'mark_sent'
          ? `Invitación de ${guest.first_name} ${guest.last_name} marcada como enviada.`
          : `Invitación de ${guest.first_name} ${guest.last_name} volvió a quedar pendiente.`
      )
    } catch (error) {
      setGuestRowActionError(error instanceof Error ? error.message : 'No se pudo actualizar el seguimiento.')
    } finally {
      setInvitationDeliveryActionKey(null)
    }
  }

  const openWhatsAppAndConfirmDelivery = (guest: GuestWithType, token: InvitationToken) => {
    openWhatsAppShare(guest, token)

    if (!invitationDeliveryAvailable) return

    window.setTimeout(() => {
      const wasSent = window.confirm(
        `¿Enviaste la invitación de ${guest.first_name} ${guest.last_name} por WhatsApp?`
      )
      if (wasSent) void updateInvitationDelivery(guest, token, 'whatsapp', 'mark_sent')
    }, 700)
  }

  const createSenderGroup = async () => {
    const label = newSenderGroupLabel.trim()
    if (!label || !invitationDeliveryAvailable) return

    setInvitationDeliveryActionKey('create-group')
    setInvitationDeliveryError(null)

    try {
      const response = await fetch(`/api/events/${event.id}/invitation-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_group', label }),
      })
      const payload = (await response.json().catch(() => null)) as {
        data?: InvitationSenderGroup
        error?: string
      } | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'No se pudo crear el grupo de envio.')
      }

      setInvitationDeliveryGroups((current) => [...current, payload.data as InvitationSenderGroup])
      setNewSenderGroupLabel('')
    } catch (error) {
      setInvitationDeliveryError(error instanceof Error ? error.message : 'No se pudo crear el grupo de envio.')
    } finally {
      setInvitationDeliveryActionKey(null)
    }
  }

  const assignSenderGroup = async (guest: GuestWithType, senderGroupId: string | null) => {
    if (!invitationDeliveryAvailable) return

    setInvitationDeliveryActionKey(`${guest.id}:group`)
    setGuestRowActionError(null)
    setGuestRowActionNotice(null)

    try {
      const response = await fetch(`/api/events/${event.id}/invitation-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_group', guestId: guest.id, senderGroupId }),
      })
      const payload = (await response.json().catch(() => null)) as {
        data?: { id: string; invitation_sender_group_id: string | null }
        error?: string
      } | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error || 'No se pudo asignar el grupo de envio.')
      }

      await fetchGuests(event.id)
    } catch (error) {
      setGuestRowActionError(error instanceof Error ? error.message : 'No se pudo asignar el grupo de envio.')
    } finally {
      setInvitationDeliveryActionKey(null)
    }
  }

  const saveGuestDestination = async (guest: GuestWithType) => {
    const destination = (destinationDrafts[guest.id] ?? guest.table_assignment ?? '').trim()
    setDestinationSavingGuestId(guest.id)
    setDestinationError(null)
    setDestinationNotice(null)

    const result = await updateGuest(guest.id, {
      table_assignment: destination || null,
    })

    if (result.error) {
      setDestinationError(result.error)
    } else {
      setDestinationDrafts((current) => ({ ...current, [guest.id]: destination }))
      setDestinationNotice(
        destination
          ? `${guest.first_name} ${guest.last_name} fue asignado a ${destination}.`
          : `Se quitó el destino de ${guest.first_name} ${guest.last_name}.`
      )
    }

    setDestinationSavingGuestId(null)
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
            {formatEventDate(event.event_date)} · {event.start_time} · slug <span className="font-mono text-sm">{event.slug}</span>
          </p>
        </div>

      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Invitados cargados</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{visibleGuests.length}</p>
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

      <section aria-labelledby="invitation-delivery-heading" className="mb-8 rounded-xl border border-sky-100 bg-sky-50/60 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 id="invitation-delivery-heading" className="text-lg font-semibold text-sky-950">Seguimiento de envíos</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-sky-900/75">
              Una invitación generada todavía no significa que haya sido enviada. Mamá y Alfonsina pueden compartir esta lista y marcar cada envío.
            </p>
          </div>
          {invitationDeliveryAvailable && (
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-xl font-semibold text-amber-700">{invitationDeliverySummary.pending}</p>
                <p className="text-[11px] text-gray-500">pendientes</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-xl font-semibold text-indigo-700">{invitationDeliverySummary.markedSent}</p>
                <p className="text-[11px] text-gray-500">envíos resueltos</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-xl font-semibold text-emerald-700">{invitationDeliverySummary.visited}</p>
                <p className="text-[11px] text-gray-500">visitadas</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-xl font-semibold text-slate-700">{invitationDeliverySummary.unassigned}</p>
                <p className="text-[11px] text-gray-500">sin asignar</p>
              </div>
            </div>
          )}
        </div>

        {invitationDeliveryLoading ? (
          <p className="mt-4 text-sm text-sky-900/70">Cargando seguimiento...</p>
        ) : invitationDeliveryError ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{invitationDeliveryError}</p>
        ) : !invitationDeliveryAvailable ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            El seguimiento queda pendiente de aplicar la migración de base. La gestión de invitados y el evento siguen funcionando normalmente.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-3 border-t border-sky-200/70 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/65">Grupos de envío</p>
              <p className="mt-1 text-xs text-sky-900/70">Organizá quién se ocupa de cada contacto sin crear usuarios nuevos.</p>
            </div>
            <div className="flex w-full gap-2 sm:max-w-sm">
              <input
                value={newSenderGroupLabel}
                onChange={(eventInput) => setNewSenderGroupLabel(eventInput.target.value)}
                onKeyDown={(eventInput) => {
                  if (eventInput.key === 'Enter') {
                    eventInput.preventDefault()
                    void createSenderGroup()
                  }
                }}
                placeholder="Ej.: Mamá, la quinceañera o familia"
                maxLength={80}
                className="min-w-0 flex-1 rounded-md border border-sky-200 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                aria-label="Nombre del nuevo grupo de envío"
              />
              <button
                type="button"
                onClick={() => void createSenderGroup()}
                disabled={!newSenderGroupLabel.trim() || invitationDeliveryActionKey === 'create-group'}
                className="rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {invitationDeliveryActionKey === 'create-group' ? 'Guardando...' : 'Agregar grupo'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="destinations-heading" className="hidden">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 id="destinations-heading" className="text-lg font-semibold text-gray-900">Mesas y destinos</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Organizá sólo a quienes confirmaron. El destino se aplica al titular y a sus acompañantes, y aparecerá en el Tótem al ingresar.
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-sm font-medium text-sky-800 shadow-sm">
            {destinationGuests.length} grupos confirmados
          </div>
        </div>

        {destinationError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{destinationError}</p>
        )}
        {destinationNotice && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{destinationNotice}</p>
        )}

        {destinationGuests.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-sky-200 bg-white/70 p-5 text-sm text-gray-600">
            Cuando haya invitados confirmados, aparecerán acá para distribuirlos por mesa o sector.
          </div>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
            <div className="rounded-xl border border-sky-100 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Asignar confirmados</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {destinationSummary.unassignedGuests} sin destino · {destinationSummary.unassignedPeople} personas por ubicar
                  </p>
                </div>
                <input
                  value={destinationFilter}
                  onChange={(eventInput) => setDestinationFilter(eventInput.target.value)}
                  placeholder="Buscar invitado o destino"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-56"
                  aria-label="Buscar invitados para asignar destino"
                />
              </div>

              <div className="mt-4 max-h-112 space-y-2 overflow-y-auto pr-1">
                {filteredDestinationGuests.map((guest) => {
                  const people = 1 + guest.plus_ones_confirmed
                  const currentDestination = destinationDrafts[guest.id] ?? guest.table_assignment ?? ''
                  const saving = destinationSavingGuestId === guest.id

                  return (
                    <div key={guest.id} className="flex flex-col gap-3 rounded-lg border border-gray-100 p-3 lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{guest.first_name} {guest.last_name}</p>
                        <p className="text-sm text-gray-500">
                          {people} {people === 1 ? 'persona' : 'personas'}{guest.plus_ones_confirmed > 0 ? ' · grupo con acompañantes' : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 lg:w-80">
                        <input
                          value={currentDestination}
                          onChange={(eventInput) => setDestinationDrafts((current) => ({
                            ...current,
                            [guest.id]: eventInput.target.value,
                          }))}
                          onKeyDown={(eventInput) => {
                            if (eventInput.key === 'Enter') {
                              eventInput.preventDefault()
                              void saveGuestDestination(guest)
                            }
                          }}
                          placeholder="Mesa 4, VIP, Sector A..."
                          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                          aria-label={`Destino para ${guest.first_name} ${guest.last_name}`}
                        />
                        <button
                          type="button"
                          onClick={() => void saveGuestDestination(guest)}
                          disabled={saving}
                          className="rounded-md bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
                {filteredDestinationGuests.length === 0 && (
                  <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No hay confirmados que coincidan con la búsqueda.</p>
                )}
              </div>
            </div>

            <aside className="rounded-xl border border-sky-100 bg-white p-4">
              <h3 className="font-medium text-gray-900">Resumen por destino</h3>
              <p className="mt-1 text-sm text-gray-600">Personas, incluyendo acompañantes confirmados.</p>
              <div className="mt-4 space-y-2">
                {destinationSummary.groups.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">Todavía no hay destinos asignados.</p>
                ) : (
                  destinationSummary.groups.map((destination) => (
                    <div key={destination.name} className="flex items-center justify-between gap-3 rounded-lg bg-sky-50 px-3 py-2">
                      <p className="min-w-0 truncate font-medium text-sky-950">{destination.name}</p>
                      <p className="whitespace-nowrap text-sm text-sky-800">
                        {destination.people} {destination.people === 1 ? 'persona' : 'personas'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <section className="space-y-6">
          <div id="guest-types" className="hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tipos de invitado</h2>
                <p className="mt-1 text-sm text-gray-600">Primero define las categorias que luego podras asignar. Luego podras reutilizar esta logica en plantillas de evento.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex-none whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  {activeGuestTypesCount} activos
                </span>
                <button
                  type="button"
                  onClick={() => setShowGuestTypeForm((current) => !current)}
                  aria-expanded={showGuestTypeForm}
                  className="inline-flex flex-none items-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {showGuestTypeForm ? 'Cerrar' : '+ Nuevo tipo'}
                </button>
              </div>
            </div>

            {guestTypesError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Error al cargar tipos: {guestTypesError}
              </div>
            )}

            {guestTypeActionError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {guestTypeActionError}
              </div>
            )}

            {guestTypeActionNotice && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {guestTypeActionNotice}
              </div>
            )}

            {guestTypesLoading ? (
              <div className="mt-4 flex h-32 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : visibleGuestTypes.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                Todavia no hay tipos creados. Crea al menos uno para habilitar el alta manual de invitados.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {visibleGuestTypes.map((guestType) => (
                  <div key={guestType.id} className="rounded-lg border border-gray-200 p-4">
                    {editingGuestTypeId === guestType.id && editGuestTypeForm ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-medium text-gray-900">Editando tipo</h3>
                            <p className="mt-1 text-sm text-gray-600">{guestType.name}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              guestType.is_active === false
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {guestType.is_active === false ? 'Inactivo' : 'Activo'}
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input
                              name="name"
                              value={editGuestTypeForm.name}
                              onChange={handleEditGuestTypeInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Etiqueta de acceso</label>
                            <input
                              name="access_policy_label"
                              value={editGuestTypeForm.access_policy_label}
                              onChange={handleEditGuestTypeInputChange}
                              placeholder="Ej: Despues de las 00:00"
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Importe por invitado (ARS)</label>
                            <input
                              name="payment_amount_ars"
                              type="number"
                              min="0"
                              step="1"
                              value={editGuestTypeForm.payment_amount_ars}
                              onChange={handleEditGuestTypeInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            {Number(editGuestTypeForm.payment_amount_ars) > 0 && (
                              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  name="show_gift_info"
                                  type="checkbox"
                                  checked={editGuestTypeForm.show_gift_info}
                                  onChange={handleEditGuestTypeInputChange}
                                  className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Mostrar el campo de regalo en la invitación</span>
                              </label>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Hora desde</label>
                            <input
                              name="access_start_time"
                              type="time"
                              value={editGuestTypeForm.access_start_time}
                              onChange={handleEditGuestTypeInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Hora hasta</label>
                            <input
                              name="access_end_time"
                              type="time"
                              value={editGuestTypeForm.access_end_time}
                              onChange={handleEditGuestTypeInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Offset inicio</label>
                            <input
                              name="access_start_day_offset"
                              type="number"
                              value={editGuestTypeForm.access_start_day_offset}
                              onChange={handleEditGuestTypeInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Offset fin</label>
                            <input
                              name="access_end_day_offset"
                              type="number"
                              value={editGuestTypeForm.access_end_day_offset}
                              onChange={handleEditGuestTypeInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Descripcion</label>
                          <textarea
                            name="description"
                            rows={3}
                            value={editGuestTypeForm.description}
                            onChange={handleEditGuestTypeInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Leyenda en la invitacion</label>
                          <textarea
                            name="invitation_message"
                            rows={2}
                            maxLength={160}
                            value={editGuestTypeForm.invitation_message}
                            onChange={handleEditGuestTypeInputChange}
                            placeholder="Ej: Estas invitado/a al trasnoche"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <p className="mt-1 text-xs text-gray-500">Se muestra una sola vez en la invitacion de este tipo.</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => saveGuestTypeUpdates(guestType.id)}
                            disabled={guestTypeActionLoadingId === guestType.id}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {guestTypeActionLoadingId === guestType.id ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingGuestType}
                            disabled={guestTypeActionLoadingId === guestType.id}
                            className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-gray-900">{guestType.name}</h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  guestType.is_active === false
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {guestType.is_active === false ? 'Inactivo' : 'Activo'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {guestCountByGuestTypeId.get(guestType.id) ?? 0} invitados
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm text-gray-500">
                              {guestType.description?.trim() ? `${guestType.description.trim()} · ` : ''}
                              {formatGuestTypeAccessPolicy(guestType, event.start_time)}
                            </p>
                          </div>

                          {/* Menu de tres puntos: editar / desactivar / borrar sin ocupar la fila. */}
                          <details className="relative flex-none">
                            <summary className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 [&::-webkit-details-marker]:hidden">
                              <span className="text-lg leading-none" aria-hidden="true">⋮</span>
                              <span className="sr-only">Acciones de {guestType.name}</span>
                            </summary>
                            <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => startEditingGuestType(guestType)}
                                disabled={guestTypeActionLoadingId === guestType.id}
                                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleGuestTypeActiveState(guestType, guestType.is_active === false)
                                }
                                disabled={guestTypeActionLoadingId === guestType.id}
                                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {guestTypeActionLoadingId === guestType.id
                                  ? 'Guardando...'
                                  : guestType.is_active === false
                                  ? 'Reactivar'
                                  : 'Desactivar'}
                              </button>
                              <div className="my-1 border-t border-gray-100" />
                              <button
                                type="button"
                                onClick={() => removeGuestType(guestType)}
                                disabled={
                                  guestTypeActionLoadingId === guestType.id ||
                                  (guestCountByGuestTypeId.get(guestType.id) ?? 0) > 0
                                }
                                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-gray-300"
                              >
                                Borrar
                              </button>
                              {(guestCountByGuestTypeId.get(guestType.id) ?? 0) > 0 && (
                                <p className="px-3 pb-2 pt-1 text-xs text-gray-400">
                                  No se puede borrar con invitados asociados. Desactivalo.
                                </p>
                              )}
                            </div>
                          </details>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Anexo: alta de tipo. Oculto por defecto, se abre con "+ Nuevo tipo". */}
            {showGuestTypeForm && (
              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50/60 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Nuevo tipo de invitado</h3>
                    <p className="mt-1 text-sm text-gray-600">Define reglas simples antes de empezar a cargar personas.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuestTypeForm(false)}
                    className="flex-none text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cerrar
                  </button>
                </div>

                <form onSubmit={handleCreateGuestType} className="mt-4 space-y-4">
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
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Notas internas para el equipo"
                    />
                  </div>

                  <div>
                    <label htmlFor="guest-type-invitation-message" className="block text-sm font-medium text-gray-700">
                      Leyenda en la invitacion
                    </label>
                    <textarea
                      id="guest-type-invitation-message"
                      name="invitation_message"
                      rows={2}
                      maxLength={160}
                      value={guestTypeForm.invitation_message}
                      onChange={handleGuestTypeInputChange}
                      placeholder="Ej: Estas invitado/a al trasnoche"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">Se muestra una sola vez en la invitacion de este tipo.</p>
                  </div>

                  <div>
                    <label htmlFor="guest-type-payment-amount" className="block text-sm font-medium text-gray-700">
                      Importe por invitado (ARS)
                    </label>
                    <input
                      id="guest-type-payment-amount"
                      name="payment_amount_ars"
                      type="number"
                      min="0"
                      step="1"
                      value={guestTypeForm.payment_amount_ars}
                      onChange={handleGuestTypeInputChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">0 significa que este tipo no requiere pago.</p>
                    {Number(guestTypeForm.payment_amount_ars) > 0 && (
                      <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                        <input
                          name="show_gift_info"
                          type="checkbox"
                          checked={guestTypeForm.show_gift_info}
                          onChange={handleGuestTypeInputChange}
                          className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Mostrar el campo de regalo en la invitación</span>
                      </label>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h4 className="text-sm font-medium text-gray-900">Ventana de acceso</h4>
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
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                      Ejemplo: para un QR valido despues de las 00:00, usa `Desde 00:00` y `Dia offset desde 1`.
                    </p>
                  </div>

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
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Listado de invitados</h2>
                <p className="mt-1 text-sm text-gray-600">Vista operativa para confirmar, revisar contactos y capacidad.</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {visibleGuests.length} registros
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowImport((current) => !current)
                    setImportPreview(null)
                    setImportPreviewBatches(null)
                  }}
                  aria-expanded={showImport}
                  className="inline-flex flex-none items-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {showImport ? 'Cerrar' : 'Importar'}
                </button>
                <a
                  href={buildGuestImportTemplateSheetCopyUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-none items-center whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  Usar plantilla en Google Sheets
                </a>
                <button
                  type="button"
                  onClick={downloadGuestImportTemplate}
                  className="inline-flex flex-none items-center whitespace-nowrap rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-100"
                >
                  Descargar CSV
                </button>
                <label htmlFor="csv-guest-type" className="sr-only">
                  Tipo de invitados a exportar
                </label>
                <select
                  id="csv-guest-type"
                  value={csvGuestTypeId}
                  onChange={(eventInput) => setCsvGuestTypeId(eventInput.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Todos los tipos</option>
                  {visibleGuestTypes.map((guestType) => (
                    <option key={guestType.id} value={guestType.id}>
                      {guestType.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={downloadGuestsCsv}
                  disabled={guestsForCsv.length === 0}
                  className="inline-flex flex-none items-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* Carga masiva: pegar una lista (una fila por invitado) y crear todos de una. */}
            {showImport && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/60 p-5">
                <h3 className="text-sm font-semibold text-gray-900">Importar invitados</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Pegá una fila por invitado. Columnas separadas por coma o tab:{' '}
                  <span className="font-mono text-xs">
                    Nombre, Apellido, Telefono, Email, Tipo, Invitado de, Acompañantes, DNI, Destino
                  </span>
                  . Solo el nombre es obligatorio; el resto se detecta por el nombre de columna, en cualquier orden.
                  &quot;Invitado de&quot; es quién se ocupa de ese contacto (Mamá, la quinceañera...) y &quot;Acompañantes&quot;
                  admite varios nombres separados por punto y coma.
                </p>

                <div className="mt-4">
                  <label htmlFor="import-guest-type" className="block text-sm font-medium text-gray-700">
                    Tipo para todo el lote
                  </label>
                  <select
                    id="import-guest-type"
                    value={importGuestTypeId || visibleGuestTypes[0]?.id || ''}
                    onChange={(event) => {
                      setImportGuestTypeId(event.target.value)
                      setImportPreview(null)
                      setImportPreviewBatches(null)
                    }}
                    disabled={visibleGuestTypes.length === 0}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-64"
                  >
                    {visibleGuestTypes.length === 0 ? (
                      <option value="">Crea un tipo primero</option>
                    ) : (
                      visibleGuestTypes.map((guestType) => (
                        <option key={guestType.id} value={guestType.id}>
                          {guestType.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="mt-4">
                  <label htmlFor="guest-import-file" className="block text-sm font-medium text-gray-700">
                    Archivo CSV
                  </label>
                  <input
                    id="guest-import-file"
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={(event) => void handleImportFile(event.target.files?.[0])}
                    className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-100"
                  />
                </div>

                <textarea
                  value={importText}
                  onChange={(event) => {
                    setImportText(event.target.value)
                    setImportPreview(null)
                    setImportPreviewBatches(null)
                  }}
                  rows={6}
                  placeholder={'Sofia, Gimenez, sofia@mail.com, 3415551234, Mesa 4\nMateo, Ledesma\n...'}
                  className="mt-4 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                {importSourceTypes.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">{'Asignaci\\u00f3n de tipos detectados'}</p>
                    {importSourceTypes.map((sourceType) => (
                      <div key={sourceType} className="flex flex-wrap items-center gap-3">
                        <span className="min-w-28 rounded bg-white px-2 py-1 font-mono text-xs text-gray-700">
                          {sourceType}
                        </span>
                        <select
                          aria-label={`Tipo para ${sourceType}`}
                          value={importGuestTypeIdsBySource[sourceType] || matchingGuestTypeId(sourceType) || ''}
                          onChange={(event) => {
                            setImportGuestTypeIdsBySource((current) => ({
                              ...current,
                              [sourceType]: event.target.value,
                            }))
                            setImportPreview(null)
                            setImportPreviewBatches(null)
                          }}
                          disabled={visibleGuestTypes.length === 0}
                          className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">{'Seleccion\\u00e1 un tipo'}</option>
                          {visibleGuestTypes.map((guestType) => (
                            <option key={guestType.id} value={guestType.id}>
                              {guestType.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {importError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {importError}
                  </div>
                )}

                {!importPreview && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handlePreviewImport()}
                      disabled={importPreviewLoading || parsedImportRows.length === 0}
                      className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {importPreviewLoading
                        ? 'Revisando...'
                        : `Revisar ${parsedImportRows.length} invitados`}
                    </button>
                    <span className="text-sm text-gray-500">
                      {parsedImportRows.length} filas detectadas
                    </span>
                  </div>
                )}

                {/* Nada se escribe hasta confirmar acá. Quien ya fue invitado,
                    respondió o pagó queda protegido y no aparece para actualizar. */}
                {importPreview && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/60 p-4">
                    <p className="text-sm font-semibold text-gray-900">Antes de importar, revisá esto:</p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      <li>✅ {importPreview.newCount} invitados nuevos se van a crear.</li>
                      <li>✏️ {importPreview.updateCount} ya estaban cargados (sin invitación enviada) y se van a actualizar con estos datos.</li>
                      {importPreview.protectedCount > 0 && (
                        <li>
                          🔒 {importPreview.protectedCount} coinciden con invitados que ya fueron invitados, respondieron o pagaron —{' '}
                          <strong>no se van a tocar</strong>.
                        </li>
                      )}
                      {importPreview.missingCount > 0 && (
                        <li>
                          ℹ️ {importPreview.missingCount} invitados de este tipo ya cargados en Alista no aparecen en esta planilla — quedan tal cual, nadie se borra solo.
                        </li>
                      )}
                    </ul>

                    {importPreview.protectedSample.length > 0 && (
                      <details className="mt-3 text-xs text-gray-600">
                        <summary className="cursor-pointer font-medium text-gray-700">
                          Ver protegidos ({importPreview.protectedSample.length}{importPreview.protectedCount > importPreview.protectedSample.length ? '+' : ''})
                        </summary>
                        <ul className="mt-1 space-y-0.5">
                          {importPreview.protectedSample.map((item, index) => (
                            <li key={index}>
                              {item.name} — {item.detail}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}

                    {importPreview.missingSample.length > 0 && (
                      <details className="mt-3 text-xs text-gray-600">
                        <summary className="cursor-pointer font-medium text-gray-700">
                          Ver quiénes no aparecen ({importPreview.missingSample.length}{importPreview.missingCount > importPreview.missingSample.length ? '+' : ''})
                        </summary>
                        <ul className="mt-1 space-y-0.5">
                          {importPreview.missingSample.map((item, index) => (
                            <li key={index}>{item.name}</li>
                          ))}
                        </ul>
                      </details>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handleConfirmImport()}
                        disabled={importLoading}
                        className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {importLoading ? 'Importando...' : 'Confirmar importación'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelImportPreview}
                        disabled={importLoading}
                        className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Volver a editar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-end gap-2 border-y border-gray-100 py-3">
              <div className="w-full min-w-0 flex-1 lg:min-w-80">
                <label htmlFor="guest-search" className="sr-only">Buscar invitados</label>
                <input
                  id="guest-search"
                  value={guestQuery}
                  onChange={(eventInput) => {
                    setGuestQuery(eventInput.target.value)
                    setGuestPage(0)
                  }}
                  placeholder="Buscar por nombre, teléfono, email o destino..."
                  className="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="w-full sm:w-40 lg:w-36">
                <label htmlFor="guest-status-filter" className="sr-only">Filtrar por estado</label>
                <select
                  id="guest-status-filter"
                  value={guestStatusFilter}
                  onChange={(eventInput) => {
                    setGuestStatusFilter(eventInput.target.value as 'all' | Guest['status'])
                    setGuestPage(0)
                  }}
                  className="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Todos los estados</option>
                  {Object.entries(GUEST_STATUS_LABELS).map(([status, label]) => (
                    <option key={status} value={status}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-40 lg:w-40">
                <label htmlFor="guest-type-filter" className="sr-only">Filtrar por tipo</label>
                <select
                  id="guest-type-filter"
                  value={guestTypeFilter}
                  onChange={(eventInput) => {
                    setGuestTypeFilter(eventInput.target.value)
                    setGuestPage(0)
                  }}
                  className="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">Todos los tipos</option>
                  {visibleGuestTypes.map((guestType) => (
                    <option key={guestType.id} value={guestType.id}>{guestType.name}</option>
                  ))}
                </select>
              </div>
              {invitationDeliveryAvailable && (
                <div className="w-full sm:w-48 lg:w-44">
                  <label htmlFor="guest-sender-group-filter" className="sr-only">Filtrar por responsable de envío</label>
                  <select
                    id="guest-sender-group-filter"
                    value={senderGroupFilter}
                    onChange={(eventInput) => {
                      setSenderGroupFilter(eventInput.target.value)
                      setGuestPage(0)
                    }}
                    className="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">Invitados de: Todos</option>
                    <option value="unassigned">Invitados de: Sin asignar</option>
                    {invitationDeliveryGroups.map((group) => (
                      <option key={group.id} value={group.id}>Invitados de: {group.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="w-full sm:w-32 lg:w-28">
                <label htmlFor="guests-per-page" className="sr-only">Invitados por página</label>
                <select
                  id="guests-per-page"
                  value={guestsPerPage}
                  onChange={(eventInput) => {
                    const value = eventInput.target.value
                    setGuestsPerPage(value === 'all' ? 'all' : Number(value) as 25 | 50)
                    setGuestPage(0)
                  }}
                  className="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="25">25 por página</option>
                  <option value="50">50 por página</option>
                  <option value="all">Mostrar todos</option>
                </select>
              </div>
              <p className="text-xs font-medium text-gray-500">
                {filteredGuests.length} de {visibleGuests.length}
              </p>
            </div>

            {selectedGuests.length > 0 && (
              <div className="sticky top-3 z-20 mt-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm font-semibold">{selectedGuests.length} invitados seleccionados</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void runBulkIssueAccess()}
                    disabled={bulkActionLoading}
                    className="rounded-lg bg-violet-400 px-3 py-2 text-xs font-semibold text-violet-950 hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {bulkIssueProgress
                      ? `Generando ${bulkIssueProgress.done}/${bulkIssueProgress.total}...`
                      : 'Generar invitación'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runBulkCancel()}
                    disabled={bulkActionLoading}
                    className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <select
                    value={bulkGuestTypeId}
                    onChange={(eventInput) => setBulkGuestTypeId(eventInput.target.value)}
                    disabled={bulkActionLoading}
                    className="rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Cambiar tipo de los seleccionados"
                  >
                    <option value="">Mover a tipo...</option>
                    {visibleGuestTypes.map((guestType) => (
                      <option key={guestType.id} value={guestType.id}>{guestType.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void runBulkGuestTypeUpdate()}
                    disabled={bulkActionLoading || !bulkGuestTypeId}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Mover
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGuestIds(new Set())}
                    disabled={bulkActionLoading}
                    className="px-2 py-2 text-xs font-medium text-slate-300 hover:text-white disabled:cursor-not-allowed"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            {(guestsError || accessError) && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Error al cargar invitados: {guestsError || accessError}
              </div>
            )}

            {guestsLoading || accessLoading ? (
              <div className="mt-4 flex h-40 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : visibleGuests.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                Todavia no hay invitados cargados para este evento.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {activationBlocked && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-900">
                      Tu evento todavía no está activado
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">{activationBlocked}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={buildActivationRequestHref(event)}
                        className="inline-flex items-center rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                      >
                        Quiero activar mi evento
                      </a>
                      <button
                        type="button"
                        onClick={() => setActivationBlocked(null)}
                        className="inline-flex items-center rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                      >
                        Seguir cargando invitados
                      </button>
                    </div>
                  </div>
                )}
                {showIssuePrompt && !activationBlocked && guestsWithoutInvitation.length > 0 && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
                    <p className="text-sm font-semibold text-violet-950">
                      {guestsWithoutInvitation.length === 1
                        ? 'Queda 1 invitado sin invitación emitida'
                        : `Quedan ${guestsWithoutInvitation.length} invitados sin invitación emitida`}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-violet-900/80">
                      Cargarlos no les genera el link. Hasta emitirlo no hay nada para mandar por WhatsApp.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void issueAccessForGuests(guestsWithoutInvitation)}
                        disabled={bulkActionLoading}
                        className="inline-flex items-center rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {bulkIssueProgress
                          ? `Generando ${bulkIssueProgress.done}/${bulkIssueProgress.total}...`
                          : guestsWithoutInvitation.length === 1
                          ? 'Generar la invitación'
                          : `Generar las ${guestsWithoutInvitation.length} invitaciones`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowIssuePrompt(false)}
                        disabled={bulkActionLoading}
                        className="inline-flex items-center rounded-full border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Todavía estoy cargando
                      </button>
                    </div>
                  </div>
                )}
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
                {filteredGuests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
                    No hay invitados que coincidan con estos filtros.
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-gray-200">
                      <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3 rounded-t-xl border-b border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        <input
                          type="checkbox"
                          checked={allPageGuestsSelected}
                          onChange={togglePageSelection}
                          aria-label="Seleccionar invitados de esta página"
                          className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Invitado · tipo · estado</span>
                      </div>
                {pagedGuests.map((guest) => (
                  <div key={guest.id} className="border-b border-gray-200 bg-white px-3 py-2 last:rounded-b-xl last:border-b-0">
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
                              {visibleGuestTypes.map((guestType) => (
                                <option key={guestType.id} value={guestType.id}>
                                  {guestType.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`edit-table-assignment-${guest.id}`} className="block text-sm font-medium text-gray-700">
                              Destino (mesa/sector)
                            </label>
                            <input
                              id={`edit-table-assignment-${guest.id}`}
                              name="table_assignment"
                              value={editGuestForm.table_assignment}
                              onChange={handleEditGuestInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              placeholder="Mesa 4, VIP, Staff..."
                            />
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
                          const deliveryTracking = latestToken
                            ? invitationDeliveryByTokenId.get(latestToken.id)
                            : undefined
                          const dbStatus: DbGuestStatus =
                            guest.db_status ?? mapGuestStatusToDb(guest.status)
                          const invitationWasUsed = Boolean(
                            latestToken?.last_used_at || (latestToken?.used_count ?? 0) > 0 || latestToken?.is_active === false
                          )
                          const invitationExpired = isInvitationExpired(latestToken?.expires_at)
                          const accessReady =
                            isInvitationAccessReady(dbStatus, guest.payment_status ?? 'not_required') &&
                            Boolean(latestToken) &&
                            !invitationWasUsed &&
                            !invitationExpired
                          const renderableQrImageUrl =
                            accessReady &&
                              latestQrCode?.qr_image_url &&
                              latestToken &&
                              latestQrCode.qr_value.includes(latestToken.token)
                              ? latestQrCode.qr_image_url
                              : null
                          const isExpanded = expandedGuestIds.has(guest.id)

                          // El pago solo es un tema si este invitado paga algo: su
                          // tipo tiene precio, o ya arrastra un estado de pago real.
                          const guestPaymentStatus = guest.payment_status ?? 'not_required'
                          const paymentIsRelevant =
                            (guestTypePriceById.get(guest.guest_type_id) ?? 0) > 0 ||
                            guestPaymentStatus !== 'not_required'

                          const missingContactFields = [
                            guest.phone ? null : 'teléfono',
                            guest.email ? null : 'email',
                            guest.document_number ? null : 'DNI',
                          ].filter(Boolean) as string[]

                          // Un unico relato del estado, con el paso siguiente adentro.
                          const stageCopy =
                            guest.status === 'checked_in'
                              ? { title: 'Ya ingresó a la fiesta', detail: 'Su acceso quedó consumido en la puerta.' }
                              : invitationWasUsed
                              ? { title: 'Su acceso ya fue usado', detail: 'Si necesita entrar otra vez, regenerá la invitación.' }
                              : invitationExpired
                              ? { title: 'Su invitación venció', detail: 'Regenerala para volver a dejarla disponible.' }
                              : !latestToken
                              ? {
                                  title: 'Todavía no tiene invitación',
                                  detail: 'Sin link generado no hay nada para mandarle.',
                                }
                              : accessReady
                              ? { title: 'Listo para ingresar', detail: 'Confirmó y su QR está habilitado para la puerta.' }
                              : paymentIsRelevant && guestPaymentStatus !== 'approved'
                              ? {
                                  title: 'Invitación generada, falta acreditar su pago',
                                  detail: 'Su QR se habilita cuando el pago quede confirmado.',
                                }
                              : {
                                  title: 'Invitación generada, sin respuesta',
                                  detail: 'Mandale el link. Su QR aparece cuando confirme la asistencia.',
                                }

                          return (
                            <>
                        {/* Fila colapsada: lo minimo para escanear la lista de un vistazo. */}
                        <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedGuestIds.has(guest.id)}
                          onChange={() => toggleGuestSelection(guest.id)}
                          onClick={(eventInput) => eventInput.stopPropagation()}
                          aria-label={`Seleccionar a ${guest.first_name} ${guest.last_name}`}
                          className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleGuestExpanded(guest.id)}
                          aria-expanded={isExpanded}
                          className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {guest.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={guest.photo_url}
                              alt={`Foto de ${guest.first_name} ${guest.last_name}`}
                              className="size-10 flex-none rounded-full border border-gray-200 object-cover"
                            />
                          ) : (
                            <span className="flex size-10 flex-none items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-500">
                              {`${guest.first_name?.[0] ?? ''}${guest.last_name?.[0] ?? ''}`.toUpperCase() || '?'}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate font-medium text-gray-900">
                                {guest.first_name} {guest.last_name}
                              </h3>
                              <span className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ${GUEST_DB_STATUS_STYLES[dbStatus]}`}>
                                {GUEST_DB_STATUS_LABELS[dbStatus]}
                              </span>
                              {guest.payment_status && guest.payment_status !== 'not_required' && (
                                <span
                                  className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ${GUEST_PAYMENT_STYLES[guest.payment_status]}`}
                                >
                                  {GUEST_PAYMENT_LABELS[guest.payment_status]}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-sm text-gray-500">
                              {guest.guest_types?.name || 'Sin tipo asociado'}
                              {guest.email ? ` · ${guest.email}` : ''}
                            </p>
                            {invitationDeliveryAvailable && latestToken && (
                              <p className="mt-1 truncate text-xs text-gray-500">
                                {getInvitationDeliveryLabel(guest, deliveryTracking)}
                                {guest.invitation_sender_group_id
                                  ? ` · ${invitationDeliveryGroups.find((group) => group.id === guest.invitation_sender_group_id)?.label ?? 'Grupo asignado'}`
                                  : ''}
                              </p>
                            )}
                          </div>
                          <svg
                            className={`size-5 flex-none text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                        {/* 1. Donde esta y que sigue. Un solo relato: antes el mismo
                            dato se repetia como badge, como "Acceso digital" y como
                            "QR pendiente", y ninguno de los tres decia que hacer. */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900">{stageCopy.title}</p>
                              <p className="mt-1 text-sm leading-6 text-gray-600">{stageCopy.detail}</p>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                {latestToken ? (
                                  <details className="relative" data-menu>
                                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 [&::-webkit-details-marker]:hidden">
                                      Enviar invitación
                                      <span aria-hidden="true">▾</span>
                                    </summary>
                                    <div
                                      className="absolute left-0 z-10 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
                                      onClick={(clickEvent) => {
                                        const acted = (clickEvent.target as HTMLElement).closest('button, a')
                                        if (acted) clickEvent.currentTarget.closest('details')?.removeAttribute('open')
                                      }}
                                    >
                                      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Email (lo manda Alista)
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => sendGuestAccessThroughProvider(guest, latestToken, 'email')}
                                        disabled={deliveryLoadingKey === `${guest.id}:email` || !guest.email}
                                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                                      >
                                        {deliveryLoadingKey === `${guest.id}:email`
                                          ? 'Enviando email...'
                                          : guest.email
                                          ? 'Enviar por email'
                                          : 'Enviar por email (falta email)'}
                                      </button>
                                      <div className="my-1 border-t border-gray-100" />
                                      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        WhatsApp (desde tu teléfono)
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => openWhatsAppAndConfirmDelivery(guest, latestToken)}
                                        disabled={!guest.phone}
                                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                                      >
                                        {guest.phone ? 'Enviar por WhatsApp' : 'Enviar por WhatsApp (falta teléfono)'}
                                      </button>
                                      {invitationDeliveryAvailable && guest.status === 'pending' && (
                                        <button
                                          type="button"
                                          onClick={() => void updateInvitationDelivery(
                                            guest,
                                            latestToken,
                                            'whatsapp',
                                            deliveryTracking?.status === 'marked_sent' ? 'unmark_sent' : 'mark_sent'
                                          )}
                                          disabled={invitationDeliveryActionKey === `${guest.id}:whatsapp`}
                                          className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                                        >
                                          {invitationDeliveryActionKey === `${guest.id}:whatsapp`
                                            ? 'Guardando...'
                                            : deliveryTracking?.status === 'marked_sent'
                                            ? 'Desmarcar como enviada'
                                            : 'Marcar como enviada'}
                                        </button>
                                      )}
                                      <div className="my-1 border-t border-gray-100" />
                                      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Otras opciones
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => copyInvitationLink(guest, latestToken)}
                                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        {copiedInvitationGuestId === guest.id ? 'Enlace copiado' : 'Copiar enlace'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openEmailShare(guest, latestToken)}
                                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        Mandar desde mi mail
                                      </button>
                                      <Link
                                        href={buildInvitationPath(latestToken.token, `${guest.first_name} ${guest.last_name}`)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        Ver invitación
                                      </Link>
                                      <div className="my-1 border-t border-gray-100" />
                                      <button
                                        type="button"
                                        onClick={() => issueGuestAccess(guest)}
                                        disabled={guestAccessActionLoadingId === guest.id}
                                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {guestAccessActionLoadingId === guest.id ? 'Generando...' : 'Regenerar invitación/QR'}
                                      </button>
                                    </div>
                                  </details>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => issueGuestAccess(guest)}
                                    disabled={guestAccessActionLoadingId === guest.id}
                                    className="inline-flex items-center whitespace-nowrap rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {guestAccessActionLoadingId === guest.id ? 'Generando...' : 'Generar invitación'}
                                  </button>
                                )}

                                {/* Correcciones a mano: existen, pero no compiten con lo de arriba. */}
                                {statusActionsFor(guest.status).map((action) => (
                                  <button
                                    key={action.target}
                                    type="button"
                                    onClick={() => runQuickStatusUpdate(guest, action.target)}
                                    disabled={guestRowActionLoadingId === guest.id}
                                    className="inline-flex items-center whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* El QR solo ocupa lugar cuando existe. */}
                            {renderableQrImageUrl && (
                              <Image
                                src={renderableQrImageUrl}
                                alt={`QR de acceso para ${guest.first_name} ${guest.last_name}`}
                                width={132}
                                height={132}
                                unoptimized
                                className="size-33 flex-none rounded-lg border border-gray-200 bg-white p-1.5"
                              />
                            )}
                          </div>
                        </div>

                        {/* 2. Los datos, en dos columnas con sentido: con que se lo
                            contacta y que le toca en la fiesta. Lo que falta se dice
                            una vez, no una linea por ausencia. */}
                        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Contacto</p>
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                              {guest.phone && <p>{guest.phone}</p>}
                              {guest.email && <p className="break-all">{guest.email}</p>}
                              {guest.document_number && <p>DNI {guest.document_number}</p>}
                              {missingContactFields.length > 0 && (
                                <p className="text-gray-400">Falta cargar: {missingContactFields.join(' · ')}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">En la fiesta</p>
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                              <p>{formatGuestTypeAccessPolicy(guest.guest_types, event.start_time)}</p>
                              <p>
                                Destino: {guest.table_assignment || <span className="text-gray-400">sin asignar</span>}
                              </p>
                              {guest.plus_ones_allowed > 0 && (
                                <p>Acompañantes: {guest.plus_ones_confirmed}/{guest.plus_ones_allowed}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {(() => {
                          // Los datos extras (menu, acompanantes, cancion, saludo,
                          // observaciones) viven serializados en notes. Los parseamos
                          // para mostrarlos de forma estructurada en lugar de un blob.
                          const details = parseInvitationDetails(guest.special_requests)
                          const extras = [
                            { label: 'Menú', value: details.dietaryRequirements },
                            { label: 'Acompañantes', value: details.companionNames },
                            { label: 'Canción', value: details.song },
                            { label: 'Saludo', value: details.greeting },
                            { label: 'Observaciones', value: details.observations },
                          ].filter((item) => item.value.trim().length > 0)

                          if (extras.length === 0) {
                            return null
                          }

                          return (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Lo que respondió
                              </p>
                              <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                                {extras.map((item) => (
                                  <div key={item.label} className="flex flex-col">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                      {item.label}
                                    </dt>
                                    <dd className="whitespace-pre-line text-gray-700">{item.value}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          )
                        })()}

                        {/* 3. Pago: solo si este invitado paga algo. En una fiesta sin
                            cobro, tres botones para elegir "Sin cobro" son ruido. */}
                        {paymentIsRelevant && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pago</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {(['not_required', 'pending', 'approved'] as GuestPaymentStatus[]).map((option) => {
                                const active = (guest.payment_status ?? 'not_required') === option
                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => runPaymentUpdate(guest, option)}
                                    disabled={guestRowActionLoadingId === guest.id || active}
                                    className={`inline-flex items-center whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed ${
                                      active
                                        ? `border-transparent ${GUEST_PAYMENT_STYLES[option]}`
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60'
                                    }`}
                                  >
                                    {GUEST_PAYMENT_LABELS[option]}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {invitationDeliveryAvailable && latestToken && (
                          <div className="grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quién la envía</p>
                              <select
                                value={guest.invitation_sender_group_id ?? ''}
                                onChange={(eventInput) => void assignSenderGroup(guest, eventInput.target.value || null)}
                                disabled={invitationDeliveryActionKey === `${guest.id}:group`}
                                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                                aria-label={`Quién envía la invitación de ${guest.first_name} ${guest.last_name}`}
                              >
                                <option value="">Sin asignar</option>
                                {invitationDeliveryGroups.map((group) => (
                                  <option key={group.id} value={group.id}>{group.label}</option>
                                ))}
                              </select>
                              <p className="mt-1 text-xs text-gray-500">Es una organización interna, no un usuario nuevo.</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Seguimiento del envío</p>
                              <p className="mt-2 text-sm font-medium text-gray-800">
                                {getInvitationDeliveryLabel(guest, deliveryTracking)}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                {deliveryTracking?.first_opened_at
                                  ? 'La visita no confirma quién lo abrió ni que haya leído la invitación.'
                                  : 'Generar el link no significa que ya haya sido enviado.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 4. Diagnostico. Interesa cuando algo no funciona, no antes. */}
                        <details className="group">
                          <summary className="w-fit cursor-pointer list-none text-xs font-semibold text-gray-400 transition hover:text-gray-700 [&::-webkit-details-marker]:hidden">
                            <span className="group-open:hidden">Detalle técnico del acceso</span>
                            <span className="hidden group-open:inline">Ocultar detalle técnico</span>
                          </summary>
                          <div className="mt-2 space-y-1 border-l border-gray-200 pl-4 text-sm text-gray-600">
                            <p>
                              Token:{' '}
                              <span className="font-mono text-xs text-gray-800">
                                {latestToken ? `${latestToken.token.slice(0, 18)}...` : 'No generado'}
                              </span>
                            </p>
                            <p>Vence: {latestToken ? formatDateTime(latestToken.expires_at) : 'No disponible'}</p>
                            <p>
                              Uso:{' '}
                              {latestToken?.last_used_at
                                ? `Utilizado ${formatDateTime(latestToken.last_used_at)}`
                                : 'Sin registrar'}
                            </p>
                            <p>Creado: {formatDate(guest.created_at)}</p>
                            {latestToken && (
                              <p>
                                <Link
                                  href={buildInvitationPath(latestToken.token, `${guest.first_name} ${guest.last_name}`)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-blue-700 hover:text-blue-900"
                                >
                                  Abrir la invitación como la ve el invitado
                                </Link>
                              </p>
                            )}
                          </div>
                        </details>

                        {/* 5. Ficha del invitado. */}
                        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                          <button
                            type="button"
                            onClick={() => startEditingGuest(guest)}
                            disabled={guestRowActionLoadingId === guest.id}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGuest(guest)}
                            disabled={guestRowActionLoadingId === guest.id}
                            className="ml-auto inline-flex items-center rounded-md px-2 py-2 text-sm font-medium text-rose-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Borrar
                          </button>
                        </div>
                          </div>
                        )}
                            </>
                          )
                        })()}
                      </>
                    )}
                  </div>
                ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-500">
                        Mostrando {currentGuestPage * effectiveGuestsPerPage + 1}-{Math.min((currentGuestPage + 1) * effectiveGuestsPerPage, filteredGuests.length)} de {filteredGuests.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGuestPage((current) => Math.max(0, current - 1))}
                          disabled={currentGuestPage === 0}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Anterior
                        </button>
                        <span className="text-sm font-medium text-gray-600">Página {currentGuestPage + 1} de {guestPageCount}</span>
                        <button
                          type="button"
                          onClick={() => setGuestPage((current) => Math.min(guestPageCount - 1, current + 1))}
                          disabled={currentGuestPage >= guestPageCount - 1}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
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
                  disabled={visibleGuestTypes.length === 0}
                  value={selectedGuestTypeId}
                  onChange={handleGuestInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  {visibleGuestTypes.length === 0 ? (
                    <option value="">Primero crea un tipo</option>
                  ) : (
                    visibleGuestTypes.map((guestType) => (
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
                <label htmlFor="guest-table-assignment" className="block text-sm font-medium text-gray-700">
                  Destino (mesa/sector)
                </label>
                <input
                  id="guest-table-assignment"
                  name="table_assignment"
                  value={guestForm.table_assignment}
                  onChange={handleGuestInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Mesa 4, VIP, Staff..."
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
                disabled={guestSubmitting || visibleGuestTypes.length === 0}
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guestSubmitting ? 'Guardando invitado...' : 'Crear invitado'}
              </button>
            </form>
          </div>

          <Link
            href={`/admin/events/${event.id}/tables`}
            className="group block rounded-xl border border-sky-200 bg-sky-50 p-5 shadow-sm transition hover:border-sky-300 hover:bg-sky-100/70"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">Operación</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">Conformación de mesas</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Distribuí confirmados por mesa o sector y controlá la cantidad de personas.
            </p>
            <span className="mt-4 inline-flex text-sm font-semibold text-sky-800 group-hover:text-sky-950">Abrir mesas →</span>
          </Link>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="sidebar-guest-types-heading">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Configuración</p>
                <h2 id="sidebar-guest-types-heading" className="mt-2 text-lg font-semibold text-gray-900">Tipos de invitados</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">{activeGuestTypesCount} tipos activos.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuestTypeForm((current) => !current)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {showGuestTypeForm ? 'Cerrar' : '+ Nuevo'}
              </button>
            </div>

            {showGuestTypeForm && (
              <form onSubmit={handleCreateGuestType} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label htmlFor="sidebar-guest-type-name" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nombre</label>
                  <input
                    id="sidebar-guest-type-name"
                    name="name"
                    required
                    value={guestTypeForm.name}
                    onChange={handleGuestTypeInputChange}
                    placeholder="Ej: VIP, Cena, Staff"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="sidebar-guest-type-description" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Descripción</label>
                  <input
                    id="sidebar-guest-type-description"
                    name="description"
                    value={guestTypeForm.description}
                    onChange={handleGuestTypeInputChange}
                    placeholder="Uso interno"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="sidebar-guest-type-invitation-message" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Leyenda en la invitacion</label>
                  <textarea
                    id="sidebar-guest-type-invitation-message"
                    name="invitation_message"
                    rows={2}
                    maxLength={160}
                    value={guestTypeForm.invitation_message}
                    onChange={handleGuestTypeInputChange}
                    placeholder="Ej: Estas invitado/a al trasnoche"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="mt-1 text-xs text-gray-500">Se muestra una sola vez en la invitacion de este tipo.</p>
                </div>
                <div>
                  <label htmlFor="sidebar-guest-type-policy" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Etiqueta de acceso</label>
                  <input id="sidebar-guest-type-policy" name="access_policy_label" value={guestTypeForm.access_policy_label} onChange={handleGuestTypeInputChange} placeholder="Ej: Desde medianoche" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Desde</label>
                    <input name="access_start_time" type="time" value={guestTypeForm.access_start_time} onChange={handleGuestTypeInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hasta</label>
                    <input name="access_end_time" type="time" value={guestTypeForm.access_end_time} onChange={handleGuestTypeInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Día inicio</label>
                    <input name="access_start_day_offset" type="number" value={guestTypeForm.access_start_day_offset} onChange={handleGuestTypeInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Día fin</label>
                    <input name="access_end_day_offset" type="number" value={guestTypeForm.access_end_day_offset} onChange={handleGuestTypeInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Importe por invitado (ARS)</label>
                  <input name="payment_amount_ars" type="number" min="0" step="1" value={guestTypeForm.payment_amount_ars} onChange={handleGuestTypeInputChange} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  {Number(guestTypeForm.payment_amount_ars) > 0 && (
                    <label className="mt-3 flex items-center gap-2 text-xs text-gray-700">
                      <input
                        name="show_gift_info"
                        type="checkbox"
                        checked={guestTypeForm.show_gift_info}
                        onChange={handleGuestTypeInputChange}
                        className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Mostrar el campo de regalo en la invitación</span>
                    </label>
                  )}
                </div>
                {guestTypeSubmitError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{guestTypeSubmitError}</p>}
                <button
                  type="submit"
                  disabled={guestTypeSubmitting}
                  className="w-full rounded-lg bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guestTypeSubmitting ? 'Guardando...' : 'Crear tipo'}
                </button>
              </form>
            )}

            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              {visibleGuestTypes.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Todavía no hay tipos creados.</p>
              ) : (
                visibleGuestTypes.map((guestType) => (
                  <div key={guestType.id} className="rounded-lg border border-gray-100 px-3 py-2.5">
                    {editingGuestTypeId === guestType.id && editGuestTypeForm ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Editando tipo</p>
                            <h3 className="mt-1 text-base font-semibold text-gray-950">{guestType.name}</h3>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${guestType.is_active === false ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'}`}>
                            {guestType.is_active === false ? 'Inactivo' : 'Activo'}
                          </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Nombre</label>
                            <input
                              name="name"
                              value={editGuestTypeForm.name}
                              onChange={handleEditGuestTypeInputChange}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Etiqueta de acceso</label>
                            <input
                              name="access_policy_label"
                              value={editGuestTypeForm.access_policy_label}
                              onChange={handleEditGuestTypeInputChange}
                              placeholder="Ej: Desde medianoche"
                              className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Descripción</label>
                          <textarea
                            name="description"
                            rows={2}
                            value={editGuestTypeForm.description}
                            onChange={handleEditGuestTypeInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Leyenda en la invitacion</label>
                          <textarea
                            name="invitation_message"
                            rows={2}
                            maxLength={160}
                            value={editGuestTypeForm.invitation_message}
                            onChange={handleEditGuestTypeInputChange}
                            placeholder="Ej: Estas invitado/a al trasnoche"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500">Se muestra una sola vez en la invitacion de este tipo.</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Hora desde</label>
                            <input name="access_start_time" type="time" value={editGuestTypeForm.access_start_time} onChange={handleEditGuestTypeInputChange} className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Hora hasta</label>
                            <input name="access_end_time" type="time" value={editGuestTypeForm.access_end_time} onChange={handleEditGuestTypeInputChange} className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Día de inicio</label>
                            <input name="access_start_day_offset" type="number" value={editGuestTypeForm.access_start_day_offset} onChange={handleEditGuestTypeInputChange} className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Día de fin</label>
                            <input name="access_end_day_offset" type="number" value={editGuestTypeForm.access_end_day_offset} onChange={handleEditGuestTypeInputChange} className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Importe por invitado (ARS)</label>
                          <input name="payment_amount_ars" type="number" min="0" step="1" value={editGuestTypeForm.payment_amount_ars} onChange={handleEditGuestTypeInputChange} className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm" />
                          {Number(editGuestTypeForm.payment_amount_ars) > 0 && (
                            <label className="mt-3 flex items-center gap-2 text-xs text-gray-700">
                              <input
                                name="show_gift_info"
                                type="checkbox"
                                checked={editGuestTypeForm.show_gift_info}
                                onChange={handleEditGuestTypeInputChange}
                                className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>Mostrar el campo de regalo en la invitación</span>
                            </label>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void saveGuestTypeUpdates(guestType.id)}
                            disabled={guestTypeActionLoadingId === guestType.id}
                            className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            Guardar
                          </button>
                          <button type="button" onClick={cancelEditingGuestType} className="rounded-md px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900">{guestType.name}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${guestType.is_active === false ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'}`}>
                              {guestType.is_active === false ? 'Inactivo' : 'Activo'}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{guestType.description || 'Sin descripción'}</p>
                        </div>
                        <div className="flex flex-none items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void toggleGuestTypeActiveState(guestType, guestType.is_active === false)}
                            disabled={guestTypeActionLoadingId === guestType.id}
                            className="text-xs font-semibold text-gray-600 hover:text-gray-950 disabled:opacity-60"
                          >
                            {guestType.is_active === false ? 'Reactivar' : 'Desactivar'}
                          </button>
                          <button type="button" onClick={() => startEditingGuestType(guestType)} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Editar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {guestTypeActionError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{guestTypeActionError}</p>}
            {guestTypeActionNotice && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{guestTypeActionNotice}</p>}
          </section>
        </aside>
      </div>
    </div>
  )
}

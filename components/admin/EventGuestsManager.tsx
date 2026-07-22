'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatGuestTypeAccessPolicy } from '@/lib/access-policy'
import { mapGuestStatusToDb, type DbGuestStatus } from '@/lib/guest-schema'
import {
  GUEST_DB_STATUS_LABELS,
  GUEST_DB_STATUS_STYLES,
  GUEST_PAYMENT_LABELS,
  GUEST_PAYMENT_STYLES,
  type GuestPaymentStatus,
} from '@/lib/guest-status-display'
import { parseInvitationDetails } from '@/lib/invitation-response'
import { useGuestTypes, useGuests } from '@/lib/hooks'
import { buildAbsoluteAppUrl } from '@/lib/public-url'
import { toE164 } from '@/lib/phone'
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
  UpdateGuestTypeForm,
} from '@/types'

type EventGuestsManagerProps = {
  event: Pick<Event, 'id' | 'name' | 'slug' | 'max_capacity' | 'event_date' | 'start_time' | 'delivery_profile_id'>
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
  tone: 'confirm' | 'checkin' | 'cancel' | 'revert'
}

const STATUS_ACTION_STYLES: Record<StatusAction['tone'], string> = {
  confirm: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  checkin: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  cancel: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
  revert: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
}

function statusActionsFor(status: Guest['status']): StatusAction[] {
  switch (status) {
    case 'pending':
      return [
        { label: 'Confirmar a mano', target: 'confirmed', tone: 'confirm' },
        { label: 'Cancelar', target: 'cancelled', tone: 'cancel' },
      ]
    case 'confirmed':
      return [
        { label: 'Marcar ingreso', target: 'checked_in', tone: 'checkin' },
        { label: 'Cancelar', target: 'cancelled', tone: 'cancel' },
      ]
    case 'checked_in':
      return [{ label: 'Revertir ingreso', target: 'confirmed', tone: 'revert' }]
    case 'cancelled':
      return [{ label: 'Reactivar', target: 'pending', tone: 'confirm' }]
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

type ImportRow = {
  first_name: string
  last_name: string
  email: string
  phone: string
  table_assignment: string
}

// Parser de la carga masiva. Una fila por linea; columnas separadas por coma,
// tab (pegado de planilla) o punto y coma: Nombre, Apellido, Email, Telefono,
// Destino (mesa/sector). Solo el nombre es obligatorio; las filas sin nombre
// se descartan.
function parseGuestRows(text: string): ImportRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cols = line.split(/\t|,|;/).map((cell) => cell.trim())
      return {
        first_name: cols[0] ?? '',
        last_name: cols[1] ?? '',
        email: cols[2] ?? '',
        phone: cols[3] ?? '',
        table_assignment: cols[4] ?? '',
      }
    })
    .filter((row) => row.first_name.length > 0)
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
    bulkCreateGuests,
    updateGuest,
    deleteGuest,
    createGuestAccess,
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
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
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

  const toggleGuestExpanded = (guestId: string) => {
    setExpandedGuestIds((current) => {
      const next = new Set(current)
      if (next.has(guestId)) {
        next.delete(guestId)
      } else {
        next.add(guestId)
      }
      return next
    })
  }
  const [editGuestForm, setEditGuestForm] = useState<GuestEditFormState | null>(null)
  const [guestRowActionError, setGuestRowActionError] = useState<string | null>(null)
  const [guestRowActionNotice, setGuestRowActionNotice] = useState<string | null>(null)
  const [guestRowActionLoadingId, setGuestRowActionLoadingId] = useState<string | null>(null)
  const [guestAccessActionLoadingId, setGuestAccessActionLoadingId] = useState<string | null>(null)
  const [copiedInvitationGuestId, setCopiedInvitationGuestId] = useState<string | null>(null)
  const [deliveryLoadingKey, setDeliveryLoadingKey] = useState<string | null>(null)
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

    setEditGuestTypeForm((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        [name]: value,
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

    const result = await updateGuest(guestId, payload, {
      previousStatus: visibleGuests.find((guest) => guest.id === guestId)?.status,
      checkinMethod: 'manual',
      checkinNotes: 'Registro desde Alista Admin',
    })

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

    if (status === 'checked_in' && guest.status === 'pending') {
      payload.plus_ones_confirmed = guest.plus_ones_allowed
    }

    const result = await updateGuest(guest.id, payload, {
      previousStatus: guest.status,
      checkinMethod: 'manual',
      checkinNotes: 'Registro desde Alista Admin',
    })

    if (result.error) {
      setGuestRowActionError(result.error)
    }

    setGuestRowActionLoadingId(null)
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
    const blob = new Blob(['﻿' + buildGuestsCsv(visibleGuests)], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `invitados-${event.slug}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleBulkImport = async () => {
    setImportError(null)
    const rows = parseGuestRows(importText)
    const guestTypeId = importGuestTypeId || visibleGuestTypes[0]?.id

    if (!guestTypeId) {
      setImportError('Primero crea un tipo de invitado para asignar el lote.')
      return
    }
    if (rows.length === 0) {
      setImportError('No se detectaron invitados. Poné al menos un nombre por linea.')
      return
    }

    setImportLoading(true)
    const result = await bulkCreateGuests(guestTypeId, rows)
    setImportLoading(false)

    if (result.error) {
      setImportError(result.error)
      return
    }

    setImportText('')
    setShowImport(false)
    setGuestRowActionError(null)
    setGuestRowActionNotice(`Se importaron ${result.data?.count ?? rows.length} invitados.`)
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <section className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {visibleGuests.length} registros
                </span>
                <button
                  type="button"
                  onClick={() => setShowImport((current) => !current)}
                  aria-expanded={showImport}
                  className="inline-flex flex-none items-center whitespace-nowrap rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {showImport ? 'Cerrar' : 'Importar'}
                </button>
                <button
                  type="button"
                  onClick={downloadGuestsCsv}
                  disabled={visibleGuests.length === 0}
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
                  <span className="font-mono text-xs">Nombre, Apellido, Email, Telefono, Destino</span>. Solo el
                  nombre es obligatorio.
                </p>

                <div className="mt-4">
                  <label htmlFor="import-guest-type" className="block text-sm font-medium text-gray-700">
                    Tipo para todo el lote
                  </label>
                  <select
                    id="import-guest-type"
                    value={importGuestTypeId || visibleGuestTypes[0]?.id || ''}
                    onChange={(event) => setImportGuestTypeId(event.target.value)}
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

                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  rows={6}
                  placeholder={'Sofia, Gimenez, sofia@mail.com, 3415551234, Mesa 4\nMateo, Ledesma\n...'}
                  className="mt-4 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                {importError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {importError}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={importLoading || parseGuestRows(importText).length === 0}
                    className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importLoading
                      ? 'Importando...'
                      : `Importar ${parseGuestRows(importText).length} invitados`}
                  </button>
                  <span className="text-sm text-gray-500">
                    {parseGuestRows(importText).length} filas detectadas
                  </span>
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
                {visibleGuests.map((guest) => (
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
                          const hasRenderableQr = Boolean(
                            latestQrCode?.is_active && latestQrCode?.qr_image_url
                          )
                          const accessReady =
                            guest.status === 'confirmed' || guest.status === 'checked_in'

                          const dbStatus: DbGuestStatus =
                            guest.db_status ?? mapGuestStatusToDb(guest.status)
                          const isExpanded = expandedGuestIds.has(guest.id)

                          return (
                            <>
                        {/* Fila colapsada: lo minimo para escanear la lista de un vistazo. */}
                        <button
                          type="button"
                          onClick={() => toggleGuestExpanded(guest.id)}
                          aria-expanded={isExpanded}
                          className="flex w-full items-center gap-3 text-left"
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

                        {isExpanded && (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="grid gap-1 text-sm text-gray-600">
                            <p>Tipo: {guest.guest_types?.name || 'Sin tipo asociado'}</p>
                            <p>Destino: {guest.table_assignment || 'No asignado'}</p>
                            <p>Email: {guest.email || 'No cargado'}</p>
                            <p>Telefono: {guest.phone || 'No cargado'}</p>
                            <p>DNI: {guest.document_number || 'No cargado'}</p>
                            <p>Acceso: {formatGuestTypeAccessPolicy(guest.guest_types, event.start_time)}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 lg:min-w-67.5">
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

                        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px]">
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Acceso digital</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">
                                  {hasRenderableQr
                                    ? 'QR final habilitado'
                                    : latestToken
                                    ? 'Link de gestion emitido'
                                    : 'Sin invitacion emitida'}
                                </p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                hasRenderableQr
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : latestQrCode?.revoked_at
                                  ? 'bg-red-100 text-red-700'
                                  : latestQrCode?.is_active
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {hasRenderableQr
                                  ? 'QR activo'
                                  : latestQrCode?.revoked_at
                                  ? 'QR revocado'
                                  : latestQrCode?.is_active
                                  ? 'QR pendiente'
                                  : latestQrCode
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
                                {latestToken?.last_used_at
                                  ? `Utilizado ${formatDateTime(latestToken.last_used_at)}`
                                  : 'Sin registrar'}
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
                              {!accessReady && latestToken && (
                                <p className="text-amber-700">
                                  El QR final se habilita cuando el invitado confirma asistencia y queda listo para ingresar.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex aspect-square w-full max-w-45 items-center justify-center justify-self-center rounded-lg border border-gray-200 bg-white p-2">
                            {latestQrCode?.qr_image_url ? (
                              <Image
                                src={latestQrCode.qr_image_url}
                                alt={`QR de acceso para ${guest.first_name} ${guest.last_name}`}
                                width={180}
                                height={180}
                                unoptimized
                                className="size-full object-contain"
                              />
                            ) : (
                              <div className="text-center text-xs text-gray-500">
                                QR pendiente
                              </div>
                            )}
                          </div>
                        </div>

                        {(() => {
                          // Los datos extras (menu, acompanantes, cancion, saludo,
                          // observaciones) viven serializados en notes. Los parseamos
                          // para mostrarlos de forma estructurada en lugar de un blob.
                          const details = parseInvitationDetails(guest.special_requests)
                          const extras = [
                            { label: 'Menu', value: details.dietaryRequirements },
                            { label: 'Acompanantes', value: details.companionNames },
                            { label: 'Cancion', value: details.song },
                            { label: 'Saludo', value: details.greeting },
                            { label: 'Observaciones', value: details.observations },
                          ].filter((item) => item.value.trim().length > 0)

                          if (extras.length === 0) {
                            return null
                          }

                          return (
                            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Datos del invitado
                              </p>
                              <dl className="mt-2 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                                {extras.map((item) => (
                                  <div key={item.label} className="flex flex-col">
                                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                      {item.label}
                                    </dt>
                                    <dd className="text-gray-700 whitespace-pre-line">
                                      {item.value}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          )
                        })()}

                        <div className="mt-4 space-y-3">
                          {/* Enviar: un solo boton con menu. Si no hay token todavia, primero emitir. */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-20 text-xs font-semibold uppercase tracking-wide text-gray-400">Invitacion</span>
                            {latestToken ? (
                              <details className="relative">
                                <summary className="inline-flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 [&::-webkit-details-marker]:hidden">
                                  Enviar invitacion
                                  <span aria-hidden="true">▾</span>
                                </summary>
                                <div className="absolute left-0 z-10 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
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
                                    WhatsApp (desde tu telefono)
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => openWhatsAppShare(guest, latestToken)}
                                    disabled={!guest.phone}
                                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                                  >
                                    {guest.phone ? 'Enviar por WhatsApp' : 'Enviar por WhatsApp (falta telefono)'}
                                  </button>
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
                                    Ver invitacion
                                  </Link>
                                  <div className="my-1 border-t border-gray-100" />
                                  <button
                                    type="button"
                                    onClick={() => issueGuestAccess(guest)}
                                    disabled={guestAccessActionLoadingId === guest.id}
                                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {guestAccessActionLoadingId === guest.id ? 'Generando...' : 'Regenerar invitacion/QR'}
                                  </button>
                                </div>
                              </details>
                            ) : (
                              <button
                                type="button"
                                onClick={() => issueGuestAccess(guest)}
                                disabled={guestAccessActionLoadingId === guest.id}
                                className="inline-flex items-center whitespace-nowrap rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {guestAccessActionLoadingId === guest.id ? 'Generando acceso...' : 'Emitir invitacion/QR'}
                              </button>
                            )}
                          </div>

                          {/* Estado: solo las transiciones que aplican al estado actual. */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-20 text-xs font-semibold uppercase tracking-wide text-gray-400">Estado</span>
                            {statusActionsFor(guest.status).map((action) => (
                              <button
                                key={action.target}
                                type="button"
                                onClick={() => runQuickStatusUpdate(guest, action.target)}
                                disabled={guestRowActionLoadingId === guest.id}
                                className={`inline-flex items-center whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_ACTION_STYLES[action.tone]}`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>

                          {/* Pago: conciliacion. El actual queda marcado; confirmar destraba el acceso. */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-20 text-xs font-semibold uppercase tracking-wide text-gray-400">Pago</span>
                            {(['not_required', 'pending', 'approved'] as GuestPaymentStatus[]).map(
                              (option) => {
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
                              }
                            )}
                          </div>

                          {/* Ficha del invitado. */}
                          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
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
                              className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Borrar
                            </button>
                          </div>
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
        </aside>
      </div>
    </div>
  )
}

'use client'

import jsQR from 'jsqr'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { evaluateGuestAccess, formatGuestTypeAccessPolicy } from '@/lib/access-policy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Checkin, Event, EventBranding, Guest, GuestType, InvitationToken } from '@/types'

type EventCheckinManagerProps = {
  event: Pick<Event, 'id' | 'name' | 'slug' | 'event_date' | 'start_time'>
  branding?: Pick<EventBranding, 'primary_color' | 'secondary_color' | 'logo_url' | 'banner_url'> | null
  mode?: 'admin' | 'door' | 'totem'
}

type AccessPayload = {
  token: string
  source: Checkin['checkin_method']
}

type CheckinStatus =
  | {
      kind: 'success'
      title: string
      detail: string
    }
  | {
      kind: 'warning'
      title: string
      detail: string
    }
  | {
      kind: 'error'
      title: string
      detail: string
    }

type CheckinWithGuest = Checkin & {
  guests?: Pick<Guest, 'first_name' | 'last_name' | 'status'> | null
}

type TotemSpotlight = {
  id: string
  fullName: string
  checkinTime: string
}

type OverrideableAccessCode = 'already_checked_in' | 'outside_window'

type OverrideContext = {
  guest: SearchableGuest
  source: Checkin['checkin_method']
  invitationToken?: InvitationToken
  decisionCode: OverrideableAccessCode
}

type SearchableGuest = Pick<
  Guest,
  | 'id'
  | 'event_id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone'
  | 'status'
  | 'plus_ones_allowed'
  | 'plus_ones_confirmed'
> & {
  guest_types?: Pick<
    GuestType,
    | 'name'
    | 'access_policy_label'
    | 'access_start_time'
    | 'access_end_time'
    | 'access_start_day_offset'
    | 'access_end_day_offset'
  > | null
}

type SearchableGuestRow = Omit<SearchableGuest, 'guest_types'> & {
  guest_types?: SearchableGuest['guest_types'] | SearchableGuest['guest_types'][]
}

const LIVE_REFRESH_INTERVAL_MS = 15000
const TOTEM_REFRESH_INTERVAL_MS = 5000
const TOTEM_SPOTLIGHT_DURATION_MS = 6000

function isOverrideableDecision(code: string): code is OverrideableAccessCode {
  return code === 'already_checked_in' || code === 'outside_window'
}

const STATUS_TONE_STYLES = {
  idle: {
    shell: 'border-slate-200 bg-slate-900 text-white',
    badge: 'bg-white/10 text-slate-100',
    eyebrow: 'Modo puerta',
  },
  scanning: {
    shell: 'border-blue-200 bg-blue-600 text-white',
    badge: 'bg-white/15 text-blue-50',
    eyebrow: 'Escaneando',
  },
  success: {
    shell: 'border-emerald-200 bg-emerald-600 text-white',
    badge: 'bg-white/15 text-emerald-50',
    eyebrow: 'Ingreso permitido',
  },
  warning: {
    shell: 'border-amber-200 bg-amber-500 text-slate-950',
    badge: 'bg-black/10 text-amber-950',
    eyebrow: 'Advertencia',
  },
  error: {
    shell: 'border-red-200 bg-red-600 text-white',
    badge: 'bg-white/15 text-red-50',
    eyebrow: 'Acceso bloqueado',
  },
} as const

function formatDateTime(date: string) {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Fecha invalida'
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(date))
}

function getGuestInitials(firstName?: string | null, lastName?: string | null) {
  const initials = [firstName, lastName]
    .map((part) => (part || '').trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('')

  return initials || 'Q'
}

function buildEventDateTime(eventDate: string, startTime: string) {
  const timeParts = startTime.trim().split(':').filter(Boolean)

  if (timeParts.length === 0) {
    return eventDate
  }

  const normalizedTime = [
    timeParts[0] ?? '00',
    timeParts[1] ?? '00',
    timeParts[2] ?? '00',
  ].join(':')

  return `${eventDate}T${normalizedTime}`
}

function parseAccessInput(value: string): AccessPayload {
  const trimmed = value.trim()

  if (!trimmed) {
    throw new Error('Ingresa un token o un QR para validar.')
  }

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as { token?: string }

    if (typeof parsed.token === 'string' && parsed.token.trim()) {
      return {
        token: parsed.token.trim(),
        source: 'qr',
      }
    }
  }

  return {
    token: trimmed,
    source: 'manual',
  }
}

function normalizeSearchableGuest(guest: SearchableGuestRow): SearchableGuest {
  const normalizedGuestType = Array.isArray(guest.guest_types)
    ? (guest.guest_types[0] ?? null)
    : (guest.guest_types ?? null)

  return {
    ...guest,
    guest_types: normalizedGuestType,
  }
}

export default function EventCheckinManager({
  event,
  branding = null,
  mode = 'admin',
}: EventCheckinManagerProps) {
  const isDoorMode = mode === 'door'
  const isTotemMode = mode === 'totem'
  const isImmersiveMode = isDoorMode || isTotemMode
  const [accessInput, setAccessInput] = useState('')
  const [guestSearchQuery, setGuestSearchQuery] = useState('')
  const [recentCheckins, setRecentCheckins] = useState<CheckinWithGuest[]>([])
  const [guestDirectory, setGuestDirectory] = useState<SearchableGuest[]>([])
  const [loadingRecentCheckins, setLoadingRecentCheckins] = useState(true)
  const [loadingGuestDirectory, setLoadingGuestDirectory] = useState(true)
  const [processingCheckin, setProcessingCheckin] = useState(false)
  const [manualCheckinGuestId, setManualCheckinGuestId] = useState<string | null>(null)
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerSupported, setScannerSupported] = useState(true)
  const [scannerMessage, setScannerMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<CheckinStatus | null>(null)
  const [overrideContext, setOverrideContext] = useState<OverrideContext | null>(null)
  const [overridePin, setOverridePin] = useState('')
  const [overrideSupervisorPin, setOverrideSupervisorPin] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [overrideProcessing, setOverrideProcessing] = useState(false)
  const [overridePolicyLoading, setOverridePolicyLoading] = useState(false)
  const [overridePinConfigured, setOverridePinConfigured] = useState(true)
  const [overrideSupervisorRequired, setOverrideSupervisorRequired] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [totemSpotlight, setTotemSpotlight] = useState<TotemSpotlight | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastTotemCheckinIdRef = useRef<string | null>(null)
  const spotlightTimeoutRef = useRef<number | null>(null)

  const fetchRecentCheckins = useCallback(async () => {
    try {
      setLoadingRecentCheckins(true)
      const { data, error } = await supabase
        .from('checkins')
        .select(`
          *,
          guests (
            first_name,
            last_name,
            status
          )
        `)
        .eq('event_id', event.id)
        .order('checkin_time', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      setRecentCheckins((data ?? []) as CheckinWithGuest[])
    } catch (error) {
      setStatus({
        kind: 'error',
        title: 'No se pudo cargar la actividad',
        detail: getErrorMessage(error),
      })
    } finally {
      setLoadingRecentCheckins(false)
    }
  }, [event.id])

  useEffect(() => {
    fetchRecentCheckins()
  }, [fetchRecentCheckins])

  const fetchGuestDirectory = useCallback(async () => {
    try {
      setLoadingGuestDirectory(true)
      const { data, error } = await supabase
        .from('guests')
        .select(`
          id,
          event_id,
          first_name,
          last_name,
          email,
          phone,
          status,
          plus_ones_allowed,
          plus_ones_confirmed,
          guest_types (
            name,
            access_policy_label,
            access_start_time,
            access_end_time,
            access_start_day_offset,
            access_end_day_offset
          )
        `)
        .eq('event_id', event.id)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })

      if (error) {
        throw error
      }

      setGuestDirectory(((data ?? []) as SearchableGuestRow[]).map(normalizeSearchableGuest))
    } catch (error) {
      setStatus({
        kind: 'error',
        title: 'No se pudo cargar el directorio',
        detail: getErrorMessage(error),
      })
    } finally {
      setLoadingGuestDirectory(false)
    }
  }, [event.id])

  useEffect(() => {
    fetchGuestDirectory()
  }, [fetchGuestDirectory])

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void fetchRecentCheckins()
      void fetchGuestDirectory()
    }, isTotemMode ? TOTEM_REFRESH_INTERVAL_MS : LIVE_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(refreshTimer)
    }
  }, [fetchGuestDirectory, fetchRecentCheckins, isTotemMode])

  useEffect(() => {
    const clockTimer = window.setInterval(() => {
      setNow(new Date())
    }, isTotemMode ? 1000 : 30000)

    return () => {
      window.clearInterval(clockTimer)
    }
  }, [isTotemMode])

  useEffect(() => {
    if (!isTotemMode || recentCheckins.length === 0) {
      return
    }

    const latestCheckin = recentCheckins[0]

    if (!lastTotemCheckinIdRef.current) {
      lastTotemCheckinIdRef.current = latestCheckin.id
      return
    }

    if (lastTotemCheckinIdRef.current === latestCheckin.id) {
      return
    }

    lastTotemCheckinIdRef.current = latestCheckin.id
    setTotemSpotlight({
      id: latestCheckin.id,
      fullName: `${latestCheckin.guests?.first_name || ''} ${latestCheckin.guests?.last_name || ''}`.trim() || 'Invitado autorizado',
      checkinTime: latestCheckin.checkin_time,
    })

    if (spotlightTimeoutRef.current !== null) {
      window.clearTimeout(spotlightTimeoutRef.current)
    }

    spotlightTimeoutRef.current = window.setTimeout(() => {
      setTotemSpotlight(null)
      spotlightTimeoutRef.current = null
    }, TOTEM_SPOTLIGHT_DURATION_MS)
  }, [isTotemMode, recentCheckins])

  useEffect(() => {
    return () => {
      if (spotlightTimeoutRef.current !== null) {
        window.clearTimeout(spotlightTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isTotemMode) {
      return
    }

    let cancelled = false

    const fetchOverridePolicy = async () => {
      try {
        setOverridePolicyLoading(true)
        const response = await fetch('/api/security/override', {
          method: 'GET',
        })

        const payload = (await response.json().catch(() => null)) as
          | {
              error?: string
              overridePinConfigured?: boolean
              supervisorPinRequired?: boolean
            }
          | null

        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudo cargar la politica de override.')
        }

        if (!cancelled) {
          setOverridePinConfigured(Boolean(payload?.overridePinConfigured))
          setOverrideSupervisorRequired(Boolean(payload?.supervisorPinRequired))
        }
      } catch (error) {
        if (!cancelled) {
          setOverridePinConfigured(false)
          setOverrideSupervisorRequired(false)
          setOverrideError(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setOverridePolicyLoading(false)
        }
      }
    }

    void fetchOverridePolicy()

    return () => {
      cancelled = true
    }
  }, [isTotemMode])

  const stopScanner = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setScannerActive(false)
  }, [])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const filteredGuests = useMemo(() => {
    const normalizedQuery = guestSearchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return guestDirectory.slice(0, 12)
    }

    return guestDirectory.filter((guest) => {
      const haystack = [
        guest.first_name,
        guest.last_name,
        guest.email ?? '',
        guest.phone ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [guestDirectory, guestSearchQuery])

  const doorMetrics = useMemo(() => {
    const activeGuests = guestDirectory.filter((guest) => guest.status !== 'cancelled')
    const checkedInGuests = guestDirectory.filter((guest) => guest.status === 'checked_in')
    const confirmedGuests = guestDirectory.filter((guest) => guest.status === 'confirmed')
    const pendingGuests = guestDirectory.filter((guest) => guest.status === 'pending')
    const cancelledGuests = guestDirectory.length - activeGuests.length
    const expectedPeople = activeGuests.reduce((total, guest) => total + 1 + guest.plus_ones_confirmed, 0)
    const insidePeople = checkedInGuests.reduce((total, guest) => total + 1 + guest.plus_ones_confirmed, 0)

    return {
      activeGuests: activeGuests.length,
      checkedInGuests: checkedInGuests.length,
      confirmedGuests: confirmedGuests.length,
      pendingGuests: pendingGuests.length,
      cancelledGuests,
      expectedPeople,
      insidePeople,
      remainingExpectedPeople: Math.max(expectedPeople - insidePeople, 0),
    }
  }, [guestDirectory])

  const statusTone = useMemo(() => {
    if (processingCheckin) {
      return STATUS_TONE_STYLES.scanning
    }

    if (status?.kind === 'success') {
      return STATUS_TONE_STYLES.success
    }

    if (status?.kind === 'warning') {
      return STATUS_TONE_STYLES.warning
    }

    if (status?.kind === 'error') {
      return STATUS_TONE_STYLES.error
    }

    if (scannerActive) {
      return STATUS_TONE_STYLES.scanning
    }

    return STATUS_TONE_STYLES.idle
  }, [processingCheckin, scannerActive, status])

  const statusSummary = useMemo(() => {
    if (processingCheckin) {
      return {
        title: 'Validando acceso',
        detail: 'El sistema esta resolviendo si el QR o token puede ingresar antes de habilitar el paso.',
      }
    }

    if (status) {
      return status
    }

    if (scannerActive) {
      return {
        kind: 'success' as const,
        title: 'Camara lista',
        detail: 'Apunta al QR que el invitado exhibe en su celular, email o WhatsApp.',
      }
    }

    return {
      kind: 'success' as const,
      title: 'Listo para recibir',
      detail: 'Escanea o pega un acceso. La puerta valida duplicados, horario y vigencia antes del ingreso.',
    }
  }, [processingCheckin, scannerActive, status])

  const registerGuestCheckin = useCallback(async (
    guest: SearchableGuest,
    source: Checkin['checkin_method'],
    options?: {
      invitationToken?: InvitationToken
      note?: string
      override?: {
        code: OverrideableAccessCode
        reason: string
      }
    }
  ) => {
    const { data: lastCheckinData, error: lastCheckinError } = await supabase
      .from('checkins')
      .select('*')
      .eq('event_id', event.id)
      .eq('guest_id', guest.id)
      .order('checkin_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastCheckinError) {
      throw lastCheckinError
    }

    const accessDecision = evaluateGuestAccess({
      event,
      guest,
      guestType: guest.guest_types,
      invitationToken: options?.invitationToken,
      lastCheckinTime: lastCheckinData?.checkin_time ?? null,
    })

    const overrideApproved =
      Boolean(options?.override) &&
      isOverrideableDecision(accessDecision.code) &&
      options?.override?.code === accessDecision.code

    if (accessDecision.decision !== 'allow' && !overrideApproved) {
      setOverrideError(null)
      setStatus({
        kind: accessDecision.decision === 'warn' ? 'warning' : 'error',
        title: accessDecision.title,
        detail: accessDecision.detail,
      })

      if (isOverrideableDecision(accessDecision.code) && !isTotemMode) {
        setOverrideContext({
          guest,
          source,
          invitationToken: options?.invitationToken,
          decisionCode: accessDecision.code,
        })
      } else {
        setOverrideContext(null)
      }

      return
    }

    setOverrideContext(null)
    setOverrideError(null)
    setOverridePin('')
    setOverrideSupervisorPin('')
    setOverrideReason('')

    const now = new Date().toISOString()

    if (options?.invitationToken && !options.invitationToken.used_at) {
      const { error: tokenUpdateError } = await supabase
        .from('invitation_tokens')
        .update({ used_at: now })
        .eq('id', options.invitationToken.id)

      if (tokenUpdateError) {
        throw tokenUpdateError
      }
    }

    const { error: guestUpdateError } = await supabase
      .from('guests')
      .update({
        status: 'checked_in',
        plus_ones_confirmed: guest.plus_ones_confirmed || guest.plus_ones_allowed,
      })
      .eq('id', guest.id)

    if (guestUpdateError) {
      throw guestUpdateError
    }

    const { error: checkinInsertError } = await supabase
      .from('checkins')
      .insert({
        guest_id: guest.id,
        event_id: event.id,
        checkin_time: now,
        checkin_method: source,
        notes: options?.override
          ? `Override ${options.override.code}: ${options.override.reason}`
          : options?.note ?? (source === 'qr' ? 'Check-in desde QR en admin' : 'Check-in manual desde admin'),
      })

    if (checkinInsertError) {
      throw checkinInsertError
    }

    setStatus({
      kind: 'success',
      title: options?.override ? 'Override aplicado' : 'Check-in registrado',
      detail: options?.override
        ? `${guest.first_name} ${guest.last_name} ingreso por excepcion supervisada.`
        : `${guest.first_name} ${guest.last_name} ingreso correctamente al evento.`,
    })

    await Promise.all([fetchRecentCheckins(), fetchGuestDirectory()])
  }, [event, fetchGuestDirectory, fetchRecentCheckins, isTotemMode])

  const processAccessString = useCallback(async (rawValue: string) => {
    const payload = parseAccessInput(rawValue)

    const { data: tokenData, error: tokenError } = await supabase
      .from('invitation_tokens')
      .select('*')
      .eq('event_id', event.id)
      .eq('token', payload.token)
      .maybeSingle()

    if (tokenError) {
      throw tokenError
    }

    if (!tokenData) {
      setStatus({
        kind: 'error',
        title: 'Acceso invalido',
        detail: 'No existe una invitacion para este evento con el token ingresado.',
      })
      return
    }

    const invitationToken = tokenData as InvitationToken

    const { data: guestData, error: guestError } = await supabase
      .from('guests')
      .select(`
        id,
        event_id,
        first_name,
        last_name,
        email,
        phone,
        status,
        plus_ones_allowed,
        plus_ones_confirmed,
        guest_types (
          name,
          access_policy_label,
          access_start_time,
          access_end_time,
          access_start_day_offset,
          access_end_day_offset
        )
      `)
      .eq('id', invitationToken.guest_id)
      .maybeSingle()

    if (guestError) {
      throw guestError
    }

    if (!guestData) {
      setStatus({
        kind: 'error',
        title: 'Invitado inexistente',
        detail: 'La invitacion existe, pero el invitado asociado ya no esta disponible.',
      })
      return
    }

    await registerGuestCheckin(
      normalizeSearchableGuest(guestData as SearchableGuestRow),
      payload.source,
      {
        invitationToken,
        note: payload.source === 'qr' ? 'Check-in desde QR en admin' : 'Check-in manual desde admin',
      }
    )
  }, [event.id, registerGuestCheckin])

  const consumeAccess = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setProcessingCheckin(true)
    setStatus(null)
    setOverrideContext(null)
    setOverrideError(null)

    try {
      setAccessInput('')
      await processAccessString(accessInput)
    } catch (error) {
      setStatus({
        kind: 'error',
        title: 'No se pudo validar el acceso',
        detail: getErrorMessage(error),
      })
    } finally {
      setProcessingCheckin(false)
    }
  }

  const startScanner = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerSupported(false)
        setScannerMessage('Este dispositivo o navegador no expone acceso a la camara.')
        return
      }

      stopScanner()
      setScannerMessage(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
        audio: false,
      })

      streamRef.current = stream
      setScannerActive(true)

      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas) {
        throw new Error('No se pudo inicializar el visor de camara.')
      }

      video.srcObject = stream
      await video.play()

      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (!context) {
        throw new Error('No se pudo inicializar el lector de QR.')
      }

      const scanFrame = async () => {
        if (!videoRef.current || !canvasRef.current) {
          return
        }

        if (videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
          const imageData = context.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
          const decoded = jsQR(imageData.data, imageData.width, imageData.height)

          if (decoded?.data) {
            setProcessingCheckin(true)
            setScannerMessage('QR detectado. Validando acceso...')
            setAccessInput(decoded.data)
            stopScanner()

            try {
              await processAccessString(decoded.data)
            } catch (error) {
              setStatus({
                kind: 'error',
                title: 'No se pudo validar el QR',
                detail: getErrorMessage(error),
              })
            } finally {
              setProcessingCheckin(false)
              setScannerMessage(null)
            }

            return
          }
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          void scanFrame()
        })
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        void scanFrame()
      })
    } catch (error) {
      stopScanner()
      setScannerMessage(getErrorMessage(error))
    }
  }

  const handleManualCheckin = async (guest: SearchableGuest) => {
    setManualCheckinGuestId(guest.id)
    setStatus(null)
    setOverrideContext(null)
    setOverrideError(null)

    try {
      await registerGuestCheckin(guest, 'manual', {
        note: 'Check-in manual desde busqueda de recepcion',
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        title: 'No se pudo registrar el check-in manual',
        detail: getErrorMessage(error),
      })
    } finally {
      setManualCheckinGuestId(null)
    }
  }

  const applySecurityOverride = async () => {
    if (!overrideContext) {
      return
    }

    if (!overridePin.trim()) {
      setOverrideError('Ingresa el PIN de override.')
      return
    }

    if (overrideSupervisorRequired && !overrideSupervisorPin.trim()) {
      setOverrideError('Ingresa el PIN de supervisor.')
      return
    }

    if (!overrideReason.trim()) {
      setOverrideError('Describe el motivo del override.')
      return
    }

    setOverrideProcessing(true)
    setOverrideError(null)

    try {
      const response = await fetch('/api/security/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: overridePin.trim(),
          supervisorPin: overrideSupervisorRequired ? overrideSupervisorPin.trim() : undefined,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo validar el override.')
      }

      await registerGuestCheckin(overrideContext.guest, overrideContext.source, {
        invitationToken: overrideContext.invitationToken,
        note: overrideContext.source === 'qr'
          ? 'Check-in desde QR en admin'
          : 'Check-in manual desde admin',
        override: {
          code: overrideContext.decisionCode,
          reason: overrideReason.trim(),
        },
      })
    } catch (error) {
      setOverrideError(getErrorMessage(error))
    } finally {
      setOverrideProcessing(false)
    }
  }

  if (isTotemMode) {
    const totemAccent = branding?.primary_color || '#b55330'
    const totemSecondary = branding?.secondary_color || '#182433'
    const spotlightNameParts = totemSpotlight?.fullName.split(' ').filter(Boolean) ?? []
    const spotlightInitials = totemSpotlight
      ? getGuestInitials(spotlightNameParts[0], spotlightNameParts[1])
      : getGuestInitials(event.name)

    return (
      <main
        className="min-h-screen overflow-hidden px-6 py-6 text-white sm:px-10"
        style={{
          background: branding?.banner_url
            ? `linear-gradient(180deg, rgba(10,15,24,0.55), rgba(10,15,24,0.78)), url(${branding.banner_url}) center/cover no-repeat`
            : `radial-gradient(circle at top left, ${totemAccent}55, transparent 28%), radial-gradient(circle at top right, ${totemSecondary}60, transparent 32%), linear-gradient(180deg, ${totemSecondary} 0%, #090d14 100%)`,
        }}
      >
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1080px] grid-rows-[auto_1fr_auto] gap-8">
          <header className="grid grid-cols-[1fr_auto] items-start gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.34em] text-white/65">Fecha del evento</p>
              <p className="mt-3 text-3xl font-semibold capitalize text-white">{formatEventDate(event.event_date)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm uppercase tracking-[0.34em] text-white/65">Hora actual</p>
              <p className="mt-2 text-7xl font-semibold leading-none text-white sm:text-8xl">{formatClock(now)}</p>
            </div>
          </header>

          <section className="flex min-h-0 items-center justify-center">
            <div className="flex w-full max-w-[920px] flex-col items-center justify-center rounded-[42px] border border-white/10 bg-black/28 px-8 py-10 text-center shadow-[0_35px_120px_rgba(0,0,0,0.35)] backdrop-blur-sm">
              {!totemSpotlight ? (
                <>
                  {branding?.logo_url ? (
                    // Logo URLs can come from event branding sources not covered by Next image config.
                    // Using a plain img keeps the totem resilient across arbitrary client-provided URLs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={branding.logo_url}
                      alt={event.name}
                      className="mb-8 max-h-28 w-auto object-contain"
                    />
                  ) : (
                    <div
                      className="mb-8 flex h-28 w-28 items-center justify-center rounded-full border border-white/15 text-3xl font-semibold text-white shadow-[0_0_50px_var(--event-glow)]"
                      style={{ backgroundColor: `${totemAccent}33` }}
                    >
                      {getGuestInitials(event.name)}
                    </div>
                  )}
                  <p className="text-sm uppercase tracking-[0.34em] text-white/60">Identidad del evento</p>
                  <h1 className="admin-heading mt-5 max-w-[12ch] text-6xl leading-[0.95] text-white sm:text-7xl">
                    {event.name}
                  </h1>
                  <p className="mt-6 max-w-2xl text-xl leading-8 text-white/78 sm:text-2xl">
                    Bienvenidos. Cuando el ingreso sea autorizado, la identidad del invitado aparecerá aquí de forma temporal.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm uppercase tracking-[0.34em] text-emerald-200/90">Ingreso autorizado</p>
                  <div
                    className="mt-8 flex h-[38vh] max-h-[380px] min-h-[240px] w-[38vh] max-w-[380px] min-w-[240px] items-center justify-center rounded-[36px] border border-white/14 text-8xl font-semibold text-white shadow-[0_0_90px_rgba(16,185,129,0.18)]"
                    style={{ background: `linear-gradient(145deg, ${totemAccent}55, rgba(255,255,255,0.08))` }}
                  >
                    {spotlightInitials}
                  </div>
                  <h2 className="admin-heading mt-8 text-6xl leading-none text-white sm:text-7xl">
                    {totemSpotlight.fullName}
                  </h2>
                  <p className="mt-5 text-2xl leading-8 text-white/80">
                    Acceso validado a las {formatClock(new Date(totemSpotlight.checkinTime))}
                  </p>
                </>
              )}
            </div>
          </section>

          <footer className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-5 py-2 text-sm text-white/70">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: totemSpotlight ? '#34d399' : totemAccent }}
              />
              {totemSpotlight ? 'Ingreso registrado correctamente' : 'Pantalla pública del evento'}
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Desarrollado por Qentra
            </p>
          </footer>
        </div>
      </main>
    )
  }

  if (isDoorMode) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_24%),linear-gradient(180deg,#09111b_0%,#101b2a_28%,#eef3f7_28%,#eef3f7_100%)] px-4 py-5 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <section className="rounded-[34px] border border-slate-800 bg-slate-950/96 px-6 py-6 text-white shadow-[0_28px_90px_rgba(2,8,23,0.42)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.34em] text-sky-300">Control de ingreso</p>
                <h1 className="admin-heading mt-4 text-5xl leading-none text-white">Puesto de puerta</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                  Superficie táctica para seguridad y recepción. Prioriza lectura rápida, validación inmediata y excepciones supervisadas sin contaminar la pantalla pública.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="rounded-[26px] border border-white/10 bg-white/[0.06] px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Evento</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{event.name}</p>
                  <p className="mt-2 text-sm text-slate-300">{formatEventDate(event.event_date)} · {event.start_time}</p>
                </div>
                <div className="rounded-[26px] border border-sky-400/20 bg-sky-400/10 px-5 py-4 text-right">
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">Hora actual</p>
                  <p className="mt-2 text-5xl font-semibold leading-none text-white">{formatClock(now)}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link href={`/admin/events/${event.id}/check-in`}>Abrir vista admin</Link>
              </Button>
              <Button asChild variant="outline" className="border-sky-400/20 bg-sky-400/10 text-sky-100 hover:bg-sky-400/15 hover:text-white">
                <Link href={`/admin/events/${event.id}/guests`}>Abrir directorio</Link>
              </Button>
              <Button asChild variant="outline" className="border-amber-400/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15 hover:text-white">
                <Link href={`/totem/${event.id}`}>Ver totem</Link>
              </Button>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-slate-800 bg-slate-950 text-white">
              <CardContent className="p-5">
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Dentro del evento</p>
                <p className="mt-4 text-4xl font-semibold">{doorMetrics.checkedInGuests}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {doorMetrics.insidePeople} personas estimadas con acompañantes incluidos.
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-5">
                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700/80">Esperados</p>
                <p className="mt-4 text-4xl font-semibold text-emerald-950">{doorMetrics.expectedPeople}</p>
                <p className="mt-3 text-sm leading-6 text-emerald-900">
                  {doorMetrics.remainingExpectedPeople} todavía no ingresaron.
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-5">
                <p className="text-[11px] uppercase tracking-[0.3em] text-amber-700/80">Pendientes y confirmados</p>
                <p className="mt-4 text-4xl font-semibold text-amber-950">{doorMetrics.pendingGuests + doorMetrics.confirmedGuests}</p>
                <p className="mt-3 text-sm leading-6 text-amber-900">
                  {doorMetrics.pendingGuests} pendientes y {doorMetrics.confirmedGuests} confirmados sin check-in.
                </p>
              </CardContent>
            </Card>
            <Card className="border-sky-200 bg-sky-50">
              <CardContent className="p-5">
                <p className="text-[11px] uppercase tracking-[0.3em] text-sky-700/80">Base restringida</p>
                <p className="mt-4 text-4xl font-semibold text-sky-950">{doorMetrics.cancelledGuests}</p>
                <p className="mt-3 text-sm leading-6 text-sky-900">
                  Cancelados o no habilitados en la base actual. Refresh automático cada {LIVE_REFRESH_INTERVAL_MS / 1000}s.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
            <section className="space-y-6">
              <div className={`rounded-[32px] border p-6 shadow-[0_18px_70px_rgba(15,23,42,0.12)] ${statusTone.shell}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusTone.badge}`}>
                      {statusTone.eyebrow}
                    </span>
                    <h2 className="mt-4 text-4xl font-semibold">{statusSummary.title}</h2>
                    <p className="mt-3 max-w-3xl text-base leading-7 opacity-90">{statusSummary.detail}</p>
                  </div>
                  <div className={`rounded-[24px] px-4 py-3 text-sm font-medium ${statusTone.badge}`}>
                    {scannerActive ? 'Cámara activa' : 'Cámara en espera'}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className={`rounded-[24px] px-4 py-3 ${statusTone.badge}`}>
                    <p className="text-xs uppercase tracking-[0.18em] opacity-80">Base activa</p>
                    <p className="mt-2 text-2xl font-semibold">{doorMetrics.activeGuests}</p>
                  </div>
                  <div className={`rounded-[24px] px-4 py-3 ${statusTone.badge}`}>
                    <p className="text-xs uppercase tracking-[0.18em] opacity-80">Por ingresar</p>
                    <p className="mt-2 text-2xl font-semibold">{doorMetrics.remainingExpectedPeople}</p>
                  </div>
                  <div className={`rounded-[24px] px-4 py-3 ${statusTone.badge}`}>
                    <p className="text-xs uppercase tracking-[0.18em] opacity-80">Últimos movimientos</p>
                    <p className="mt-2 text-2xl font-semibold">{recentCheckins.length}</p>
                  </div>
                </div>
              </div>

              <Card className="overflow-hidden bg-card">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardDescription>Scanner principal</CardDescription>
                    <CardTitle>Lector de QR y validación directa</CardTitle>
                    <CardDescription>
                      Flujo principal de puerta. Lee el QR que el invitado muestra en su celular y valida duplicados, horario y vigencia antes del ingreso.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={startScanner} disabled={processingCheckin}>
                      {scannerActive ? 'Reiniciar cámara' : 'Abrir cámara'}
                    </Button>
                    {scannerActive && (
                      <Button type="button" variant="outline" onClick={stopScanner}>
                        Detener
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="overflow-hidden rounded-[28px] border border-border/70 bg-black shadow-inner">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="aspect-[16/10] w-full object-cover"
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  {!scannerSupported && (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Este navegador no soporta acceso a cámara para el scanner.
                    </div>
                  )}

                  {scannerMessage && (
                    <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
                      {scannerMessage}
                    </div>
                  )}

                  <form onSubmit={consumeAccess} className="space-y-4 rounded-[28px] border border-border/70 bg-secondary/55 p-5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Entrada manual de acceso</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Fallback para token copiado o `qr_data` cuando no se puede usar cámara.
                      </p>
                    </div>
                    <Textarea
                      id="access-input"
                      value={accessInput}
                      onChange={(eventInput) => setAccessInput(eventInput.target.value)}
                      rows={5}
                      className="font-mono"
                      placeholder='qentra_xxx o {"kind":"qentra_guest_access","token":"qentra_xxx",...}'
                    />
                    <Button type="submit" className="w-full" disabled={processingCheckin}>
                      {processingCheckin ? 'Validando acceso...' : 'Validar acceso manual'}
                    </Button>
                  </form>

                  {status && (
                    <div
                      className={`rounded-[24px] border p-4 ${
                        status.kind === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : status.kind === 'warning'
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-rose-200 bg-rose-50 text-rose-800'
                      }`}
                    >
                      <h3 className="font-semibold">{status.title}</h3>
                      <p className="mt-1 text-sm">{status.detail}</p>
                    </div>
                  )}

                  {overrideContext && (
                    <div className="rounded-[28px] border border-fuchsia-200 bg-fuchsia-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-fuchsia-950">Excepción supervisada</h3>
                          <p className="mt-1 text-sm leading-6 text-fuchsia-900">
                            Usa este flujo solo si seguridad decide permitir el acceso pese a la advertencia o restricción.
                          </p>
                        </div>
                        <Badge variant="outline" className="border-fuchsia-200 bg-white/80 text-fuchsia-800">
                          {overrideContext.decisionCode === 'already_checked_in' ? 'Reingreso' : 'Fuera de horario'}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-semibold text-fuchsia-950">PIN de seguridad</p>
                          <Input
                            id="override-pin"
                            type="password"
                            value={overridePin}
                            onChange={(eventInput) => setOverridePin(eventInput.target.value)}
                            className="mt-2 border-fuchsia-200 bg-white text-slate-900"
                            placeholder="PIN de override"
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-fuchsia-950">Motivo</p>
                          <Input
                            id="override-reason"
                            value={overrideReason}
                            onChange={(eventInput) => setOverrideReason(eventInput.target.value)}
                            className="mt-2 border-fuchsia-200 bg-white text-slate-900"
                            placeholder="Ej: validado por jefe de seguridad"
                          />
                        </div>
                      </div>

                      {overrideSupervisorRequired && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-fuchsia-950">PIN de supervisor</p>
                          <Input
                            id="override-supervisor-pin"
                            type="password"
                            value={overrideSupervisorPin}
                            onChange={(eventInput) => setOverrideSupervisorPin(eventInput.target.value)}
                            className="mt-2 border-fuchsia-200 bg-white text-slate-900"
                            placeholder="Segundo control"
                          />
                        </div>
                      )}

                      <div className="mt-4 rounded-[22px] border border-fuchsia-200 bg-white/70 p-4 text-sm text-fuchsia-950">
                        {overridePolicyLoading
                          ? 'Cargando política de excepción...'
                          : !overridePinConfigured
                          ? 'La excepción no está configurada en este entorno. Define QENTRA_SECURITY_OVERRIDE_PIN para habilitarla.'
                          : overrideSupervisorRequired
                          ? 'Este entorno exige doble control: PIN de override y PIN de supervisor.'
                          : 'Este entorno exige PIN de override y motivo operativo.'}
                      </div>

                      {overrideError && (
                        <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                          {overrideError}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={applySecurityOverride}
                          disabled={overrideProcessing || overridePolicyLoading || !overridePinConfigured}
                        >
                          {overrideProcessing ? 'Validando excepción...' : 'Autorizar excepción'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setOverrideContext(null)
                            setOverridePin('')
                            setOverrideSupervisorPin('')
                            setOverrideReason('')
                            setOverrideError(null)
                          }}
                        >
                          Cancelar excepción
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardDescription>Fallback operativo</CardDescription>
                    <CardTitle>Directorio de invitados</CardTitle>
                    <CardDescription>
                      Búsqueda manual por nombre, email o teléfono cuando el invitado no presenta QR o el scanner falla.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={fetchGuestDirectory}>
                    Actualizar directorio
                  </Button>
                </CardHeader>
                <CardContent>
                  <Input
                    id="guest-search"
                    value={guestSearchQuery}
                    onChange={(eventInput) => setGuestSearchQuery(eventInput.target.value)}
                    placeholder="Ej: martina, perez, +54..."
                  />

                  {loadingGuestDirectory ? (
                    <div className="mt-4 flex h-24 items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : filteredGuests.length === 0 ? (
                    <div className="mt-4 rounded-[24px] border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                      No hay invitados que coincidan con la búsqueda.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {filteredGuests.map((guest) => (
                        <div key={guest.id} className="rounded-[24px] border border-border/70 bg-white/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {guest.first_name} {guest.last_name}
                              </p>
                              <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                                <p>{guest.email || 'Sin email'}</p>
                                <p>{guest.phone || 'Sin teléfono'}</p>
                                <p>{guest.guest_types?.name || 'Sin tipo asignado'}</p>
                                <p>{formatGuestTypeAccessPolicy(guest.guest_types, event.start_time)}</p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                guest.status === 'checked_in'
                                  ? 'info'
                                  : guest.status === 'confirmed'
                                  ? 'success'
                                  : guest.status === 'cancelled'
                                  ? 'outline'
                                  : 'warning'
                              }
                            >
                              {guest.status === 'checked_in'
                                ? 'Check-in'
                                : guest.status === 'confirmed'
                                ? 'Confirmado'
                                : guest.status === 'cancelled'
                                ? 'Cancelado'
                                : 'Pendiente'}
                            </Badge>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                              Acompañantes {guest.plus_ones_confirmed}/{guest.plus_ones_allowed}
                            </p>
                            <Button
                              type="button"
                              variant="success"
                              size="sm"
                              onClick={() => handleManualCheckin(guest)}
                              disabled={manualCheckinGuestId === guest.id}
                            >
                              {manualCheckinGuestId === guest.id ? 'Registrando...' : 'Check-in manual'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <aside className="space-y-6">
              <Card className="bg-slate-950 text-white">
                <CardHeader>
                  <CardDescription className="text-sky-200/70">Monitoreo rápido</CardDescription>
                  <CardTitle className="text-white">Actividad de puerta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ingresos recientes</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{recentCheckins.length}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Último refresh automático cada {LIVE_REFRESH_INTERVAL_MS / 1000}s.
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">No habilitados</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{doorMetrics.cancelledGuests}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Invitados cancelados o fuera de base activa.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardDescription>Trazabilidad</CardDescription>
                    <CardTitle>Actividad reciente</CardTitle>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={fetchRecentCheckins}>
                    Actualizar
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingRecentCheckins ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : recentCheckins.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                      Todavía no hay ingresos registrados para este evento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentCheckins.map((checkin) => (
                        <div key={checkin.id} className="rounded-[24px] border border-border/70 bg-white/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {checkin.guests?.first_name} {checkin.guests?.last_name}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(checkin.checkin_time)}</p>
                            </div>
                            <Badge variant={checkin.checkin_method === 'qr' ? 'info' : 'outline'}>
                              {checkin.checkin_method === 'qr' ? 'QR' : 'Manual'}
                            </Badge>
                          </div>
                          {checkin.notes && (
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{checkin.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardDescription>Reglas activas</CardDescription>
                  <CardTitle>Qué bloquea y qué permite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>Solo se aceptan accesos del evento actual.</p>
                  <p>El flujo principal está pensado para leer por cámara el QR que el invitado muestra en puerta.</p>
                  <p>Si el token está vencido o el invitado fue cancelado, el acceso se rechaza antes del registro.</p>
                  <p>Si el invitado ya ingresó, el sistema advierte y no habilita un nuevo acceso sin excepción supervisada.</p>
                  <p>Si el tipo o rol tiene ventana horaria, se bloquea el QR fuera de esa franja.</p>
                  <p>Solo `ya ingresado` o `fuera de horario` pueden resolverse por excepción con PIN y motivo.</p>
                  <p>Si existe `QENTRA_SECURITY_SUPERVISOR_PIN`, la excepción exige doble control.</p>
                  <p>Al validar, se marca `used_at` y se registra una fila en `checkins`.</p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className={isImmersiveMode ? 'min-h-screen bg-[linear-gradient(180deg,#0f172a_0%,#111827_16%,#f8fafc_16%,#f8fafc_100%)] px-4 py-6 sm:px-6' : 'px-4 py-6 sm:px-0'}>
      <div className={`mb-8 flex flex-col gap-4 ${isImmersiveMode ? 'rounded-[28px] border border-slate-800 bg-slate-950/95 px-6 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.34)] md:flex-row md:items-end md:justify-between' : 'border-b border-gray-200 pb-6 md:flex-row md:items-end md:justify-between'}`}>
        <div>
          {isImmersiveMode ? (
            <p className={`text-sm font-semibold uppercase tracking-[0.28em] ${isTotemMode ? 'text-amber-300' : 'text-sky-300'}`}>
              {isTotemMode ? 'Vista totem' : 'Vista puerta'}
            </p>
          ) : (
            <Link href={`/admin/events/${event.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
              ← Volver al evento
            </Link>
          )}
          <h1 className={`mt-3 text-3xl font-bold ${isImmersiveMode ? 'text-white' : 'text-gray-900'}`}>
            {isTotemMode ? `Totem · ${event.name}` : isDoorMode ? `Puerta · ${event.name}` : `Check-In de ${event.name}`}
          </h1>
          <p className={`mt-2 ${isImmersiveMode ? 'text-slate-300' : 'text-gray-600'}`}>
            {formatDateTime(buildEventDateTime(event.event_date, event.start_time))} · slug <span className="font-mono text-sm">{event.slug}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isTotemMode ? (
            <>
              <Link
                href={`/puerta/${event.id}`}
                className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
              >
                Vista puerta
              </Link>
              <Link
                href={`/admin/events/${event.id}/check-in`}
                className="inline-flex items-center rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-400/15"
              >
                Vista admin
              </Link>
            </>
          ) : isDoorMode ? (
            <>
              <Link
                href={`/admin/events/${event.id}/check-in`}
                className="inline-flex items-center rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
              >
                Vista admin
              </Link>
              <Link
                href={`/admin/events/${event.id}/guests`}
                className="inline-flex items-center rounded-md border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-400/15"
              >
                Directorio
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/puerta/${event.id}`}
                className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
              >
                Abrir vista puerta
              </Link>
              <Link
                href={`/admin/events/${event.id}/guests`}
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Ver invitados
              </Link>
              <Link
                href="/admin/events/new"
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Crear otro evento
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-sm text-slate-300">Hora de puerta</p>
          <p className="mt-2 text-3xl font-semibold">{formatClock(now)}</p>
          <p className="mt-1 text-sm text-slate-300">
            Evento {formatDateTime(buildEventDateTime(event.event_date, event.start_time))}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-800">Invitados dentro</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-950">{doorMetrics.checkedInGuests}</p>
          <p className="mt-1 text-sm text-emerald-900">
            {doorMetrics.insidePeople} personas estimadas con acompanantes
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-800">Pendientes por validar</p>
          <p className="mt-2 text-3xl font-semibold text-amber-950">{doorMetrics.pendingGuests + doorMetrics.confirmedGuests}</p>
          <p className="mt-1 text-sm text-amber-900">
            {doorMetrics.pendingGuests} pendientes y {doorMetrics.confirmedGuests} confirmados sin ingreso
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm text-blue-800">Refresh operativo</p>
          <p className="mt-2 text-3xl font-semibold text-blue-950">15s</p>
          <p className="mt-1 text-sm text-blue-900">
            {doorMetrics.cancelledGuests} cancelados y {recentCheckins.length} movimientos recientes
          </p>
        </div>
      </div>

      <div className={`grid gap-6 ${isTotemMode ? 'xl:grid-cols-1' : isDoorMode ? 'xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]' : 'xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]'}`}>
        <section className="space-y-6">
          <div className={`rounded-2xl border p-6 shadow-sm ${statusTone.shell}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusTone.badge}`}>
                  {statusTone.eyebrow}
                </span>
                <h2 className="mt-4 text-3xl font-semibold">{statusSummary.title}</h2>
                <p className="mt-2 max-w-3xl text-sm/6 opacity-90">{statusSummary.detail}</p>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${statusTone.badge}`}>
                {scannerActive ? 'Camara abierta' : 'Camara en espera'}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className={`rounded-2xl px-4 py-3 ${statusTone.badge}`}>
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">Capacidad esperada</p>
                <p className="mt-2 text-2xl font-semibold">{doorMetrics.expectedPeople}</p>
              </div>
              <div className={`rounded-2xl px-4 py-3 ${statusTone.badge}`}>
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">Por ingresar</p>
                <p className="mt-2 text-2xl font-semibold">{doorMetrics.remainingExpectedPeople}</p>
              </div>
              <div className={`rounded-2xl px-4 py-3 ${statusTone.badge}`}>
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">Base activa</p>
                <p className="mt-2 text-2xl font-semibold">{doorMetrics.activeGuests}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${isTotemMode ? 'max-w-5xl' : ''}`}>
            <div>
            <h2 className="text-lg font-semibold text-gray-900">Validar acceso</h2>
            <p className="mt-1 text-sm text-gray-600">
              Escanea con la camara el QR que el invitado exhibe en su celular, WhatsApp o email. Si hace falta, tambien puedes pegar token o `qr_data`.
            </p>
            </div>

            <div className={`mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 ${isTotemMode ? 'border-2 border-slate-900/10' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-gray-900">{isTotemMode ? 'Scanner de totem' : 'Scanner de puerta'}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {isTotemMode
                    ? 'Modo enfocado para tablet o puesto fijo de ingreso.'
                    : 'Pensado para recepcion desde celular o tablet con camara trasera.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startScanner}
                  disabled={processingCheckin}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {scannerActive ? 'Reiniciar camara' : 'Abrir camara'}
                </button>
                {scannerActive && (
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Detener
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                className={`w-full object-cover ${isTotemMode ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {!scannerSupported && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Este navegador no soporta acceso a camara para el scanner.
              </div>
            )}

            {scannerMessage && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                {scannerMessage}
              </div>
            )}
            </div>

            <form onSubmit={consumeAccess} className="mt-5 space-y-4">
            <div>
              <label htmlFor="access-input" className="block text-sm font-medium text-gray-700">
                Token o QR data
              </label>
              <textarea
                id="access-input"
                value={accessInput}
                onChange={(eventInput) => setAccessInput(eventInput.target.value)}
                rows={isTotemMode ? 5 : 8}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder='qentra_xxx o {"kind":"qentra_guest_access","token":"qentra_xxx",...}'
              />
            </div>

            <button
              type="submit"
              disabled={processingCheckin}
              className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processingCheckin ? 'Validando acceso...' : 'Registrar check-in'}
            </button>
            </form>

            {status && (
              <div
                className={`mt-5 rounded-lg border p-4 ${
                  status.kind === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : status.kind === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                <h3 className="font-semibold">{status.title}</h3>
                <p className="mt-1 text-sm">{status.detail}</p>
              </div>
            )}

            {overrideContext && !isTotemMode && (
              <div className="mt-5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-fuchsia-950">Override supervisado</h3>
                    <p className="mt-1 text-sm text-fuchsia-900">
                      Usa este flujo solo si seguridad decide permitir el acceso pese a la advertencia o restriccion.
                    </p>
                  </div>
                  <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-800">
                    {overrideContext.decisionCode === 'already_checked_in' ? 'Reingreso' : 'Fuera de horario'}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="override-pin" className="block text-sm font-medium text-fuchsia-950">
                      PIN de seguridad
                    </label>
                    <input
                      id="override-pin"
                      type="password"
                      value={overridePin}
                      onChange={(eventInput) => setOverridePin(eventInput.target.value)}
                      className="mt-1 block w-full rounded-md border border-fuchsia-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20"
                      placeholder="PIN de override"
                    />
                  </div>

                  <div>
                    <label htmlFor="override-reason" className="block text-sm font-medium text-fuchsia-950">
                      Motivo
                    </label>
                    <input
                      id="override-reason"
                      value={overrideReason}
                      onChange={(eventInput) => setOverrideReason(eventInput.target.value)}
                      className="mt-1 block w-full rounded-md border border-fuchsia-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20"
                      placeholder="Ej: validado por jefe de seguridad"
                    />
                  </div>
                </div>

                {overrideSupervisorRequired && (
                  <div className="mt-4">
                    <label htmlFor="override-supervisor-pin" className="block text-sm font-medium text-fuchsia-950">
                      PIN de supervisor
                    </label>
                    <input
                      id="override-supervisor-pin"
                      type="password"
                      value={overrideSupervisorPin}
                      onChange={(eventInput) => setOverrideSupervisorPin(eventInput.target.value)}
                      className="mt-1 block w-full rounded-md border border-fuchsia-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20"
                      placeholder="Segundo control"
                    />
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-fuchsia-200 bg-white/70 p-4 text-sm text-fuchsia-950">
                  {overridePolicyLoading
                    ? 'Cargando politica de override...'
                    : !overridePinConfigured
                    ? 'Override no configurado en este entorno. Define QENTRA_SECURITY_OVERRIDE_PIN para habilitar excepciones.'
                    : overrideSupervisorRequired
                    ? 'Este entorno exige doble control: PIN de override y PIN de supervisor.'
                    : 'Este entorno exige PIN de override y motivo operativo.'}
                </div>

                {overrideError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {overrideError}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={applySecurityOverride}
                    disabled={overrideProcessing || overridePolicyLoading || !overridePinConfigured}
                    className="inline-flex items-center rounded-md bg-fuchsia-700 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {overrideProcessing ? 'Validando override...' : 'Autorizar excepcion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideContext(null)
                      setOverridePin('')
                      setOverrideSupervisorPin('')
                      setOverrideReason('')
                      setOverrideError(null)
                    }}
                    className="inline-flex items-center rounded-md border border-fuchsia-200 bg-white px-4 py-2 text-sm font-medium text-fuchsia-800 hover:bg-fuchsia-100"
                  >
                    Cancelar override
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {!isTotemMode && (
        <aside className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Control de puerta</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Monitoreo rapido para seguridad y recepcion.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Auto refresh
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Ingresos recientes</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{recentCheckins.length}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Ultimo refresh automatico cada {LIVE_REFRESH_INTERVAL_MS / 1000}s
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">No habilitados</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{doorMetrics.cancelledGuests}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Invitados cancelados en base activa
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Busqueda manual</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Fallback operativo para recepcion cuando el invitado no presenta token o QR.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchGuestDirectory}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Actualizar
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="guest-search" className="block text-sm font-medium text-gray-700">
                Buscar por nombre, email o telefono
              </label>
              <input
                id="guest-search"
                value={guestSearchQuery}
                onChange={(eventInput) => setGuestSearchQuery(eventInput.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ej: martina, perez, +54..."
              />
            </div>

            {loadingGuestDirectory ? (
              <div className="mt-4 flex h-24 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                No hay invitados que coincidan con la busqueda.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredGuests.map((guest) => (
                  <div key={guest.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {guest.first_name} {guest.last_name}
                        </p>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          <p>{guest.email || 'Sin email'}</p>
                          <p>{guest.phone || 'Sin telefono'}</p>
                          <p>{guest.guest_types?.name || 'Sin tipo asignado'}</p>
                          <p>{formatGuestTypeAccessPolicy(guest.guest_types, event.start_time)}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        guest.status === 'checked_in'
                          ? 'bg-blue-100 text-blue-800'
                          : guest.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : guest.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {guest.status === 'checked_in'
                          ? 'Check-in'
                          : guest.status === 'confirmed'
                          ? 'Confirmado'
                          : guest.status === 'cancelled'
                          ? 'Cancelado'
                          : 'Pendiente'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-gray-500">
                        Acompanantes {guest.plus_ones_confirmed}/{guest.plus_ones_allowed}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleManualCheckin(guest)}
                        disabled={manualCheckinGuestId === guest.id}
                        className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {manualCheckinGuestId === guest.id ? 'Registrando...' : 'Check-in manual'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Reglas actuales</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p>Solo se aceptan tokens del evento actual.</p>
              <p>El flujo principal esta pensado para leer por camara el QR que el invitado muestra en puerta.</p>
              <p>Si el token esta vencido o el invitado fue cancelado, el acceso se rechaza antes del registro.</p>
              <p>Si el invitado ya ingreso, el sistema advierte y no habilita un nuevo acceso.</p>
              <p>Si el tipo o rol tiene ventana horaria, se bloquea el QR fuera de esa franja.</p>
              <p>Solo `ya ingresado` o `fuera de horario` pueden resolverse por override con PIN y motivo; `cancelado`, `vencido` o `invalido` no.</p>
              <p>Si el entorno define `QENTRA_SECURITY_SUPERVISOR_PIN`, el override exige doble control.</p>
              <p>Al validar, se marca `used_at` y se registra una fila en `checkins`.</p>
              <p>Tambien se puede operar check-in manual desde la busqueda de invitados.</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Actividad reciente</h2>
              <button
                type="button"
                onClick={fetchRecentCheckins}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Actualizar
              </button>
            </div>

            {loadingRecentCheckins ? (
              <div className="mt-4 flex h-32 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : recentCheckins.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Todavia no hay ingresos registrados para este evento.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {recentCheckins.map((checkin) => (
                  <div key={checkin.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {checkin.guests?.first_name} {checkin.guests?.last_name}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">{formatDateTime(checkin.checkin_time)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        checkin.checkin_method === 'qr'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {checkin.checkin_method === 'qr' ? 'QR' : 'Manual'}
                      </span>
                    </div>
                    {checkin.notes && (
                      <p className="mt-3 text-sm text-gray-600">{checkin.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
        )}
      </div>
    </div>
  )
}

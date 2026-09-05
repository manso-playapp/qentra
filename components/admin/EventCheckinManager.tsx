'use client'

import jsQR from 'jsqr'
import { getEventCapacity } from '@/lib/event-capacity'
import { CapacityWarning } from '@/components/door/CapacityWarning'
import { UserRound, ScanLine, Search, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck, Clock3, RefreshCw, Users2, LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { formatEventSchedule } from '@/lib/event-schedule'
import { formatGuestTypeAccessPolicy } from '@/lib/access-policy'
import { parseInvitationDetails } from '@/lib/invitation-response'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Checkin, CheckinMethod, Event, Guest, GuestType, SurfaceBranding } from '@/types'

type EventCheckinManagerProps = {
  event: Pick<Event, 'id' | 'name' | 'slug' | 'event_date' | 'start_time' | 'max_capacity' | 'guest_types'>
  branding?: SurfaceBranding | null
  mode?: 'admin' | 'door' | 'totem'
  sidebarSlot?: ReactNode
}

type AccessPayload = {
  token: string
  source: CheckinMethod
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
  guests?: (Pick<Guest, 'first_name' | 'last_name' | 'status' | 'photo_url' | 'table_assignment' | 'plus_ones_confirmed' | 'companion_names'> & {
    notes?: string | null
  }) | null
}

type TotemSpotlight = {
  id: string
  fullName: string
  checkinTime: string
  photoUrl?: string | null
  tableAssignment?: string | null
}

type OverrideableAccessCode = 'already_checked_in' | 'outside_window'

type OverrideContext = {
  token?: string
  guestId?: string
  source: CheckinMethod
  decisionCode: OverrideableAccessCode
}

// Respuesta del endpoint de check-in del servidor.
type CheckinResult = {
  outcome: 'registered' | 'blocked'
  kind: 'success' | 'warning' | 'error'
  title: string
  detail: string
  guest?: { first_name: string; last_name: string }
  overrideable?: boolean
  decisionCode?: string
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
  | 'plus_ones_confirmed'
  | 'companion_names'
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

// Realtime entrega los check-ins al instante. Este polling solo cubre cortes de
// Realtime, por eso no debe competir con la operacion normal de la puerta.
const LIVE_REFRESH_INTERVAL_MS = 30000
const CAPACITY_REFRESH_INTERVAL_MS = 5000
const TOTEM_REFRESH_INTERVAL_MS = 15000
const REALTIME_REFRESH_DEBOUNCE_MS = 300


const STATUS_TONE_STYLES = {
  idle: {
    shell: 'border-slate-200 bg-slate-900 text-white',
    badge: 'bg-white/10 text-slate-100',
    eyebrow: 'Control de acceso',
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
    timeZone: 'America/Argentina/Cordoba',
    hourCycle: 'h23',
  }).format(parsedDate)
}

function formatClock(date: Date) {
  // 24h explicito (formato "22:00") para que el totem no dependa del locale.
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Argentina/Cordoba',
  }).format(date)
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
  sidebarSlot,
}: EventCheckinManagerProps) {
  const isDoorMode = mode === 'door'
  const isTotemMode = mode === 'totem'
  const isImmersiveMode = isDoorMode || isTotemMode
  const totemSpotlightDurationMs = Math.min(Math.max(branding?.return_to_idle_seconds ?? 6, 2), 30) * 1000
  const [accessInput, setAccessInput] = useState('')
  const [guestSearchQuery, setGuestSearchQuery] = useState('')
  const [feedError, setFeedError] = useState<string | null>(null)
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const [feedUpdatedAt, setFeedUpdatedAt] = useState<Date | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<CheckinWithGuest[]>([])
  // Aforo en vivo: total de ingresos aprobados del evento (no solo los 10 del feed).
  const [approvedCount, setApprovedCount] = useState<number | null>(null)
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
  const [now, setNow] = useState<Date | null>(null)
  const [totemSpotlight, setTotemSpotlight] = useState<TotemSpotlight | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recentCheckinsRequestRef = useRef<Promise<void> | null>(null)
  const guestDirectoryRequestRef = useRef<Promise<void> | null>(null)
  const realtimeRefreshTimeoutRef = useRef<number | null>(null)
  const lastTotemCheckinIdRef = useRef<string | null>(null)
  const totemBaselineInitializedRef = useRef(false)
  const initialCheckinLoadDoneRef = useRef(false)
  const spotlightTimeoutRef = useRef<number | null>(null)

  const fetchRecentCheckins = useCallback(() => {
    // Si la base esta lenta, reutilizamos el pedido en curso en vez de abrir
    // otra conexion y formar una cola de requests.
    if (recentCheckinsRequestRef.current) {
      return recentCheckinsRequestRef.current
    }

    const request = (async () => {
      try {
        setLoadingRecentCheckins(true)
        // Via endpoint servidor (service role): RLS oculta guests al cliente anonimo,
        // asi que el join desde el navegador devolvia nombre y foto vacios.
        const response = await fetch(`/api/events/${event.id}/checkin-feed`)
        const payload = (await response.json().catch(() => null)) as
          | { data?: CheckinWithGuest[]; approvedCount?: number; error?: string }
          | null

        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudo cargar la actividad.')
        }

        setFeedError(null)
        setFeedUpdatedAt(new Date())
        setRecentCheckins(payload?.data ?? [])
        setApprovedCount(typeof payload?.approvedCount === 'number' ? payload.approvedCount : null)
        // Marca que el primer fetch resolvio, para que el spotlight del totem
        // distinga "lista vacia inicial" de "todavia no cargamos".
        initialCheckinLoadDoneRef.current = true
      } catch (error) {
        setApprovedCount(null)
        setFeedError(getErrorMessage(error))
        if (isImmersiveMode) setStatus({
          kind: 'error',
          title: 'No se pudo cargar la actividad',
          detail: getErrorMessage(error),
        })
      } finally {
        setLoadingRecentCheckins(false)
      }
    })()

    recentCheckinsRequestRef.current = request
    void request.finally(() => {
      if (recentCheckinsRequestRef.current === request) {
        recentCheckinsRequestRef.current = null
      }
    })

    return request
  }, [event.id, isImmersiveMode])

  useEffect(() => {
    fetchRecentCheckins()
  }, [fetchRecentCheckins])

  const fetchGuestDirectory = useCallback(() => {
    if (guestDirectoryRequestRef.current) {
      return guestDirectoryRequestRef.current
    }

    const request = (async () => {
      try {
        setLoadingGuestDirectory(true)
        // Via endpoint servidor (service role): RLS oculta guests al cliente.
        const response = await fetch(`/api/guests?eventId=${event.id}`)
        const payload = (await response.json().catch(() => null)) as
          | { data?: SearchableGuestRow[]; error?: string }
          | null

        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudo cargar el directorio.')
        }

        const sorted = (payload?.data ?? []).sort((a, b) =>
          `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
        )
        setDirectoryError(null)
        setGuestDirectory(sorted.map(normalizeSearchableGuest))
      } catch (error) {
        setDirectoryError(getErrorMessage(error))
        if (isImmersiveMode) setStatus({
          kind: 'error',
          title: 'No se pudo cargar el directorio',
          detail: getErrorMessage(error),
        })
      } finally {
        setLoadingGuestDirectory(false)
      }
    })()

    guestDirectoryRequestRef.current = request
    void request.finally(() => {
      if (guestDirectoryRequestRef.current === request) {
        guestDirectoryRequestRef.current = null
      }
    })

    return request
  }, [event.id, isImmersiveMode])

  useEffect(() => {
    // El totem no muestra ni usa el directorio completo de invitados.
    // Evitamos descargarlo para que la pantalla de celebracion sea liviana.
    if (!isTotemMode) {
      void fetchGuestDirectory()
    }
  }, [fetchGuestDirectory, isTotemMode])

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      void fetchRecentCheckins()
    }, isTotemMode ? TOTEM_REFRESH_INTERVAL_MS : CAPACITY_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(refreshTimer)
    }
  }, [fetchRecentCheckins, isTotemMode])

  // Realtime: el totem muestra el spotlight en el instante en que la puerta
  // acredita a alguien, sin esperar al proximo poll. El intervalo de arriba
  // queda como respaldo por si Realtime no esta habilitado en la tabla checkins.
  useEffect(() => {
    if (!isTotemMode) {
      return
    }

    const channel = supabase
      .channel(`totem-checkins-${event.id}`)
      .on('broadcast', { event: 'checkin' }, () => {
        if (realtimeRefreshTimeoutRef.current !== null) {
          window.clearTimeout(realtimeRefreshTimeoutRef.current)
        }

        realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
          realtimeRefreshTimeoutRef.current = null
          void fetchRecentCheckins()
        }, 0)
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checkins', filter: `event_id=eq.${event.id}` },
        () => {
          if (realtimeRefreshTimeoutRef.current !== null) {
            window.clearTimeout(realtimeRefreshTimeoutRef.current)
          }

          realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
            realtimeRefreshTimeoutRef.current = null
            void fetchRecentCheckins()
          }, REALTIME_REFRESH_DEBOUNCE_MS)
        }
      )
      .subscribe()

    return () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current)
        realtimeRefreshTimeoutRef.current = null
      }
      void supabase.removeChannel(channel)
    }
  }, [isTotemMode, event.id, fetchRecentCheckins])

  useEffect(() => {
    const updateClock = () => {
      setNow(new Date())
    }
    const initialClockTimer = window.setTimeout(updateClock, 0)
    const clockTimer = window.setInterval(updateClock, isTotemMode ? 1000 : 30000)

    return () => {
      window.clearTimeout(initialClockTimer)
      window.clearInterval(clockTimer)
    }
  }, [event.id, isTotemMode])

  useEffect(() => {
    if (!isTotemMode) {
      return
    }

    // Esperar a que el primer fetch resuelva antes de fijar la baseline. Si
    // arrancamos con la lista vacia (evento sin ingresos aun), el primer
    // check-in real tiene que anunciarse, no consumirse como estado inicial.
    if (!initialCheckinLoadDoneRef.current) {
      return
    }

    const latestCheckinId = recentCheckins[0]?.id ?? null

    if (!totemBaselineInitializedRef.current) {
      totemBaselineInitializedRef.current = true
      lastTotemCheckinIdRef.current = latestCheckinId
      return
    }

    if (!latestCheckinId || latestCheckinId === lastTotemCheckinIdRef.current) {
      return
    }

    const latestCheckin = recentCheckins[0]
    lastTotemCheckinIdRef.current = latestCheckin.id
    setTotemSpotlight({
      id: latestCheckin.id,
      fullName: `${latestCheckin.guests?.first_name || ''} ${latestCheckin.guests?.last_name || ''}`.trim() || 'Invitado autorizado',
      checkinTime: latestCheckin.checked_in_at,
      photoUrl: latestCheckin.guests?.photo_url ?? null,
      tableAssignment:
        latestCheckin.guests?.table_assignment?.trim() ||
        parseInvitationDetails(latestCheckin.guests?.notes).tableAssignment ||
        null,
    })

    if (spotlightTimeoutRef.current !== null) {
      window.clearTimeout(spotlightTimeoutRef.current)
    }

    spotlightTimeoutRef.current = window.setTimeout(() => {
      setTotemSpotlight(null)
      spotlightTimeoutRef.current = null
    }, totemSpotlightDurationMs)
  }, [isTotemMode, recentCheckins, totemSpotlightDurationMs])

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
        const response = await fetch(`/api/security/override?eventId=${encodeURIComponent(event.id)}`, {
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
  }, [event.id, isTotemMode])

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

    if (!normalizedQuery) return []

    return guestDirectory.filter((guest) => {
      const haystack = [
        guest.first_name,
        guest.last_name,
        guest.email ?? '',
        guest.phone ?? '',
        ...(!isImmersiveMode ? guest.companion_names ?? [] : []),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    }).slice(0, 12)
  }, [guestDirectory, guestSearchQuery, isImmersiveMode])

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

  // Aforo en vivo: ingresados (check-ins aprobados) contra el cupo del evento.
  const aforo = getEventCapacity(event.max_capacity, approvedCount)

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

    if (!isDoorMode && !isTotemMode) {
      return {
        kind: 'success' as const,
        title: 'Monitoreo activo',
        detail: 'Los ingresos se escanean desde Modo puerta. Este panel concentra actividad, búsqueda y excepciones.',
      }
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
      detail: 'Escanea o pega un acceso. La puerta verifica pago, cupo, duplicados, horario y vigencia. El ingreso no espera al recibidor.',
    }
  }, [isDoorMode, isTotemMode, processingCheckin, scannerActive, status])

  // Valida y registra el check-in en el servidor (service role). El cliente ya
  // no lee/escribe invitation_tokens, guests ni checkins: RLS se lo bloqueaba.
  const submitCheckin = useCallback(async (params: {
    token?: string
    guestId?: string
    source: CheckinMethod
    override?: { code: OverrideableAccessCode; reason: string; pin: string; supervisorPin?: string }
  }) => {
    const response = await fetch(`/api/events/${event.id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: params.token,
        guestId: params.guestId,
        method: params.source,
        override: params.override,
      }),
    })

    const payload = (await response.json().catch(() => null)) as
      | { data?: CheckinResult; error?: string }
      | null

    if (!response.ok || !payload?.data) {
      throw new Error(payload?.error || 'No se pudo validar el acceso.')
    }

    const result = payload.data

    if (result.outcome === 'registered') {
      setOverrideContext(null)
      setOverrideError(null)
      setOverridePin('')
      setOverrideSupervisorPin('')
      setOverrideReason('')
      setStatus({ kind: 'success', title: result.title, detail: result.detail })
      await Promise.all([fetchRecentCheckins(), fetchGuestDirectory()])
      return
    }

    setStatus({ kind: result.kind, title: result.title, detail: result.detail })

    if (result.overrideable && result.decisionCode && !isTotemMode) {
      setOverrideContext({
        token: params.token,
        guestId: params.guestId,
        source: params.source,
        decisionCode: result.decisionCode as OverrideableAccessCode,
      })
    } else {
      setOverrideContext(null)
    }
  }, [event.id, fetchGuestDirectory, fetchRecentCheckins, isTotemMode])

  const processAccessString = useCallback(async (rawValue: string) => {
    const payload = parseAccessInput(rawValue)
    await submitCheckin({ token: payload.token, source: payload.source })
  }, [submitCheckin])

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
      await submitCheckin({ guestId: guest.id, source: 'manual' })
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
      await submitCheckin({
        token: overrideContext.token,
        guestId: overrideContext.guestId,
        source: overrideContext.source,
        override: {
          code: overrideContext.decisionCode,
          reason: overrideReason.trim(),
          pin: overridePin.trim(),
          supervisorPin: overrideSupervisorRequired ? overrideSupervisorPin.trim() : undefined,
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
    const approvedMessage = branding?.approved_message || 'Bienvenida habilitada'
    const welcomeMessage = branding?.welcome_message || `Bienvenidos a ${event.name}`
    const totemBackground = branding?.background_image_url || '/portada.jpg'
    const totemLogo = branding?.logo_url || '/alista-logo-white.svg'
    return (
      <div className="fixed inset-0 overflow-hidden bg-slate-950">
        <main
          className="absolute left-1/2 top-1/2 h-[100vw] w-[100vh] -translate-x-1/2 -translate-y-1/2 -rotate-90 overflow-hidden text-white"
          style={{
            background: totemSpotlight
              ? `linear-gradient(rgba(4, 9, 18, 0.42), rgba(4, 9, 18, 0.64)), url(${totemBackground}) center/cover no-repeat`
              : `url(${totemBackground}) center/cover no-repeat`,
          }}
        >
          <div className="mx-auto grid min-h-full max-w-270 grid-rows-[auto_auto_1fr_auto] gap-8 px-6 py-6 sm:px-10">
            <header className="grid grid-cols-2 items-start gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.34em] text-white/65">Fecha del evento</p>
                <p className="mt-3 text-4xl font-semibold capitalize text-white">{formatEventSchedule(event, event.guest_types ?? [], { compact: true })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm uppercase tracking-[0.34em] text-white/65">Hora actual</p>
                <p className="mt-3 text-4xl font-semibold leading-none tabular-nums text-white">{now ? formatClock(now) : '--:--'}</p>
              </div>
            </header>
            <div className="flex min-h-16 items-center justify-center">
              {totemLogo ? (
                // El logo del totem sigue la misma posición que la invitación Night:
                // debajo de los datos principales del evento.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={totemLogo} alt="Alista" className="mx-auto h-auto w-[760px] max-w-full object-contain drop-shadow-lg" />
              ) : null}
            </div>

            <section className="flex min-h-0 items-center justify-center">
              {totemSpotlight && (
              <div className="flex w-full max-w-230 flex-col items-center justify-center rounded-[42px] border border-white/10 bg-black/28 px-8 py-10 text-center shadow-[0_35px_120px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                <p className="text-sm uppercase tracking-[0.34em] text-emerald-200/90">{approvedMessage}</p>
                <div
                  className="mt-8 flex h-[38vh] max-h-95 min-h-60 w-[38vh] max-w-95 min-w-60 items-center justify-center overflow-hidden rounded-[36px] border border-white/14 text-8xl font-semibold text-white shadow-[0_0_90px_rgba(16,185,129,0.18)]"
                  style={{ background: `linear-gradient(145deg, ${totemAccent}55, rgba(255,255,255,0.08))` }}
                >
                  {totemSpotlight.photoUrl ? (
                    // Foto del invitado (URL firmada de guest-photos), fuera del config de next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={totemSpotlight.photoUrl}
                      alt={totemSpotlight.fullName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-32 text-white/85" strokeWidth={1.25} aria-label="Invitado sin foto" />
                  )}
                </div>
                <h2 className="admin-heading mt-8 text-6xl leading-none text-white sm:text-7xl">
                  {totemSpotlight.fullName}
                </h2>
                <p className="mt-5 text-2xl leading-8 text-white/80">
                  Acceso validado a las {formatClock(new Date(totemSpotlight.checkinTime))}
                </p>
                {totemSpotlight.tableAssignment && (
                  <div className="mt-7 rounded-2xl border border-sky-300/30 bg-sky-300/12 px-7 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-100/80">Tu destino</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{totemSpotlight.tableAssignment}</p>
                  </div>
                )}
                </div>
              )}
              {!totemSpotlight && (
                <div className="w-full max-w-230 rounded-[42px] border border-white/10 bg-black/24 px-10 py-14 text-center shadow-[0_35px_120px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                  <p className="text-xl uppercase tracking-[0.34em] text-white/70">Bienvenidos</p>
                  <h1 className="admin-heading mt-7 text-6xl leading-none text-white sm:text-8xl">{welcomeMessage}</h1>
                  <p className="mt-8 text-2xl text-white/75">Acercá tu QR para validar tu ingreso</p>
                </div>
              )}
            </section>

            <footer className="flex flex-col items-center gap-4 text-center">
              {totemSpotlight && (
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-5 py-2 text-sm text-white/70">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Ingreso registrado correctamente
                </div>
              )}
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Alista · control de acceso</p>
            </footer>
          </div>
        </main>
      </div>
    )
  }

  if (isDoorMode) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_24%),linear-gradient(180deg,#09111b_0%,#101b2a_28%,#eef3f7_28%,#eef3f7_100%)] px-4 py-5 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-400 space-y-6">
          <section className="rounded-[34px] border border-slate-800 bg-slate-950/96 px-6 py-6 text-white shadow-[0_28px_90px_rgba(2,8,23,0.42)]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.34em] text-sky-300">Control de ingreso</p>
                <h1 className="admin-heading mt-4 text-5xl leading-none text-white">Control de acceso</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                  Superficie táctica para seguridad y recepción. Prioriza lectura rápida, validación inmediata y excepciones supervisadas sin contaminar la pantalla pública.
                </p>
              </div>

              <div className="grid w-full gap-4 sm:grid-cols-[minmax(0,1fr)_auto] xl:max-w-125">
                <div className="rounded-[26px] border border-white/10 bg-white/6 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Evento</p>
                  <p className="mt-2 truncate text-2xl font-semibold text-white" title={event.name}>{event.name}</p>
                  <p className="mt-2 text-sm text-slate-300">{formatEventSchedule(event, event.guest_types ?? [], { compact: true })}</p>
                </div>
                <div className="rounded-[26px] border border-sky-400/20 bg-sky-400/10 px-5 py-4 text-right">
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">Hora actual</p>
                  <p className="mt-2 text-5xl font-semibold leading-none text-white">{now ? formatClock(now) : '--:--'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:ml-auto xl:max-w-125">
              <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link href={`/admin/events/${event.id}/check-in`}>Panel operativo</Link>
              </Button>
              <Button asChild variant="outline" className="border-sky-400/20 bg-sky-400/10 text-sky-100 hover:bg-sky-400/15 hover:text-white">
                <Link href={`/admin/events/${event.id}/guests`}>Invitados</Link>
              </Button>
              <Button asChild variant="outline" className="border-amber-400/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15 hover:text-white">
                <Link href={`/t/${event.slug}`}>Ver pantalla publica</Link>
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
              <CapacityWarning capacity={event.max_capacity} admitted={approvedCount} />
              <div className={`rounded-4xl border p-6 shadow-[0_18px_70px_rgba(15,23,42,0.12)] ${statusTone.shell}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${statusTone.badge}`}>
                      {statusTone.eyebrow}
                    </span>
                    <h2 className="mt-4 text-4xl font-semibold">{statusSummary.title}</h2>
                    <p className="mt-3 max-w-3xl text-base leading-7 opacity-90">{statusSummary.detail}</p>
                  </div>
                  <div className={`rounded-3xl px-4 py-3 text-sm font-medium ${statusTone.badge}`}>
                    {scannerActive ? 'Cámara activa' : 'Cámara en espera'}
                  </div>
                </div>

                <div className={`mt-5 grid gap-3 ${aforo.hasLimit ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                  <div className={`rounded-3xl px-4 py-3 ${statusTone.badge}`}>
                    <p className="text-xs uppercase tracking-[0.18em] opacity-80">Base activa</p>
                    <p className="mt-2 text-2xl font-semibold">{doorMetrics.activeGuests}</p>
                  </div>
                  <div className={`rounded-3xl px-4 py-3 ${statusTone.badge}`}>
                    <p className="text-xs uppercase tracking-[0.18em] opacity-80">Por ingresar</p>
                    <p className="mt-2 text-2xl font-semibold">{doorMetrics.remainingExpectedPeople}</p>
                  </div>
                  {aforo.hasLimit && (
                    <div
                      className={`rounded-3xl px-4 py-3 ${
                        aforo.full ? 'bg-rose-100 text-rose-950' : aforo.low ? 'bg-amber-100 text-amber-950' : statusTone.badge
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.18em] opacity-80">
                        {aforo.full ? 'Cupo completo' : aforo.low ? 'Últimos lugares' : 'Aforo'}
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {aforo.known ? aforo.occupancy : '—'}
                        <span className="text-base opacity-70"> / {aforo.capacity}</span>
                      </p>
                    </div>
                  )}
                  <div className={`rounded-3xl px-4 py-3 ${statusTone.badge}`}>
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
                      Flujo principal de acceso. Lee el QR que el invitado muestra en su celular y valida duplicados, horario y vigencia antes del ingreso.
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
                      className="aspect-16/10 w-full object-cover"
                    />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  {!scannerSupported && (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Este navegador no soporta acceso a cámara para el scanner.
                    </div>
                  )}

                  {scannerMessage && (
                    <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
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
                      placeholder='alista_xxx o {"kind":"alista_guest_access","token":"alista_xxx",...}'
                    />
                    <Button type="submit" className="w-full" disabled={processingCheckin}>
                      {processingCheckin ? 'Validando acceso...' : 'Validar acceso manual'}
                    </Button>
                  </form>

                  {status && (
                    <div
                      className={`rounded-3xl border p-4 ${
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
                          ? 'La excepción de seguridad todavía no está habilitada. Contactá al responsable de Alista.'
                          : overrideSupervisorRequired
                          ? 'Esta acción exige un segundo control de supervisor.'
                          : 'Esta acción exige un PIN y un motivo operativo.'}
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
                      Busqueda manual por nombre, email o telefono cuando el invitado no presenta QR o la camara falla.
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
                    <div className="mt-4 rounded-3xl border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                      No hay invitados que coincidan con la búsqueda.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {filteredGuests.map((guest) => (
                        <div key={guest.id} className="rounded-3xl border border-border/70 bg-white/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {guest.first_name} {guest.last_name}
                              </p>
                              <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                                <p>{guest.email || 'Sin email'}</p>
                                <p>{guest.phone || 'Sin teléfono'}</p>
                                <p>{guest.guest_types?.name || 'Sin tipo asignado'}</p>
                                <p>{formatGuestTypeAccessPolicy(guest.guest_types, event.start_time, event.event_date)}</p>
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
                  <CardTitle className="text-white">Actividad de acceso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {aforo.hasLimit ? (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Aforo</p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                          {aforo.known ? aforo.occupancy : '—'}
                          <span className="text-xl text-slate-400"> / {aforo.capacity}</span>
                        </p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full ${aforo.full ? 'bg-rose-400' : aforo.low ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${aforo.pct}%` }}
                          />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {!aforo.known ? 'Actualizando disponibilidad…'
                            : aforo.message ?? `${aforo.spotsLeft} lugares libres.`}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ingresados</p>
                        <p className="mt-3 text-3xl font-semibold text-white">
                          {aforo.known ? aforo.occupancy : recentCheckins.length}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          Sin cupo declarado para este evento.
                        </p>
                      </div>
                    )}
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
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
                    <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                      Todavía no hay ingresos registrados para este evento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentCheckins.map((checkin) => (
                        <div key={checkin.id} className="rounded-3xl border border-border/70 bg-white/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {checkin.guests?.first_name} {checkin.guests?.last_name}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(checkin.checked_in_at)}</p>
                            </div>
                            <Badge variant={checkin.device_name === 'qr' ? 'info' : 'outline'}>
                              {checkin.device_name === 'qr' ? 'QR' : 'Manual'}
                            </Badge>
                          </div>
                          {checkin.reason && (
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{checkin.reason}</p>
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
                  <p>El flujo principal esta pensado para leer por camara el QR que el invitado muestra al ingresar.</p>
                  <p>Si el token está vencido o el invitado fue cancelado, el acceso se rechaza antes del registro.</p>
                  <p>Si el invitado ya ingresó, el sistema advierte y no habilita un nuevo acceso sin excepción supervisada.</p>
                  <p>Si el tipo o rol tiene ventana horaria, se bloquea el QR fuera de esa franja.</p>
                  <p>Solo `ya ingresado` o `fuera de horario` pueden resolverse por excepción con PIN y motivo.</p>
                  <p>Si existe `ALISTA_SECURITY_SUPERVISOR_PIN`, la excepción exige doble control.</p>
                  <p>Al validar, se marca `used_at` y se registra una fila en `checkins`.</p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    )
  }

  const validating = processingCheckin || manualCheckinGuestId !== null || overrideProcessing

  return (
    <div className="px-1 py-3 sm:px-0 lg:py-7" data-testid="checkin-admin">
      <header className="mb-5">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <Link href={`/admin/events/${event.id}`} className="font-medium text-primary hover:underline">← Volver al evento</Link>
          <span className="inline-flex items-center gap-1.5 tabular-nums"><Clock3 className="size-3.5" aria-hidden="true" />{now ? formatClock(now) : '--:--'}</span>
        </div>
        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Recepción del evento</p>
            <h1 className="admin-heading mt-1 break-words text-3xl text-admin-navy sm:text-4xl">Check-In · {event.name}</h1>
            <p className="mt-2 hidden text-xs leading-5 text-muted-foreground sm:block">{formatEventSchedule(event, event.guest_types ?? [])}</p>
          </div>
          <Button asChild className="min-h-12 shrink-0 sm:min-h-11"><Link href={`/puerta/${event.id}`}><ScanLine className="size-5" /> Abrir escáner QR <ArrowUpRight className="size-4" /></Link></Button>
        </div>
      </header>

      <section aria-label="Ingresos y capacidad" className="mb-5 rounded-2xl border border-border/70 bg-white p-4 sm:p-5">
        <div className="grid grid-cols-2 items-start gap-4 sm:grid-cols-[1fr_1fr_1.3fr]">
          <div><p className="text-xs text-muted-foreground">Personas ingresadas</p><p className="admin-heading mt-1 text-3xl tabular-nums text-admin-navy">{aforo.known ? aforo.occupancy : '—'}</p><p className="mt-1 text-[11px] text-muted-foreground">Incluye acompañantes</p></div>
          <div><p className="text-xs text-muted-foreground">Lugares disponibles</p><p className={`admin-heading mt-1 text-3xl tabular-nums ${aforo.full ? 'text-rose-700' : aforo.low ? 'text-amber-700' : 'text-admin-navy'}`}>{aforo.spotsLeft ?? '—'}</p><p className="mt-1 text-[11px] text-muted-foreground">{aforo.hasLimit ? `Capacidad: ${aforo.capacity} personas` : 'Sin límite configurado'}</p></div>
          <div className="col-span-2 min-w-0 sm:col-span-1">
            {aforo.hasLimit && aforo.known ? <div role="progressbar" aria-label="Capacidad utilizada" aria-valuenow={aforo.occupancy} aria-valuemax={Math.max(aforo.capacity, aforo.occupancy)} aria-valuemin={0} aria-valuetext={`${aforo.occupancy} personas ingresadas de ${aforo.capacity}`} className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div style={{width:`${aforo.pct}%`}} className={`h-full rounded-full ${aforo.full ? 'bg-rose-500' : aforo.low ? 'bg-amber-500' : 'bg-admin-navy'}`} /></div> : null}
            <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-5 text-muted-foreground"><RefreshCw className="size-3 shrink-0" aria-hidden="true" />{feedError ? 'Sin actualización de ingresos' : feedUpdatedAt ? `Última consulta ${formatClock(feedUpdatedAt)} · cada 5 s` : 'Consultando ingresos…'}</p>
            <p className="mt-1 hidden text-[11px] leading-5 text-muted-foreground sm:block">Ingresos acumulados. No se registran salidas.</p>
          </div>
        </div>
        <div className="mt-3 empty:hidden"><CapacityWarning capacity={event.max_capacity} admitted={approvedCount} /></div>
        {feedError ? <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">No se pudieron actualizar los ingresos. El cupo no está disponible; se reintentará automáticamente.</p> : null}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-4" aria-label="Validar invitados">
          <div role="status" aria-live="polite" aria-atomic="true" className={`sticky top-2 z-20 rounded-2xl border p-4 shadow-sm sm:p-5 ${validating ? 'border-sky-200 bg-sky-50 text-sky-950' : status?.kind === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : status?.kind === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-950' : status?.kind === 'error' ? 'border-rose-300 bg-rose-50 text-rose-950' : 'border-border/70 bg-white text-foreground'}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0" aria-hidden="true">{validating ? <LoaderCircle className="size-6 animate-spin" /> : status?.kind === 'success' ? <CheckCircle2 className="size-6 text-emerald-600" /> : status ? <AlertTriangle className="size-6" /> : <ShieldCheck className="size-6 text-primary" />}</span>
              <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] opacity-65">{validating ? 'Esperá el resultado' : status ? 'Última validación en este equipo' : 'Control de ingreso'}</p><h2 className="mt-1 text-lg font-semibold leading-6">{validating ? 'Validando ingreso…' : status?.title ?? 'Buscá y validá al invitado'}</h2><p className="mt-1 text-sm leading-5 opacity-85">{validating ? 'Todavía no habilites el paso.' : status?.detail ?? 'Sin QR, encontrá su grupo en la lista. El sistema verifica si puede ingresar.'}</p></div>
            </div>
          </div>

          <section className="rounded-2xl border border-border/70 bg-white p-4 sm:p-5" aria-labelledby="guest-search-heading">
            <div className="flex items-center justify-between gap-3"><h2 id="guest-search-heading" className="admin-heading text-xl text-foreground">Buscar invitado</h2><Button type="button" variant="ghost" size="sm" onClick={fetchGuestDirectory} disabled={loadingGuestDirectory} aria-label="Actualizar lista de invitados"><RefreshCw className={`size-4 ${loadingGuestDirectory ? 'animate-spin' : ''}`} /></Button></div>
            <label htmlFor="guest-search" className="mt-3 block text-xs text-muted-foreground">Titular, acompañante, teléfono o email</label>
            <div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" /><Input id="guest-search" type="search" autoComplete="off" value={guestSearchQuery} onChange={(eventInput) => setGuestSearchQuery(eventInput.target.value)} className="min-h-12 pl-9 text-base" placeholder="Escribí un nombre…" /></div>
            {directoryError ? <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No se pudo actualizar la lista. {guestDirectory.length ? 'Se muestran los últimos datos disponibles.' : 'Usá Actualizar lista de invitados para reintentar.'}</p> : null}
            {loadingGuestDirectory && guestDirectory.length === 0 ? <p role="status" className="py-8 text-center text-sm text-muted-foreground">Cargando invitados…</p> : !guestSearchQuery.trim() ? <div className="py-8 text-center"><Users2 className="mx-auto mb-3 size-7 text-slate-300" aria-hidden="true" /><p className="text-sm text-muted-foreground">Encontrá al invitado sin recorrer toda la lista.</p></div> : filteredGuests.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No encontramos coincidencias. Probá con otro nombre o teléfono.</p> : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">{filteredGuests.length === 12 ? 'Mostrando hasta 12 coincidencias. Afiná la búsqueda si hace falta.' : `${filteredGuests.length} ${filteredGuests.length === 1 ? 'grupo encontrado' : 'grupos encontrados'}`}</p>
                {filteredGuests.map((guest) => <article key={guest.id} className="rounded-xl border border-border/70 p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words text-base font-semibold text-foreground">{guest.first_name} {guest.last_name}</h3><Badge variant={guest.status === 'checked_in' ? 'info' : guest.status === 'confirmed' ? 'success' : guest.status === 'cancelled' ? 'outline' : 'warning'}>{guest.status === 'checked_in' ? 'Ya ingresó' : guest.status === 'confirmed' ? 'Confirmado' : guest.status === 'cancelled' ? 'No habilitado' : 'Pendiente'}</Badge></div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{guest.guest_types?.name || 'Sin tipo de acceso'} · {1 + (guest.plus_ones_confirmed ?? 0)} {(guest.plus_ones_confirmed ?? 0) > 0 ? 'personas en el grupo' : 'persona'}</p>
                  {guest.companion_names?.length ? <p className="mt-1 text-xs leading-5 text-muted-foreground">Acompañantes: {guest.companion_names.join(', ')}</p> : null}
                  {guest.guest_types ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{formatGuestTypeAccessPolicy(guest.guest_types, event.start_time, event.event_date)}</p> : null}
                  <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between"><p className="min-w-0 break-words text-xs text-muted-foreground">{guest.phone || guest.email || 'Sin contacto cargado'}</p><Button type="button" variant={guest.status === 'checked_in' || guest.status === 'cancelled' ? 'outline' : 'default'} className="min-h-11 shrink-0" onClick={() => handleManualCheckin(guest)} disabled={validating} aria-label={`Validar ingreso de ${guest.first_name} ${guest.last_name}`}>{manualCheckinGuestId === guest.id ? 'Validando…' : 'Validar ingreso'}</Button></div>
                </article>)}
                <p className="text-xs leading-5 text-muted-foreground">Validar registra el ingreso si cumple las condiciones. Confirmado no significa pago aprobado.</p>
              </div>
            )}
          </section>

            {overrideContext && (
              <div className="mt-5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-fuchsia-950">Excepción supervisada</h3>
                    <p className="mt-1 text-sm text-fuchsia-900">
                      Sólo la persona responsable puede resolver esta excepción con PIN y motivo.
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
                    ? 'Cargando política de excepción...'
                    : !overridePinConfigured
                          ? 'La excepción de seguridad todavía no está habilitada. Contactá al responsable de Alista.'
                    : overrideSupervisorRequired
                    ? 'Esta acción exige un segundo control de supervisor.'
                    : 'Esta acción exige un PIN y un motivo operativo.'}
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
                    {overrideProcessing ? 'Validando excepción...' : 'Autorizar excepción'}
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
                    Cancelar excepción
                  </button>
                </div>
              </div>
            )}

          <details className="rounded-2xl border border-border/70 bg-white p-4 sm:p-5">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">Validar un código manualmente</summary>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Usá esta alternativa si tenés el código de acceso copiado y no podés escanearlo.</p>
            <form onSubmit={consumeAccess} className="mt-4 space-y-3"><label htmlFor="access-input" className="block text-xs font-medium text-foreground">Código de acceso</label><Textarea id="access-input" value={accessInput} onChange={(eventInput) => setAccessInput(eventInput.target.value)} rows={3} className="text-base" placeholder="Pegá aquí el código de la invitación" /><Button type="submit" className="min-h-11 w-full" disabled={validating || !accessInput.trim()}>{processingCheckin ? 'Validando…' : 'Validar código'}</Button></form>
          </details>
        </section>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-border/70 bg-white p-4 sm:p-5" aria-labelledby="recent-checkins-heading">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Todos los puestos</p><h2 id="recent-checkins-heading" className="admin-heading mt-1 text-xl text-foreground">Últimos ingresos</h2></div><Button type="button" variant="ghost" size="sm" onClick={fetchRecentCheckins} disabled={loadingRecentCheckins} aria-label="Actualizar últimos ingresos"><RefreshCw className={`size-4 ${loadingRecentCheckins ? 'animate-spin' : ''}`} /></Button></div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Hasta 10 registros aprobados, del más reciente al anterior.</p>
            {feedError && recentCheckins.length > 0 ? <p className="mt-3 text-xs font-medium text-amber-800">Estos registros pueden estar desactualizados.</p> : null}
            {loadingRecentCheckins && !feedUpdatedAt ? <p className="py-8 text-center text-sm text-muted-foreground">Cargando actividad…</p> : recentCheckins.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{feedError ? 'La actividad no está disponible en este momento.' : 'Todavía no hay ingresos registrados.'}</p> : (
              <ol className="mt-4 divide-y divide-border/60">
                {recentCheckins.map((checkin) => <li key={checkin.id} className="flex items-start gap-3 py-3.5">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-foreground">{checkin.guests ? `${checkin.guests.first_name} ${checkin.guests.last_name}` : 'Invitado registrado'}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{formatDateTime(checkin.checked_in_at)} · {checkin.device_name === 'qr' ? 'QR' : 'Manual'}</p>{checkin.guests?.table_assignment ? <p className="mt-1 text-xs font-medium text-primary">Mesa: {checkin.guests.table_assignment}</p> : null}{checkin.reason ? <p className="mt-1 text-xs text-muted-foreground">{checkin.reason}</p> : null}</div>
                </li>)}
              </ol>
            )}
          </section>
          {sidebarSlot ? <details className="rounded-2xl border border-border/70 bg-white p-4 sm:p-5"><summary className="cursor-pointer text-sm font-semibold text-foreground">Conectar otro celular de recepción</summary><div className="mt-4">{sidebarSlot}</div></details> : null}
          <Link href={`/admin/events/${event.id}/guests`} className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-primary hover:underline">Gestionar lista de invitados <ArrowUpRight className="size-4" /></Link>
        </aside>
      </div>
    </div>
  )
}

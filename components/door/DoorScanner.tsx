'use client'

import jsQR from 'jsqr'
import Image from 'next/image'
import { Camera, Flashlight, FlashlightOff, Keyboard, LoaderCircle, RotateCcw, ScanLine } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/errors'
import type { CheckinMethod, Event } from '@/types'

type DoorScannerProps = {
  event: Pick<Event, 'id' | 'name' | 'event_date' | 'start_time'>
}

type GuestAtDoor = {
  first_name: string
  last_name: string
  document_number?: string | null
  photo_url?: string | null
  plus_ones_confirmed?: number | null
}

type DoorResult = {
  outcome: 'ready' | 'registered' | 'blocked'
  kind: 'success' | 'warning' | 'error'
  title: string
  detail: string
  guest?: GuestAtDoor
}

type TorchTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities
}

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

function tokenFromAccess(value: string) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('No se detectó un QR válido.')

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as { token?: string }
    if (typeof parsed.token === 'string' && parsed.token.trim()) return parsed.token.trim()
  }

  return trimmed
}

function guestName(guest?: GuestAtDoor) {
  return `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() || 'Invitado/a'
}

export default function DoorScanner({ event }: DoorScannerProps) {
  const [scannerActive, setScannerActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DoorResult | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [cameraMessage, setCameraMessage] = useState<string | null>(null)
  const [flashSupported, setFlashSupported] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)

  const stopScanner = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScannerActive(false)
    setFlashSupported(false)
    setFlashActive(false)
  }, [])

  useEffect(() => () => stopScanner(), [stopScanner])

  // Esta pantalla se usa como una app operativa: evitar el rebote y el scroll
  // del navegador para que el gesto sobre la cámara no mueva toda la página.
  useEffect(() => {
    const bodyOverflow = document.body.style.overflow
    const bodyOverscroll = document.body.style.overscrollBehavior
    const bodyBackground = document.body.style.backgroundColor
    const htmlOverflow = document.documentElement.style.overflow
    const htmlBackground = document.documentElement.style.backgroundColor

    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    document.body.style.backgroundColor = '#020617'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.backgroundColor = '#020617'

    return () => {
      document.body.style.overflow = bodyOverflow
      document.body.style.overscrollBehavior = bodyOverscroll
      document.body.style.backgroundColor = bodyBackground
      document.documentElement.style.overflow = htmlOverflow
      document.documentElement.style.backgroundColor = htmlBackground
    }
  }, [])

  const request = useCallback(
    async (token: string, intent: 'preview' | 'approve') => {
      const response = await fetch(`/api/events/${event.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, method: 'qr' satisfies CheckinMethod, intent }),
      })
      const payload = (await response.json().catch(() => null)) as { data?: DoorResult; error?: string } | null
      if (!response.ok || !payload?.data) throw new Error(payload?.error || 'No se pudo validar el acceso.')
      return payload.data
    },
    [event.id]
  )

  const previewAccess = useCallback(
    async (rawValue: string) => {
      setLoading(true)
      setCameraMessage(null)
      stopScanner()
      try {
        const token = tokenFromAccess(rawValue)
        const nextResult = await request(token, 'preview')
        setAccessToken(nextResult.outcome === 'ready' ? token : null)
        setResult(nextResult)
      } catch (error) {
        setAccessToken(null)
        setResult({
          outcome: 'blocked',
          kind: 'error',
          title: 'No se pudo leer el acceso',
          detail: getErrorMessage(error),
        })
      } finally {
        setLoading(false)
      }
    },
    [request, stopScanner]
  )

  const startScanner = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Este dispositivo no permite usar la cámara.')
      }
      stopScanner()
      setResult(null)
      setAccessToken(null)
      setCameraMessage(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) throw new Error('No se pudo inicializar la cámara.')

      streamRef.current = stream
      const videoTrack = stream.getVideoTracks()[0] as TorchTrack | undefined
      const capabilities = videoTrack?.getCapabilities?.() as TorchCapabilities | undefined
      setFlashSupported(Boolean(capabilities?.torch))
      video.srcObject = stream
      await video.play()
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('No se pudo inicializar el lector de QR.')
      setScannerActive(true)

      const scanFrame = () => {
        const activeVideo = videoRef.current
        const activeCanvas = canvasRef.current
        if (!activeVideo || !activeCanvas) return

        if (activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          activeCanvas.width = activeVideo.videoWidth
          activeCanvas.height = activeVideo.videoHeight
          context.drawImage(activeVideo, 0, 0, activeCanvas.width, activeCanvas.height)
          const image = context.getImageData(0, 0, activeCanvas.width, activeCanvas.height)
          const decoded = jsQR(image.data, image.width, image.height)
          if (decoded?.data) {
            void previewAccess(decoded.data)
            return
          }
        }
        frameRef.current = requestAnimationFrame(scanFrame)
      }

      frameRef.current = requestAnimationFrame(scanFrame)
    } catch (error) {
      stopScanner()
      setCameraMessage(getErrorMessage(error))
    }
  }, [previewAccess, stopScanner])

  const toggleFlash = async () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0] as TorchTrack | undefined
    if (!videoTrack || !flashSupported) return

    try {
      const nextFlashState = !flashActive
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextFlashState } as MediaTrackConstraintSet],
      })
      setFlashActive(nextFlashState)
      setCameraMessage(null)
    } catch {
      setCameraMessage('No se pudo cambiar el flash de esta cámara.')
    }
  }

  const approve = async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      setResult(await request(accessToken, 'approve'))
      setAccessToken(null)
    } catch (error) {
      setResult({ outcome: 'blocked', kind: 'error', title: 'No se pudo registrar el ingreso', detail: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    setResult(null)
    setAccessToken(null)
    setManualValue('')
    void startScanner()
  }

  const isReady = result?.outcome === 'ready'
  const isRegistered = result?.outcome === 'registered'
  const companionCount = result?.guest?.plus_ones_confirmed ?? 0

  return (
    <main className="fixed inset-0 h-[100dvh] touch-none overflow-hidden overscroll-none bg-slate-950 px-4 py-5 text-white sm:px-6">
      <div className="mx-auto flex h-full max-w-md flex-col">
        <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-white/10 pb-4">
          <Image src="/alista-logo-white.svg" alt="Alista" width={120} height={40} className="h-auto w-18 shrink-0 justify-self-start" priority />
          <div className="min-w-0 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-300">Modo puerta</p>
              <h1 className="mt-1 truncate text-xl font-bold leading-tight">{event.name}</h1>
          </div>
          <div className="mt-1 flex flex-col items-end gap-2 justify-self-end">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${loading ? 'bg-amber-300/15 text-amber-100' : scannerActive ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/10 text-slate-300'}`}>
              <span className={`size-2 rounded-full ${loading ? 'animate-pulse bg-amber-300' : scannerActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              {loading ? 'Procesando...' : scannerActive ? 'Cámara lista' : 'En espera'}
            </div>
            {scannerActive && flashSupported && (
              <button
                type="button"
                onClick={() => void toggleFlash()}
                className={`grid size-10 place-items-center rounded-full border transition ${flashActive ? 'border-[#fcb39e] bg-[#fcb39e] text-slate-950' : 'border-white/15 bg-white/10 text-white hover:bg-white/15'}`}
                aria-label={flashActive ? 'Desactivar flash' : 'Activar flash'}
                title={flashActive ? 'Desactivar flash' : 'Activar flash'}
              >
                {flashActive ? <FlashlightOff className="size-4" /> : <Flashlight className="size-4" />}
              </button>
            )}
          </div>
        </header>

        <section className="relative mt-6 flex flex-1 flex-col justify-center">
          {!result && (
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] bg-black">
                <video ref={videoRef} muted playsInline className="size-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {loading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 px-7 text-center">
                    <LoaderCircle className="size-12 animate-spin text-[#fcb39e]" />
                    <p className="mt-4 text-xl font-bold">Procesando...</p>
                    <p className="mt-2 text-sm text-slate-300">Estamos validando el acceso.</p>
                  </div>
                )}
                {!scannerActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 px-7 text-center">
                    <ScanLine className="size-16 text-sky-300" strokeWidth={1.35} />
                    <h2 className="mt-5 text-2xl font-bold">Listo para escanear</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">Apuntá al QR que el invitado muestra desde su celular.</p>
                    <Button type="button" onClick={() => void startScanner()} className="mt-6 bg-[#fcb39e] text-slate-950 hover:bg-[#f8c4b5]">
                      <Camera className="size-4" />
                      Abrir cámara
                    </Button>
                  </div>
                )}
                {scannerActive && <div className="pointer-events-none absolute inset-8 rounded-[20px] border-2 border-[#fcb39e] shadow-[0_0_0_999px_rgba(2,6,23,0.18)]" />}
              </div>
              {cameraMessage && <p className="mt-4 rounded-xl bg-rose-500/15 p-3 text-sm text-rose-100">{cameraMessage}</p>}
              <div className="mt-4 text-center">
                <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 underline underline-offset-4" onClick={() => setManualOpen((open) => !open)}>
                  <Keyboard className="size-4" />
                  Ingresar código manual
                </button>
                {manualOpen && (
                  <form className="mt-3 flex touch-auto gap-2" onSubmit={(submitEvent) => { submitEvent.preventDefault(); void previewAccess(manualValue) }}>
                    <Input value={manualValue} onChange={(inputEvent) => setManualValue(inputEvent.target.value)} className="border-white/20 bg-white text-slate-950" placeholder="Token de acceso" />
                    <Button type="submit" disabled={!manualValue.trim() || loading}>Validar</Button>
                  </form>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className={`rounded-[32px] p-6 shadow-2xl ${isReady || isRegistered ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'}`}>
              <p className="text-xs font-bold uppercase tracking-[0.28em] opacity-80">{isReady ? 'Acceso válido' : isRegistered ? 'Ingreso aprobado' : 'Acceso bloqueado'}</p>
              {result.guest && (
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-black/15 text-3xl font-bold">
                    {result.guest.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={result.guest.photo_url} alt={guestName(result.guest)} className="size-full object-cover" />
                    ) : (
                      guestName(result.guest).slice(0, 1)
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold leading-tight">{guestName(result.guest)}</h2>
                    <p className="mt-2 font-mono text-base font-semibold">DNI {result.guest.document_number || 'NO INFORMADO'}</p>
                    {companionCount > 0 && (
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.08em]">
                        Acompañantes: {companionCount}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <h3 className="mt-7 text-xl font-bold">{result.title}</h3>
              <p className="mt-2 text-sm leading-6 opacity-90">{result.detail}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {isReady && (
                  <Button type="button" onClick={() => void approve()} disabled={loading} className="h-14 bg-white text-emerald-800 hover:bg-emerald-50">
                    {loading ? <LoaderCircle className="size-5 animate-spin" /> : null}
                    {loading ? 'Procesando...' : 'Aprobar ingreso'}
                  </Button>
                )}
                <Button type="button" onClick={next} disabled={loading} variant={isReady ? 'outline' : 'secondary'} className={isReady ? 'h-14 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white' : 'h-14'}>
                  <RotateCcw className="size-4" />
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </section>

        <footer className="pt-6 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Control de acceso · Alista</footer>
      </div>
    </main>
  )
}

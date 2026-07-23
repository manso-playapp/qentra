import Image from 'next/image'
import type { ReactNode } from 'react'
import { CalendarDays, Clock3, MapPin, PlaneTakeoff, Ticket } from 'lucide-react'
import type { SurfaceBranding } from '@/types'

export type InvitationEventInfo = {
  name?: string
  slug?: string
  event_date?: string
  start_time?: string
  venue_name?: string
  venue_address?: string
  description?: string
  contact_phone?: string
}

export type InvitationConfigInfo = {
  dresscode?: string
  directionsUrl?: string
}

export type AccessState = {
  label: string
  title: string
  detail: string
  tone: string
  pill: string
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(new Date(date))
}

export function formatAirportDate(date: string) {
  const parts = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  }).formatToParts(new Date(`${date}T12:00:00`))
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || ''

  return [value('weekday'), value('day'), value('month')]
    .filter(Boolean)
    .join(' ')
    .toLocaleUpperCase('es-AR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function formatTime(time: string) {
  return time.slice(0, 5)
}

export function buildMapsUrl(address?: string) {
  if (!address) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function buildPhoneHref(phone?: string) {
  if (!phone) return null
  return `tel:${phone.replace(/\s+/g, '')}`
}

export function buildCalendarUrl(event: InvitationEventInfo) {
  if (!event.event_date || !event.start_time) return null
  const start = new Date(`${event.event_date}T${event.start_time}`)
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000)
  const fmt = (value: Date) => value.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const details = [event.description, event.venue_name, event.venue_address].filter(Boolean).join('\n')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    'Cumple de Dharma'
  )}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    event.venue_address || event.venue_name || ''
  )}`
}

export function buildAccessState(input: {
  invitationUsed: boolean
  eventInactive: boolean
  accessReady: boolean
  invitationResponse: 'pending' | 'confirmed' | 'declined' | 'checked_in'
  paymentStatus: 'not_required' | 'pending' | 'approved'
  lastUsedAt?: string | null
}): AccessState {
  const { invitationUsed, eventInactive, accessReady, invitationResponse, paymentStatus, lastUsedAt } = input

  if (invitationUsed) {
    return {
      label: 'Acceso ya utilizado',
      title: 'Este QR ya fue registrado en puerta',
      detail: lastUsedAt
        ? `Si necesitás ayuda, acercate al control de acceso. Último uso: ${new Intl.DateTimeFormat('es-AR', {
            dateStyle: 'full',
            timeStyle: 'short',
          }).format(new Date(lastUsedAt))}.`
        : 'Si necesitás ayuda, acercate al control de acceso.',
      tone: 'border-amber-300/35 bg-amber-950/80 text-amber-50',
      pill: 'bg-amber-300/15 text-amber-100',
    }
  }

  if (eventInactive) {
    return {
      label: 'Evento no disponible',
      title: 'Este acceso no está habilitado por el momento',
      detail: 'El evento fue pausado o cancelado. Si creés que es un error, contactá a la organización.',
      tone: 'border-white/20 bg-black/80 text-white',
      pill: 'bg-white/15 text-white',
    }
  }

  if (invitationResponse === 'checked_in') {
    return {
      label: 'Ingreso registrado',
      title: 'Tu ingreso ya fue registrado en puerta',
      detail: 'Si necesitÃ¡s ayuda, acercate al control de acceso.',
      tone: 'border-amber-300/35 bg-amber-950/80 text-amber-50',
      pill: 'bg-amber-300/15 text-amber-100',
    }
  }

  if (accessReady) {
    return {
      label: 'Acceso confirmado',
      title: 'Tu QR final está listo para ingresar',
      detail: 'Mostralo directamente desde tu celular al llegar. No hace falta imprimirlo.',
      tone: 'border-emerald-300/35 bg-emerald-950/80 text-emerald-50',
      pill: 'bg-emerald-300/15 text-emerald-100',
    }
  }

  if (invitationResponse === 'confirmed') {
    return {
      label: 'Gestión en revisión',
      title: 'Tu acceso aún no está listo para ingresar',
      detail:
        paymentStatus === 'pending'
          ? 'Tu asistencia fue registrada, pero el acceso final quedará habilitado cuando se confirme el pago.'
          : 'Tu asistencia fue registrada. Falta una validación final para habilitar el QR de ingreso.',
      tone: 'border-amber-300/35 bg-amber-950/80 text-amber-50',
      pill: 'bg-amber-300/15 text-amber-100',
    }
  }

  if (invitationResponse === 'declined') {
    return {
      label: 'No asistencia registrada',
      title: 'Tu respuesta ya quedó guardada',
      detail: 'Si cambiás de idea, podés volver a completar este paso antes del evento.',
      tone: 'border-rose-300/35 bg-rose-950/80 text-rose-50',
      pill: 'bg-rose-300/15 text-rose-100',
    }
  }

  return {
    label: 'Acreditación pendiente',
    title: 'Completá tu checkin para recibir el QR final',
    detail: 'Confirmá asistencia, DNI, acompañantes y observaciones antes de mostrar el acceso en puerta.',
    tone: 'border-sky-300/35 bg-sky-950/80 text-sky-50',
    pill: 'bg-sky-300/15 text-sky-100',
  }
}

type InvitationViewProps = {
  event: InvitationEventInfo
  branding: SurfaceBranding | null
  guestDisplayName: string
  calendarUrl?: string | null
  isPreview?: boolean
  children?: ReactNode
}

const FIESTA_DIRECTIONS_URL = 'https://maps.app.goo.gl/yuuhpJ3KbXuhJKBi9'
const FIESTA_DRESSCODE = {
  ellas: 'Ellas: negro y blanco.',
  ellos: 'Ellos: gorra y ropa deportiva.',
}
const FIESTA_SONG_EMBED_URL = 'https://open.spotify.com/embed/track/5Q0Nhxo0l2bP3pNjpGJwV1?utm_source=generator&autoplay=1'
const FIESTA_CONTACT_PHONE = '+54 9 3496 54-9307'
const BOARDING_TIME = '20:30'

export default function InvitationView({
  event,
  branding,
  guestDisplayName,
  calendarUrl,
  isPreview = false,
  children,
}: InvitationViewProps) {
  const airportCode = (event.name || 'DRM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'DRM'

  return (
    <main
      className="relative min-h-screen min-h-[100dvh] overscroll-y-none bg-black px-4 pb-8 text-white sm:px-6"
      style={{
        backgroundColor: '#000',
        backgroundImage: 'url(/portada.jpg)',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% auto',
      }}
    >
      {isPreview && (
        <div className="sticky top-0 z-20 bg-amber-400 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-black">
          Vista previa · invitación de ejemplo
        </div>
      )}

      <div className="relative mx-auto max-w-xl space-y-5" style={{ paddingTop: 'min(177.78vw, 680px)' }}>
        {branding?.logo_url ? (
          <Image
            src={branding.logo_url}
            alt={`Logo de ${event.name || 'evento'}`}
            width={220}
            height={132}
            unoptimized
            className="mx-auto h-20 w-auto max-w-[70%] object-contain drop-shadow-lg"
          />
        ) : (
          <p className="pt-4 text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-white/60">Acceso digital</p>
        )}

        <section className="relative overflow-hidden rounded-[28px] bg-[#eed8d2] p-5 text-slate-950 shadow-2xl sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#fcb39e]" />

          <header className="flex items-center justify-between pt-2">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Alista Air</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950">Boarding pass</p>
            </div>
            <Ticket className="size-6 text-slate-950" strokeWidth={1.75} aria-hidden="true" />
          </header>

          <div className="mt-7 grid grid-cols-[1fr_96px_1fr] items-center gap-2 sm:grid-cols-[1fr_132px_1fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Origen</p>
              <p className="mt-1 font-mono text-4xl font-bold tracking-[-0.08em] sm:text-5xl">ESP</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Esperanza</p>
            </div>
            <div className="relative flex items-center justify-center" aria-label={`Ruta de ESP a ${airportCode}`}>
              <span className="absolute inset-x-0 border-t-2 border-dashed border-slate-400" />
              <PlaneTakeoff className="relative size-14 -rotate-12 bg-[#eed8d2] px-2 text-slate-950 sm:size-18" strokeWidth={1.45} aria-hidden="true" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Destino</p>
              <p className="mt-1 font-mono text-4xl font-bold tracking-[-0.08em] sm:text-5xl">{airportCode}</p>
              <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">15 Dharma</p>
            </div>
          </div>

          <div className="relative my-6 border-t-2 border-dashed border-slate-300">
            <span className="absolute -left-8 -top-3 size-6 rounded-full bg-black sm:-left-9" />
            <span className="absolute -right-8 -top-3 size-6 rounded-full bg-black sm:-right-9" />
          </div>

          <dl className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] gap-x-3 gap-y-5">
            <div className="col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Pasajero</dt>
              <dd className="mt-1 text-lg font-bold uppercase tracking-[0.1em] sm:text-xl">{guestDisplayName || 'Invitado/a'}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"><CalendarDays className="size-3" aria-hidden="true" /> Fecha</dt>
              <dd className="mt-1 font-mono text-base font-bold uppercase tracking-[0.05em] sm:text-lg">{event.event_date ? formatAirportDate(event.event_date) : 'A confirmar'}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"><Clock3 className="size-3" aria-hidden="true" /> Boarding</dt>
              <dd className="mt-1 font-mono text-base font-bold uppercase tracking-[0.05em] sm:text-lg">{BOARDING_TIME} hs</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500"><MapPin className="size-3" aria-hidden="true" /> Gate</dt>
              <dd className="mt-1 text-base font-bold uppercase leading-tight tracking-[0.04em] sm:text-lg">
                <span className="block">El Pirincho</span>
                <span className="block">Aerocountry</span>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Vuelo</dt>
              <dd className="mt-1 font-mono text-base font-bold uppercase tracking-[0.05em] sm:text-lg">15 Dharma</dd>
            </div>
          </dl>

          <div className="mt-6 border-t-2 border-dashed border-slate-300 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Dress code</p>
            <p className="mt-1 text-sm font-semibold uppercase leading-5 tracking-[0.03em]">
              <span className="block font-black text-[#b42318]">Prohibido</span>
              <span className="block">{FIESTA_DRESSCODE.ellas}</span>
              <span className="block">{FIESTA_DRESSCODE.ellos}</span>
            </p>
            <div className="mt-5 border-t-2 border-dashed border-slate-300 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Regalo</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.03em]">Alias de CBU</p>
              <div className="mt-2 space-y-1 font-mono text-base font-bold uppercase tracking-[0.08em]">
                <p>U$S: CUMPLE.15.DHARMA</p>
                <p>PESOS: DHARMAXV</p>
              </div>
            </div>
            <div className="mt-5 border-t-2 border-dashed border-slate-300 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Canción de abordaje</p>
              <iframe
                className="mt-2 h-38 w-full rounded-[18px] border-0"
                src={FIESTA_SONG_EMBED_URL}
                title="Party In The U.S.A. de Miley cyrus en Spotify"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={FIESTA_DIRECTIONS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-[#fcb39e] px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-[#f8c4b5]">
                Ver ubicación
              </a>
              {calendarUrl && (
                <a href={calendarUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200">
                  Agendar
                </a>
              )}
              <a href={buildPhoneHref(FIESTA_CONTACT_PHONE) || '#'} className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200">
                Contactar
              </a>
            </div>
          </div>

          <div className="mt-6 h-10 opacity-70" aria-hidden="true" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #0f172a 0 2px, transparent 2px 4px, #0f172a 4px 5px, transparent 5px 8px)' }} />
        </section>

        {children}

        <footer className="pb-2 pt-1 text-center text-xs uppercase tracking-[0.28em] text-white/80">
          {isPreview ? 'Vista previa · ' : ''}Desarrollado por Alista
        </footer>
      </div>
    </main>
  )
}

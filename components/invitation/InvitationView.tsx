import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import { CalendarDays, Clock3, MapPin, PlaneTakeoff, Sparkles, Ticket } from 'lucide-react'
import type { SurfaceBranding } from '@/types'
import InvitationCountdown from '@/components/invitation/InvitationCountdown'
import InvitationLightRays from '@/components/invitation/InvitationLightRays'
import InvitationMusicPlayer from '@/components/invitation/InvitationMusicPlayer'
import InvitationScrollReveal from '@/components/invitation/InvitationScrollReveal'
import InvitationWindParticles from '@/components/invitation/InvitationWindParticles'
import type { InvitationTemplateKey } from '@/lib/invitation-templates'

export type { InvitationTemplateKey } from '@/lib/invitation-templates'

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
  template?: InvitationTemplateKey
  dresscode?: string
  directionsUrl?: string
  audio_url?: string
  widgets?: { trivia?: boolean; countdown?: boolean; particles?: boolean }
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

export type InvitationSchedule = {
  startTime?: string | null
  startDayOffset?: number | null
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

export function formatEditorialDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`))
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

// Noche usa el color secundario del branding como acento compartido por
// botones, iconos, titulos destacados y rayos de luz. El rosa queda como
// fallback para invitaciones sin color configurado.
export function getMidnightAccentColor(branding?: Pick<SurfaceBranding, 'secondary_color'> | null) {
  return branding?.secondary_color && HEX_COLOR.test(branding.secondary_color) ? branding.secondary_color : '#f3a6b8'
}

export function buildMapsUrl(address?: string) {
  if (!address) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function buildPhoneHref(phone?: string) {
  if (!phone) return null
  return `tel:${phone.replace(/\s+/g, '')}`
}

export function getInvitationStartTime(event: InvitationEventInfo, schedule?: InvitationSchedule) {
  return schedule?.startTime?.slice(0, 5) || event.start_time?.slice(0, 5) || null
}

export function buildCalendarUrl(event: InvitationEventInfo, schedule?: InvitationSchedule) {
  const startTime = getInvitationStartTime(event, schedule)
  if (!event.event_date || !startTime) return null

  // La fecha y la hora del evento se cargan como hora local argentina. No se
  // deben serializar con `toISOString()` porque eso las transforma a UTC y
  // Google Calendar las muestra tres horas antes en Buenos Aires.
  const [year, month, day] = event.event_date.split('-').map(Number)
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDayOffset = schedule?.startTime ? schedule.startDayOffset ?? 0 : 0
  const start = new Date(Date.UTC(year, month - 1, day + startDayOffset, hours, minutes))
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000)
  const fmt = (value: Date) =>
    [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, '0'),
      String(value.getUTCDate()).padStart(2, '0'),
    ].join('') + `T${String(value.getUTCHours()).padStart(2, '0')}${String(value.getUTCMinutes()).padStart(2, '0')}00`
  const details = [event.description, event.venue_name, event.venue_address].filter(Boolean).join('\n')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.name || 'Evento Alista'
  )}&dates=${fmt(start)}/${fmt(end)}&ctz=America%2FArgentina%2FBuenos_Aires&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    event.venue_address || event.venue_name || ''
  )}`
}

export function buildAccessState(input: {
  invitationUsed: boolean
  invitationExpired: boolean
  eventInactive: boolean
  accessReady: boolean
  invitationResponse: 'pending' | 'confirmed' | 'declined' | 'checked_in'
  paymentStatus: 'not_required' | 'pending' | 'approved'
  lastUsedAt?: string | null
}): AccessState {
  const {
    invitationUsed,
    invitationExpired,
    eventInactive,
    accessReady,
    invitationResponse,
    paymentStatus,
    lastUsedAt,
  } = input

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

  if (invitationExpired) {
    return {
      label: 'Acceso vencido',
      title: 'Este QR ya no está vigente',
      detail: 'La vigencia del acceso terminó. Si necesitás ayuda, contactá a la organización.',
      tone: 'border-rose-300/35 bg-rose-950/80 text-rose-50',
      pill: 'bg-rose-300/15 text-rose-100',
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
    detail: 'Confirmá asistencia, DNI y observaciones antes de mostrar el acceso en puerta.',
    tone: 'border-sky-300/35 bg-sky-950/80 text-sky-50',
    pill: 'bg-sky-300/15 text-sky-100',
  }
}

type InvitationViewProps = {
  event: InvitationEventInfo
  branding: SurfaceBranding | null
  guestDisplayName: string
  schedule?: InvitationSchedule
  calendarUrl?: string | null
  template?: InvitationTemplateKey
  config?: InvitationConfigInfo
  isPreview?: boolean
  children?: ReactNode
}

const FIESTA_DIRECTIONS_URL = 'https://maps.app.goo.gl/yuuhpJ3KbXuhJKBi9'
const FIESTA_DRESSCODE = {
  ellas: 'Ellas: negro y blanco.',
  ellos: 'Ellos: gorra y ropa deportiva.',
}
const FIESTA_CONTACT_PHONE = '+54 9 3496 54-9307'

function InvitationLogo({
  src,
  alt,
  stageClassName,
  imageClassName,
}: {
  src: string
  alt: string
  stageClassName?: string
  imageClassName: string
}) {
  return (
    <span className={`invitation-logo-stage ${stageClassName || ''}`}>
      <span
        className="invitation-logo-glow"
        aria-hidden="true"
        style={{ '--invitation-logo-mask': `url("${src}")` } as CSSProperties}
      />
      <Image
        src={src}
        alt={alt}
        width={220}
        height={132}
        unoptimized
        className={`relative z-10 ${imageClassName}`}
      />
    </span>
  )
}

function BoardingPassBarcode({ value }: { value: string }) {
  const source = value.replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'ALISTA15'
  const bars = Array.from({ length: 52 }, (_, index) => {
    const code = source.charCodeAt(index % source.length)
    return 1 + ((code + index * 7) % 4)
  })

  return (
    <div className="mt-6 border-t-2 border-dashed border-slate-300 pt-4" aria-hidden="true">
      <div className="rounded-md bg-white/35 px-3 py-2">
        <div className="flex h-10 items-stretch gap-px overflow-hidden">
          <span className="w-0.75 shrink-0 bg-slate-950" />
          {bars.map((width, index) => (
            <span
              key={index}
              className={`shrink-0 bg-slate-950 ${index === 0 || index === bars.length - 1 ? 'h-full' : 'h-8'}`}
              style={{ width }}
            />
          ))}
          <span className="w-0.75 shrink-0 bg-slate-950" />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[8px] font-bold tracking-[0.22em] text-slate-600">
          <span>ESP</span>
          <span>{source.slice(0, 12).padEnd(12, '0')}</span>
          <span>ALISTA</span>
        </div>
      </div>
    </div>
  )
}

function TravelInvitationView({
  event,
  branding,
  guestDisplayName,
  schedule,
  calendarUrl,
  config,
  isPreview = false,
  children,
}: InvitationViewProps) {
  const airportCode = (event.name || 'DRM').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'DRM'
  const boardingTime = getInvitationStartTime(event, schedule)

  return (
    <main
      className="invitation-template-travel relative min-h-screen min-h-[100dvh] overscroll-y-none bg-black px-4 pb-8 text-white sm:px-6"
      data-invitation-template="travel"
      style={{
        backgroundColor: '#000',
        backgroundImage: 'url(/portada.jpg)',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% auto',
      }}
    >
      <InvitationWindParticles />
      {isPreview && (
        <div className="sticky top-0 z-20 bg-amber-400 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-black">
          Vista previa · invitación de ejemplo
        </div>
      )}

      <div className="relative mx-auto max-w-xl space-y-5" style={{ paddingTop: 'min(177.78vw, 680px)' }}>
        {branding?.logo_url ? (
          <InvitationLogo
            src={branding.logo_url}
            alt={`Logo de ${event.name || 'evento'}`}
            stageClassName="mx-auto max-w-[70%]"
            imageClassName="h-20 w-auto max-w-full object-contain drop-shadow-lg"
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
              <dd className="mt-1 font-mono text-base font-bold uppercase tracking-[0.05em] sm:text-lg">{boardingTime ? `${boardingTime} hs` : 'A confirmar'}</dd>
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
            {config?.audio_url ? (
              <div className="mt-5 border-t-2 border-dashed border-slate-300 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Canción de abordaje</p>
              <InvitationMusicPlayer audioUrl={config.audio_url} />
              </div>
            ) : null}
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

          <BoardingPassBarcode value={`${event.slug || airportCode}${event.event_date || ''}`} />
        </section>

        {children}

        <footer className="pb-2 pt-1 text-center text-xs uppercase tracking-[0.28em] text-white/80">
          {isPreview ? 'Vista previa · ' : ''}
          <a href="/" target="_blank" rel="noreferrer" className="transition hover:text-[#fcb39e] hover:underline underline-offset-4">
            Desarrollado por Alista
          </a>
        </footer>
      </div>
    </main>
  )
}

function MidnightInvitationView({
  event,
  branding,
  guestDisplayName,
  schedule,
  calendarUrl,
  config,
  isPreview = false,
  children,
}: InvitationViewProps) {
  const startTime = getInvitationStartTime(event, schedule)
  const directionsUrl = config?.directionsUrl || buildMapsUrl(event.venue_address)
  const contactHref = buildPhoneHref(event.contact_phone)
  const accentColor = getMidnightAccentColor(branding)

  return (
    <main
      className="invitation-template-midnight relative min-h-screen min-h-[100dvh] overflow-hidden bg-black px-4 pb-10 text-white sm:px-6"
      data-invitation-template="midnight"
      style={{
        ['--invitation-accent' as string]: accentColor,
        ...(branding?.cover_image_url
          ? {
              backgroundImage: `url(${branding.cover_image_url})`,
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% auto',
            }
          : undefined),
      }}
    >
      {config?.widgets?.particles && <InvitationWindParticles />}
      <InvitationScrollReveal />
      <InvitationLightRays raysColor={accentColor} />

      {isPreview && (
        <div className="absolute inset-x-0 top-0 z-20 bg-(--invitation-accent) px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#171714]">
          Vista previa · invitación de ejemplo
        </div>
      )}

      <div className="relative mx-auto flex max-w-xl flex-col space-y-20 pt-[80px] text-center sm:pt-[80px]">
        {branding?.logo_url ? (
          <InvitationLogo
            src={branding.logo_url}
            alt={`Logo de ${event.name || 'evento'}`}
            stageClassName="mx-auto max-w-full"
            imageClassName="h-auto w-[760px] max-w-full object-contain drop-shadow-lg"
          />
        ) : null}

        <header className="invitation-event-details invitation-section order-3">
          <section className="invitation-block" data-invitation-block>
            <h2 className="invitation-section-title">Fecha, hora y lugar</h2>
            <dl className="mt-8 flex flex-col items-center gap-10">
              <div>
                <dt className="flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                  <span className="invitation-animated-icon invitation-animated-icon-one" aria-hidden="true"><CalendarDays className="size-8" /></span>
                  <span className="mt-3">Fecha</span>
                </dt>
                <dd className="mt-2 text-2xl text-white sm:text-3xl">
                  {event.event_date ? formatEditorialDate(event.event_date) : 'A confirmar'}
                </dd>
              </div>
              <div>
                <dt className="flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                  <span className="invitation-animated-icon invitation-animated-icon-two" aria-hidden="true"><Clock3 className="size-8" /></span>
                  <span className="mt-3">Hora</span>
                </dt>
                <dd className="mt-2 text-2xl text-white sm:text-3xl">
                  {startTime ? `${startTime} hs` : 'A confirmar'}
                </dd>
              </div>
              <div>
                <dt className="flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                  <span className="invitation-animated-icon invitation-animated-icon-three" aria-hidden="true"><MapPin className="size-8" /></span>
                  <span className="mt-3">Lugar</span>
                </dt>
                <dd className="mt-2 text-2xl text-white sm:text-3xl">
                  {event.venue_name || event.venue_address || 'Lugar a confirmar'}
                </dd>
                {event.venue_address && event.venue_name ? <p className="mt-2 text-xs text-white/48">{event.venue_address}</p> : null}
              </div>
            </dl>
          </section>

          {config?.widgets?.countdown && event.event_date && (
            <section className="invitation-block mt-10 border-t border-white/18 pt-10" data-invitation-block>
              <h2 className="invitation-section-title mb-5 text-white">Faltan:</h2>
              <InvitationCountdown eventDate={event.event_date} startTime={startTime} />
            </section>
          )}

          {config?.dresscode ? (
            <section className="invitation-block invitation-section mt-10 border-t border-white/18 pt-10 text-center" data-invitation-block>
              <h2 className="invitation-section-title text-white">Dress Code</h2>
              <p className="invitation-section-body mt-3 text-(--invitation-accent)">{config.dresscode}</p>
            </section>
          ) : null}

          {(directionsUrl || calendarUrl || contactHref) && (
            <section className="invitation-block invitation-section mt-10 border-t border-white/18 pt-10" data-invitation-block>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-3">
              {directionsUrl ? (
                <a href={directionsUrl} target="_blank" rel="noreferrer" className="invitation-label inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/8 px-5 py-2 text-xs font-semibold text-white transition hover:border-(--invitation-accent) hover:bg-white/12 hover:text-(--invitation-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--invitation-accent)">
                  Ver ubicación
                </a>
              ) : null}
              {calendarUrl ? (
                <a href={calendarUrl} target="_blank" rel="noreferrer" className="invitation-label inline-flex min-h-11 items-center justify-center rounded-full border border-(--invitation-accent) bg-(--invitation-accent) px-5 py-2 text-xs font-semibold text-[#171714] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--invitation-accent)">
                  Agendar
                </a>
              ) : null}
              {contactHref ? (
                <a href={contactHref} className="invitation-label inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/8 px-5 py-2 text-xs font-semibold text-white transition hover:border-(--invitation-accent) hover:bg-white/12 hover:text-(--invitation-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--invitation-accent)">
                  Contactar
                </a>
              ) : null}
              </div>
            </section>
          )}

          {config?.audio_url ? (
            <section className="invitation-block invitation-section mt-10 border-t border-white/18 pt-10" data-invitation-block>
              <InvitationMusicPlayer audioUrl={config.audio_url} />
            </section>
          ) : null}
        </header>

        <section className="invitation-personal invitation-section order-2 border-t border-(--invitation-accent)/45 pt-8 text-white" data-invitation-block>
          <p className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-(--invitation-accent)">
            <Sparkles className="size-4" aria-hidden="true" /> Invitación especial
          </p>
          <p className="mt-4 text-3xl font-extralight leading-tight sm:text-4xl">
            {guestDisplayName || 'Invitado/a'},<br />
            esta noche también es para vos.
          </p>
          <p className="mt-3 text-sm leading-6 text-white/65">Confirmá tu asistencia para que todo esté listo cuando llegues.</p>
        </section>

        <div className="invitation-content-flow order-4">{children}</div>

        <footer className="invitation-footer order-5 pb-2 pt-2 text-center text-xs uppercase tracking-[0.28em] text-white/48">
          {isPreview ? 'Vista previa · ' : ''}
          <a href="/" target="_blank" rel="noreferrer" className="transition hover:text-(--invitation-accent) hover:underline underline-offset-4">
            Desarrollado por Alista
          </a>
        </footer>
      </div>
    </main>
  )
}

export default function InvitationView(props: InvitationViewProps) {
  return props.template === 'midnight' ? <MidnightInvitationView {...props} /> : <TravelInvitationView {...props} />
}

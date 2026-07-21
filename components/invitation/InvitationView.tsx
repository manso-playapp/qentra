import Image from 'next/image'
import type { ReactNode } from 'react'
import type { SurfaceBranding } from '@/types'

/**
 * Shell compartido de la invitacion publica.
 *
 * Lo usan tanto la invitacion real (app/invitacion/[token]) como la vista
 * previa modelo (app/invitacion/preview/[eventId]). Mantiene una sola
 * jerarquia: logo -> datos del evento -> estado del acceso -> accion.
 *
 * El area de accion (formulario o QR) la provee cada pagina via `children`,
 * porque la real envia un formulario que escribe en la base y la preview usa
 * un mock estatico.
 */

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

// ---- helpers de formato (compartidos entre la pagina real y la preview) ----

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(new Date(date))
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
    event.name || 'Evento privado'
  )}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    event.venue_address || event.venue_name || ''
  )}`
}

/**
 * Calcula el objeto de estado del acceso. Es puro para que la vista previa lo
 * pueda armar con datos de ejemplo sin tocar la base.
 */
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
        ? `Si necesitas ayuda, acércate al control de acceso. Último uso: ${new Intl.DateTimeFormat('es-AR', {
            dateStyle: 'full',
            timeStyle: 'short',
          }).format(new Date(lastUsedAt))}.`
        : 'Si necesitas ayuda, acércate al control de acceso.',
      tone: 'border-amber-300/35 bg-amber-950/80 text-amber-50',
      pill: 'bg-amber-300/15 text-amber-100',
    }
  }

  if (eventInactive) {
    return {
      label: 'Evento no disponible',
      title: 'Este acceso no está habilitado por el momento',
      detail: 'El evento fue pausado o cancelado. Si crees que es un error, contacta a la organización.',
      tone: 'border-white/20 bg-black/80 text-white',
      pill: 'bg-white/15 text-white',
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
      detail: 'Si cambias de idea, puedes volver a completar este paso antes del evento.',
      tone: 'border-rose-300/35 bg-rose-950/80 text-rose-50',
      pill: 'bg-rose-300/15 text-rose-100',
    }
  }

  return {
    label: 'Gestión pendiente',
    title: 'Completá tu invitación para recibir el QR final',
    detail: 'Confirmá asistencia, DNI, acompañantes y observaciones antes de mostrar el acceso en puerta.',
    tone: 'border-sky-300/35 bg-sky-950/80 text-sky-50',
    pill: 'bg-sky-300/15 text-sky-100',
  }
}

type InvitationViewProps = {
  event: InvitationEventInfo
  branding: SurfaceBranding | null
  config: InvitationConfigInfo | null
  guestDisplayName: string
  accessState: AccessState
  calendarUrl?: string | null
  tableAssignment?: string
  isPreview?: boolean
  children?: ReactNode
}

// ---- Constantes hardcodeadas para esta fiesta ----
const FIESTA_DIRECTIONS_URL = 'https://maps.app.goo.gl/yuuhpJ3KbXuhJKBi9'
const FIESTA_DRESSCODE = 'Prohibido ellas: negro y blanco. Ellos: gorra y ropa deportiva.'
const FIESTA_CONTACT_PHONE = '+54 9 3496 54-9307'
const FIESTA_SCHEDULE = [
  { label: 'Check-in', time: '20:30' },
  { label: 'Check-out', time: '05:00' },
  { label: 'VIP Lounge (after party)', time: '05:00 a 06:30' },
]

export default function InvitationView({
  event,
  branding,
  config,
  guestDisplayName,
  accessState,
  calendarUrl,
  tableAssignment,
  isPreview = false,
  children,
}: InvitationViewProps) {
  const mapsUrl = FIESTA_DIRECTIONS_URL
  const contactPhone = FIESTA_CONTACT_PHONE
  // Portada fija: ocupa el ancho desde arriba y el contenido continúa sobre negro.
  const bgImage = '/portada.jpg'

  return (
    <main
      className="relative min-h-screen bg-black px-4 pb-8 text-white sm:px-6"
      style={{
        backgroundColor: '#000',
        backgroundImage: `url(${bgImage})`,
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
        {/* Logo. Cuando no hay logo, un eyebrow neutro (no repite el nombre del evento). */}
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
          <p className="pt-4 text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-white/60">
            Acceso digital
          </p>
        )}

        {/* Datos del evento: el nombre va UNA sola vez, como título. */}
        <section className="rounded-[28px] border border-white/20 bg-black/75 p-6 shadow-2xl backdrop-blur-sm">
          <h1 className="text-center text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {event.name || 'Evento privado'}
          </h1>
          {guestDisplayName && (
            <p className="mt-2 text-center text-sm text-white/70">Para {guestDisplayName}</p>
          )}

          <div className="mt-8 flex flex-col divide-y divide-white/10 text-center text-sm text-white/85">
            <div className="pb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">Fecha</p>
              <p className="mt-2 text-base font-semibold tracking-wide">
                {event.event_date ? formatDate(event.event_date) : 'A confirmar'}
              </p>
            </div>

            {/* Horarios hardcodeados de la fiesta */}
            <div className="py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">Horarios</p>
              <ul className="mt-2 space-y-1">
                {FIESTA_SCHEDULE.map((item) => (
                  <li key={item.label} className="text-base font-semibold tracking-wide">
                    {item.label}: <span className="font-medium text-white/75">{item.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">Lugar</p>
              <p className="mt-2 text-base font-semibold tracking-wide">{event.venue_name || 'Venue privado'}</p>
              {event.venue_address && <p className="mt-0.5 text-xs text-white/55">{event.venue_address}</p>}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-white underline underline-offset-4"
              >
                Cómo llegar →
              </a>
            </div>

            {/* Mesa asignada (dato por invitado). Solo se muestra si viene informada. */}
            {tableAssignment && (
              <div className="py-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">Mesa asignada</p>
                <p className="mt-2 text-base font-semibold tracking-wide">{tableAssignment}</p>
              </div>
            )}

            {/* Dresscode hardcodeado */}
            <div className="pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">Dresscode</p>
              <p className="mt-2 text-base font-semibold tracking-wide">{FIESTA_DRESSCODE}</p>
            </div>
          </div>

          {/* Mapa/agenda/contacto van como apéndice compacto del evento, no en otra tarjeta. */}
          <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-white/10 pt-4">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/85"
            >
              Ver ubicación
            </a>
            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Agendar
              </a>
            )}
            <a
              href={buildPhoneHref(contactPhone) || '#'}
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Contactar
            </a>
          </div>
        </section>

        {/* Estado del acceso: única tarjeta de estado (antes había pill + tarjeta). */}
        <section className={`rounded-[28px] border p-6 shadow-xl ${accessState.tone}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Estado del acceso</p>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${accessState.pill}`}>
              {accessState.label}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-semibold">{accessState.title}</h2>
          <p className="mt-2 text-sm leading-6 opacity-85">{accessState.detail}</p>
        </section>

        {/* Area de accion: formulario (pendiente) o QR (listo). Lo provee cada pagina. */}
        {children}

        <footer className="pb-2 pt-1 text-center text-xs uppercase tracking-[0.28em] text-white/80">
          {isPreview ? 'Vista previa · ' : ''}Desarrollado por Alista
        </footer>
      </div>
    </main>
  )
}
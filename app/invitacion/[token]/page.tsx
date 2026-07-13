import Image from 'next/image'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import InvitationResponseForm from '@/components/invitation/InvitationResponseForm'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { normalizeGuestStatus } from '@/lib/guest-schema'
import { isInvitationAccessReady, parseInvitationDetails } from '@/lib/invitation-response'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SURFACE_BRANDING_COLUMNS, type SurfaceBranding } from '@/types'

export const metadata = {
  title: 'Invitación',
}

type InvitationPageProps = {
  params: Promise<{ token: string }>
  searchParams?: Promise<{ guest?: string }>
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
  }).format(new Date(date))
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function buildMapsUrl(address?: string) {
  if (!address) {
    return null
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function buildPhoneHref(phone?: string) {
  if (!phone) {
    return null
  }

  return `tel:${phone.replace(/\s+/g, '')}`
}

function buildCalendarUrl(event: {
  name?: string
  description?: string
  event_date?: string
  start_time?: string
  venue_name?: string
  venue_address?: string
}) {
  if (!event.event_date || !event.start_time) {
    return null
  }

  const start = new Date(`${event.event_date}T${event.start_time}`)
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000)
  const formatCalendarDate = (value: Date) => value.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const details = [event.description, event.venue_name, event.venue_address].filter(Boolean).join('\n')

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.name || 'Evento privado'
  )}&dates=${formatCalendarDate(start)}/${formatCalendarDate(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    event.venue_address || event.venue_name || ''
  )}`
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { token } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const supabase = getSupabaseAdminClient() ?? (await createServerSupabaseClient())

  const { data: invitationToken, error: invitationError } = await supabase
    .from('invitation_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (invitationError) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2e8f0,_#f8fafc_45%,_#ffffff)] px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-red-200 bg-white/92 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600">Acceso digital</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">No se pudo cargar tu acceso</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Intenta nuevamente mas tarde o pide al equipo del evento que reenvie la invitacion.
          </p>
        </div>
      </main>
    )
  }

  if (!invitationToken) {
    notFound()
  }

  const { data: guest } = await supabase
    .from('guests')
    .select('id, event_id, first_name, last_name, email, phone, status, document_number, notes, payment_status, photo_url')
    .eq('id', invitationToken.guest_id)
    .maybeSingle()

  const [{ data: event }, brandingResponse] = guest?.event_id
    ? await Promise.all([
        supabase
          .from('events')
          .select('id, name, slug, event_date, start_time, venue_name, venue_address, status, description, contact_phone')
          .eq('id', guest.event_id)
          .maybeSingle(),
        supabase
          .from('event_branding')
          .select(SURFACE_BRANDING_COLUMNS)
          .eq('event_id', guest.event_id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null, error: null }]

  // El error del branding se descartaba: un select invalido dejaba la invitacion
  // en los colores por defecto sin que nadie se enterara.
  if (brandingResponse.error) {
    console.error('[invitacion] no se pudo cargar el branding del evento', brandingResponse.error)
  }

  const branding = (brandingResponse.data ?? null) as SurfaceBranding | null

  // Config rica de la invitacion (dresscode, "como llegar"). Fetch separado y
  // defensivo: si la columna config todavia no existe, el error se ignora y
  // queda null, sin romper el branding ni la invitacion.
  let invitationConfig: { dresscode?: string; directionsUrl?: string } | null = null
  if (guest?.event_id) {
    const { data: cfgRow } = await supabase
      .from('event_branding')
      .select('config')
      .eq('event_id', guest.event_id)
      .maybeSingle()
    const raw = (cfgRow as { config?: unknown } | null)?.config
    if (raw && typeof raw === 'object') {
      invitationConfig = raw as { dresscode?: string; directionsUrl?: string }
    }
  }
  const invitationDetails = parseInvitationDetails(guest?.notes)
  const paymentStatus = (guest?.payment_status ?? 'not_required') as
    | 'not_required'
    | 'pending'
    | 'approved'

  const fallbackGuestName = [guest?.first_name, guest?.last_name].filter(Boolean).join(' ').trim()
  const guestDisplayName = resolvedSearchParams?.guest?.trim() || fallbackGuestName
  const normalizedGuestStatus = normalizeGuestStatus(guest?.status)
  const invitationResponse =
    normalizedGuestStatus === 'checked_in'
      ? 'checked_in'
      : normalizedGuestStatus === 'confirmed'
      ? 'confirmed'
      : normalizedGuestStatus === 'cancelled'
      ? 'declined'
      : 'pending'
  const invitationResponseForForm =
    invitationResponse === 'checked_in' ? 'confirmed' : invitationResponse

  const accessReady = isInvitationAccessReady(guest?.status, paymentStatus)
  const qrPayload = buildGuestAccessQrPayload({
    eventId: guest?.event_id,
    eventSlug: event?.slug,
    guestId: invitationToken.guest_id,
    guestName: guestDisplayName,
    token: invitationToken.token,
    issuedAt: invitationToken.created_at,
  })
  const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 640,
  })

  const primaryColor = branding?.primary_color || '#8b5e3c'
  const secondaryColor = branding?.secondary_color || '#f1e8da'
  const invitationUsed =
    Boolean(invitationToken.last_used_at) ||
    (invitationToken.used_count ?? 0) > 0 ||
    invitationToken.is_active === false
  const eventInactive = event?.status === 'cancelled' || event?.status === 'inactive'

  const accessState = invitationUsed
    ? {
        label: 'Acceso ya utilizado',
        title: 'Este QR ya fue registrado en puerta',
        detail: invitationToken.last_used_at
          ? `Si necesitas ayuda, acércate al control de acceso. Ultimo uso: ${formatDateTime(invitationToken.last_used_at)}.`
          : 'Si necesitas ayuda, acércate al control de acceso.',
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        pill: 'bg-amber-500/15 text-amber-800',
      }
    : eventInactive
    ? {
        label: 'Evento no disponible',
        title: 'Este acceso no esta habilitado por el momento',
        detail: 'El evento fue pausado o cancelado. Si crees que es un error, contacta a la organizacion.',
        tone: 'border-slate-300 bg-slate-100 text-slate-900',
        pill: 'bg-slate-900/10 text-slate-700',
      }
    : accessReady
    ? {
        label: 'Acceso confirmado',
        title: 'Tu QR final esta listo para ingresar',
        detail: 'Muestralo directamente desde tu celular al llegar. No hace falta imprimirlo.',
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        pill: 'bg-emerald-500/15 text-emerald-800',
      }
    : invitationResponse === 'confirmed'
    ? {
        label: 'Gestion en revision',
        title: 'Tu acceso aun no esta listo para ingresar',
        detail:
          paymentStatus === 'pending'
            ? 'Tu asistencia fue registrada, pero el acceso final quedara habilitado cuando se confirme el pago.'
            : 'Tu asistencia fue registrada. Falta una validacion final para habilitar el QR de ingreso.',
        tone: 'border-amber-200 bg-amber-50 text-amber-950',
        pill: 'bg-amber-500/15 text-amber-800',
      }
    : invitationResponse === 'declined'
    ? {
        label: 'No asistencia registrada',
        title: 'Tu respuesta ya quedo guardada',
        detail: 'Si cambias de idea, puedes volver a completar este paso antes del evento.',
        tone: 'border-rose-200 bg-rose-50 text-rose-900',
        pill: 'bg-rose-500/15 text-rose-800',
      }
    : {
        label: 'Gestion pendiente',
        title: 'Completa tu invitacion para recibir el QR final',
        detail: 'Confirma asistencia, DNI, acompanantes y observaciones antes de mostrar el acceso en puerta.',
        tone: 'border-sky-200 bg-sky-50 text-sky-900',
        pill: 'bg-sky-500/15 text-sky-800',
      }

  const mapsUrl = buildMapsUrl(event?.venue_address)
  const phoneHref = buildPhoneHref(event?.contact_phone)
  const calendarUrl = buildCalendarUrl(event || {})
  // Fondo que cubre toda la invitacion; el contenido va en tarjetas encima.
  const bgImage = branding?.background_image_url || branding?.cover_image_url

  return (
    <main
      className="relative min-h-screen px-4 py-8 text-slate-950 sm:px-6"
      style={
        bgImage
          ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: `linear-gradient(160deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }
      }
    >
      {/* Velo para legibilidad de las tarjetas sobre el fondo. */}
      <div className="pointer-events-none absolute inset-0 bg-black/25" />

      <div className="relative mx-auto max-w-xl space-y-5">
        {/* Logo transparente, arriba, sobre el fondo. */}
        {branding?.logo_url ? (
          <Image
            src={branding.logo_url}
            alt={`Logo de ${event?.name || 'evento'}`}
            width={220}
            height={132}
            unoptimized
            className="mx-auto h-20 w-auto max-w-[70%] object-contain drop-shadow-lg"
          />
        ) : (
          <p className="pt-4 text-center text-sm font-semibold uppercase tracking-[0.28em] text-white/85">
            {event?.name || 'Tu evento'}
          </p>
        )}

        {/* Tarjeta principal: el evento. */}
        <section className="rounded-[28px] border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary-foreground">
              Acceso digital
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accessState.pill}`}>
              {accessState.label}
            </span>
          </div>

          <h1 className="mt-4 text-center text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: primaryColor }}>
            {event?.name || 'Evento privado'}
          </h1>
          {guestDisplayName && (
            <p className="mt-2 text-center text-sm text-slate-600">{guestDisplayName}, gestioná tu invitación</p>
          )}

          <div className="mt-6 grid gap-4 text-center text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fecha y hora</p>
              <p className="mt-1 font-semibold">
                {event?.event_date ? formatDate(event.event_date) : 'A confirmar'}
                {event?.start_time ? ` · ${formatTime(event.start_time)} hs` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Lugar</p>
              <p className="mt-1 font-semibold">{event?.venue_name || 'Venue privado'}</p>
              {event?.venue_address && <p className="mt-0.5 text-xs text-slate-500">{event.venue_address}</p>}
              {invitationConfig?.directionsUrl && (
                <a
                  href={invitationConfig.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-semibold underline"
                  style={{ color: primaryColor }}
                >
                  Cómo llegar →
                </a>
              )}
            </div>
            {invitationConfig?.dresscode && (
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dresscode</p>
                <p className="mt-1 font-semibold">{invitationConfig.dresscode}</p>
              </div>
            )}
          </div>
        </section>

        {/* Estado del acceso. */}
        <section className={`rounded-[28px] border p-6 shadow-xl ${accessState.tone}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Estado del acceso</p>
          <h3 className="mt-2 text-xl font-semibold">{accessState.title}</h3>
          <p className="mt-2 text-sm leading-6 opacity-85">{accessState.detail}</p>
        </section>

        {!accessReady ? (
          /* Paso previo: formulario de confirmacion. */
          <section className="rounded-[28px] border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Paso previo al ingreso</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">Confirmá tu asistencia y completá tus datos</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Funciona como save the date y confirmación final. Al completarlo, el sistema habilita tu QR de ingreso.
            </p>
            <div className="mt-5">
              <InvitationResponseForm
                token={token}
                initialData={{
                  attendanceResponse: invitationResponseForForm,
                  firstName: guest?.first_name || '',
                  lastName: guest?.last_name || '',
                  email: guest?.email || '',
                  phone: guest?.phone || '',
                  dni: guest?.document_number || invitationDetails.dni,
                  plusOnesAllowed: 0,
                  plusOnesConfirmed: 0,
                  companionNames: invitationDetails.companionNames,
                  dietaryRequirements: invitationDetails.dietaryRequirements,
                  song: invitationDetails.song,
                  greeting: invitationDetails.greeting,
                  observations: invitationDetails.observations,
                  photoUrl: guest?.photo_url || '',
                }}
              />
            </div>
          </section>
        ) : (
          <>
            {/* QR de acceso. */}
            <section className="rounded-[28px] border border-white/50 bg-white/95 p-6 text-center shadow-2xl backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Tu acceso</p>
              <div className="mx-auto mt-4 w-full max-w-[280px] rounded-[24px] bg-white p-3 shadow-inner">
                <Image
                  src={qrCodeUrl}
                  alt="QR de acceso al evento"
                  width={640}
                  height={640}
                  unoptimized
                  className="w-full rounded-[16px]"
                />
              </div>
              <a
                href={qrCodeUrl}
                download={`alista-${event?.slug || 'acceso'}-${invitationToken.token.slice(-6)}.png`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-[0.97]"
                style={{ backgroundColor: primaryColor }}
              >
                Descargar QR
              </a>
              <p className="mt-3 text-xs leading-5 text-slate-500">Mostralo desde tu celular al llegar, con brillo suficiente.</p>
            </section>

            {/* Tu confirmacion. */}
            <section className="rounded-[28px] border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Tu confirmación</p>
              <div className="mt-3 space-y-1.5 text-sm text-slate-700">
                <p>DNI: {invitationDetails.dni || 'No informado'}</p>
                <p>Menú: {invitationDetails.dietaryRequirements || 'Sin aclaraciones'}</p>
                {invitationDetails.song && <p>Tu canción: {invitationDetails.song}</p>}
                {invitationDetails.greeting && <p>Saludo: {invitationDetails.greeting}</p>}
              </div>
            </section>

            {/* Accesos rapidos + token. */}
            {(mapsUrl || calendarUrl || phoneHref) && (
              <section className="rounded-[28px] border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Accesos rápidos</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                      Ver ubicación
                    </a>
                  )}
                  {calendarUrl && (
                    <a href={calendarUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                      Agendar
                    </a>
                  )}
                  {phoneHref && (
                    <a href={phoneHref} className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                      Contactar
                    </a>
                  )}
                </div>
                <div className="mt-4 rounded-[18px] border border-dashed border-border bg-secondary/40 p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Token de respaldo</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-600">{invitationToken.token}</p>
                </div>
              </section>
            )}
          </>
        )}

        <footer className="pb-2 pt-1 text-center text-xs uppercase tracking-[0.28em] text-white/80">
          Desarrollado por Alista
        </footer>
      </div>
    </main>
  )
}

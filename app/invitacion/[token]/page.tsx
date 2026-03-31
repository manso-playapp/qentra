import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import InvitationResponseForm from '@/components/invitation/InvitationResponseForm'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { normalizeGuestStatus } from '@/lib/guest-schema'
import { isInvitationAccessReady, parseInvitationDetails } from '@/lib/invitation-response'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
    .select('id, event_id, first_name, last_name, email, phone, status, document_number, notes')
    .eq('id', invitationToken.guest_id)
    .maybeSingle()

  const [{ data: event }, { data: branding }] = guest?.event_id
    ? await Promise.all([
        supabase
          .from('events')
          .select('id, name, slug, event_date, start_time, venue_name, venue_address, status, description, contact_phone')
          .eq('id', guest.event_id)
          .maybeSingle(),
        supabase
          .from('event_branding')
          .select('primary_color, secondary_color, logo_url, banner_url')
          .eq('event_id', guest.event_id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }]
  const invitationDetails = parseInvitationDetails(guest?.notes)

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

  const accessReady = isInvitationAccessReady(guest?.status, invitationDetails.paymentStatus)
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
          invitationDetails.paymentStatus === 'pending'
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

  return (
    <main
      className="min-h-screen px-4 py-6 text-slate-950 sm:px-6 sm:py-8"
      style={{
        background: `radial-gradient(circle at top, ${secondaryColor} 0%, #f8fafc 42%, #ffffff 100%)`,
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section
          className="relative overflow-hidden rounded-[36px] border border-black/5 px-6 py-7 text-white shadow-[0_28px_90px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8"
          style={{
            background: branding?.banner_url
              ? `linear-gradient(135deg, rgba(15,23,42,0.62), rgba(15,23,42,0.78)), url(${branding.banner_url}) center/cover no-repeat`
              : `linear-gradient(135deg, ${primaryColor} 0%, #1f2937 100%)`,
          }}
        >
          <div className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_65%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-end">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
                  Acceso digital
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accessState.pill}`}>
                  {accessState.label}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-4">
                {branding?.logo_url ? (
                  <Image
                    src={branding.logo_url}
                    alt={`Logo de ${event?.name || 'Qentra'}`}
                    width={96}
                    height={96}
                    unoptimized
                    className="h-16 w-16 rounded-2xl border border-white/15 bg-white/10 object-contain p-2"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-semibold">
                    Q
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white/70">Evento</p>
                  <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">
                    {event?.name || 'Evento privado'}
                  </h1>
                </div>
              </div>

              <h2 className="mt-8 text-2xl font-semibold leading-tight sm:text-3xl">
                {guestDisplayName ? `${guestDisplayName}, gestiona tu invitacion` : 'Gestiona tu invitacion antes del ingreso'}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">{accessState.detail}</p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/65">Resumen rapido</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-white/65">Fecha</p>
                  <p className="mt-1 text-lg font-semibold">{event?.event_date ? formatDate(event.event_date) : 'A confirmar'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/65">Horario</p>
                  <p className="mt-1 text-lg font-semibold">{event?.start_time ? `${formatTime(event.start_time)} hs` : 'A confirmar'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/65">Lugar</p>
                  <p className="mt-1 text-lg font-semibold">{event?.venue_name || 'Venue privado'}</p>
                  {event?.venue_address && <p className="mt-2 text-sm leading-6 text-white/75">{event.venue_address}</p>}
                </div>
                <div>
                  <p className="text-sm text-white/65">Vigencia del acceso</p>
                  <p className="mt-1 text-base font-semibold">{formatDateTime(invitationToken.expires_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className={`rounded-[32px] border p-6 shadow-[0_18px_70px_rgba(15,23,42,0.08)] ${accessState.tone}`}>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] opacity-70">Estado del acceso</p>
              <h3 className="mt-3 text-2xl font-semibold">{accessState.title}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 opacity-85">{accessState.detail}</p>
            </div>

            {!accessReady ? (
              <div className="rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Paso previo al ingreso</p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">Confirma tu asistencia y completa tus datos</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Este paso funciona como save the date y confirmacion final. Una vez completado, el sistema habilita el QR de ingreso.
                </p>
                <div className="mt-6">
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
                      observations: invitationDetails.observations,
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Tu confirmacion</p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      <p>Asistencia confirmada.</p>
                      <p>DNI: {invitationDetails.dni || 'No informado'}</p>
                      <p>Acompanantes: gestion pendiente para una version posterior</p>
                      <p>Menu: {invitationDetails.dietaryRequirements || 'Sin aclaraciones'}</p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Informacion util</p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      <p>Muestra este QR directamente desde tu celular al llegar.</p>
                      <p>Si cambias de dispositivo, vuelve a abrir este mismo enlace.</p>
                      <p>Si necesitas ayuda en puerta, el equipo tambien puede localizar tu acceso con el token de respaldo.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Accesos rapidos</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Ver ubicacion
                      </a>
                    )}
                    {calendarUrl && (
                      <a
                        href={calendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      >
                        Agendar evento
                      </a>
                    )}
                    {phoneHref && (
                      <a
                        href={phoneHref}
                        className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      >
                        Contactar organizacion
                      </a>
                    )}
                  </div>

                  <div className="mt-6 rounded-[24px] border border-dashed border-border bg-secondary/40 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Token de respaldo</p>
                    <p className="mt-3 break-all font-mono text-xs text-slate-700">{invitationToken.token}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-[34px] border border-border/70 bg-card p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div
                className="rounded-[28px] border border-black/5 p-4"
                style={{
                  background: `linear-gradient(180deg, ${secondaryColor} 0%, #ffffff 100%)`,
                }}
              >
                <div className="rounded-[24px] bg-white p-4 shadow-[0_14px_50px_rgba(15,23,42,0.08)]">
                  {accessReady ? (
                    <Image
                      src={qrCodeUrl}
                      alt="QR de acceso al evento"
                      width={640}
                      height={640}
                      unoptimized
                      className="mx-auto w-full max-w-[310px] rounded-[24px]"
                    />
                  ) : (
                    <div className="flex min-h-[310px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm leading-7 text-slate-500">
                      El QR final aparecera aqui una vez que completes la gestion de tu invitacion y confirmes asistencia.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {accessReady ? (
                  <a
                    href={qrCodeUrl}
                    download={`qentra-${event?.slug || 'acceso'}-${invitationToken.token.slice(-6)}.png`}
                    className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-[0.97]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Descargar QR
                  </a>
                ) : (
                  <div className="inline-flex w-full items-center justify-center rounded-full border border-border bg-secondary/40 px-5 py-3 text-sm font-semibold text-slate-600">
                    QR pendiente de confirmacion
                  </div>
                )}
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Ir al inicio
                </Link>
              </div>

              <div className="mt-5 rounded-[24px] border border-border bg-secondary/45 p-4 text-sm leading-6 text-muted-foreground">
                {accessReady
                  ? 'Presenta este QR completo y con brillo suficiente. Si el equipo necesita asistencia extra, tambien puede usar el token de respaldo.'
                  : 'Primero confirma asistencia y completa los datos del invitado. Ese paso habilita el QR final de ingreso.'}
              </div>
            </div>
          </aside>
        </section>

        <footer className="pb-2 text-center text-xs uppercase tracking-[0.28em] text-slate-500">
          Desarrollado por Qentra
        </footer>
      </div>
    </main>
  )
}

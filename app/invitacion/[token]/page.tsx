import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
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

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  const { token } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const supabase = await createServerSupabaseClient()

  const { data: invitationToken, error: invitationError } = await supabase
    .from('invitation_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (invitationError) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_45%,_#e2e8f0)] px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white/90 p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600">Invitacion</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">No se pudo cargar tu acceso</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Intenta nuevamente mas tarde o contacta al equipo del evento para reenviar la invitacion.
          </p>
        </div>
      </main>
    )
  }

  if (!invitationToken) {
    notFound()
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, name, slug, event_date, start_time, venue_name, venue_address, status')
    .eq('id', invitationToken.event_id)
    .maybeSingle()

  const { data: branding } = await supabase
    .from('event_branding')
    .select('primary_color, secondary_color, font_family')
    .eq('event_id', invitationToken.event_id)
    .maybeSingle()

  const guestDisplayName = resolvedSearchParams?.guest?.trim()
  const qrPayload = buildGuestAccessQrPayload({
    eventId: invitationToken.event_id,
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
  const primaryColor = branding?.primary_color || '#0f172a'
  const secondaryColor = branding?.secondary_color || '#e2e8f0'

  return (
    <main
      className="min-h-screen px-4 py-8 text-slate-950 sm:px-6"
      style={{
        background: `linear-gradient(160deg, ${secondaryColor} 0%, #f8fafc 38%, #ffffff 100%)`,
        fontFamily: branding?.font_family || 'Georgia, serif',
      }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/88 shadow-[0_20px_80px_rgba(15,23,42,0.18)] backdrop-blur">
          <section
            className="relative overflow-hidden px-6 py-8 sm:px-10"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%)`,
            }}
          >
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.22),_transparent_60%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/70">Qentra Access</p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight">
                  {guestDisplayName ? `${guestDisplayName}, tu acceso ya esta listo` : 'Tu acceso al evento ya esta listo'}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/80">
                  Presenta este QR en la puerta desde tu celular. El equipo de recepcion lo validara antes de habilitar el ingreso.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85">
                <p>Vigencia hasta</p>
                <p className="mt-1 text-base font-semibold">{formatDateTime(invitationToken.expires_at)}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Evento</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                {event?.name || 'Evento privado'}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fecha</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {event ? formatDate(event.event_date) : 'Pendiente'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{event?.start_time || 'Horario a confirmar'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lugar</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{event?.venue_name || 'Venue a confirmar'}</p>
                  <p className="mt-1 text-sm text-slate-600">{event?.venue_address || 'Direccion a confirmar'}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Indicaciones</p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  <p>Muestra este QR directamente en la puerta. No hace falta imprimirlo.</p>
                  <p>Si el acceso ya fue utilizado, esta fuera de horario o el evento tiene una regla especial de ingreso, el equipo de recepcion puede bloquear la entrada.</p>
                  <p>Si necesitas reenvio o asistencia, responde al canal por el que recibiste esta invitacion.</p>
                </div>
              </div>
            </div>

            <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                {/* Intentionally large for door scanning on mobile screens */}
                <Image
                  src={qrCodeUrl}
                  alt="QR de acceso al evento"
                  width={640}
                  height={640}
                  unoptimized
                  className="mx-auto w-full max-w-[280px] rounded-2xl"
                />
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Token de respaldo</p>
                <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-700">
                  {invitationToken.token}
                </p>
                <a
                  href={qrCodeUrl}
                  download={`qentra-${event?.slug || 'acceso'}-${invitationToken.token.slice(-6)}.png`}
                  className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Descargar QR
                </a>
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Volver
                </Link>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SURFACE_BRANDING_COLUMNS, type Event, type SurfaceBranding } from '@/types'

export const metadata = {
  title: 'Preview de invitación',
}

type PreviewPageProps = {
  params: Promise<{ id: string }>
}

function formatDate(isoDate?: string) {
  if (!isoDate) return ''
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Preview de la invitacion con branding REAL y un invitado ficticio. No consume
// tokens ni toca datos: refleja lo que el editor controla (portada, colores,
// logo, bienvenida), no la logica de QR/formulario de la invitacion real.
export default async function InvitationPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [eventResponse, brandingResponse] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, event_date, start_time, venue_name, venue_address')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('event_branding').select(SURFACE_BRANDING_COLUMNS).eq('event_id', id).maybeSingle(),
  ])

  if (!eventResponse.data) {
    notFound()
  }

  const event = eventResponse.data as Pick<
    Event,
    'id' | 'name' | 'event_date' | 'start_time' | 'venue_name' | 'venue_address'
  >
  const branding = (brandingResponse.data ?? null) as SurfaceBranding | null

  const primaryColor = branding?.primary_color || '#8b5e3c'
  const secondaryColor = branding?.secondary_color || '#f1e8da'
  const coverImage = branding?.cover_image_url || branding?.background_image_url
  const welcome = branding?.welcome_message || 'Nos encantaría contar con tu presencia.'

  return (
    <main
      className="min-h-screen px-4 py-6 text-slate-950 sm:px-6 sm:py-8"
      style={{ background: `radial-gradient(circle at top, ${secondaryColor} 0%, #f8fafc 42%, #ffffff 100%)` }}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Cartel de preview: deja claro que no es la invitacion real. */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          <span className="font-semibold">Vista previa · datos de ejemplo</span>
          <Link
            href={`/admin/events/${event.id}/branding`}
            className="rounded-full bg-amber-900/10 px-3 py-1 text-xs font-semibold hover:bg-amber-900/20"
          >
            Editar branding
          </Link>
        </div>

        <section
          className="relative overflow-hidden rounded-[36px] border border-black/5 px-6 py-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.16)] sm:px-8"
          style={{
            background: coverImage
              ? `linear-gradient(135deg, rgba(15,23,42,0.62), rgba(15,23,42,0.78)), url(${coverImage}) center/cover no-repeat`
              : `linear-gradient(135deg, ${primaryColor} 0%, #1f2937 100%)`,
          }}
        >
          <div className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_65%)]" />
          <div className="relative">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
              Acceso digital
            </span>

            <div className="mt-5 flex items-center gap-4">
              {branding?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logo_url}
                  alt={event.name}
                  className="h-16 w-16 rounded-2xl border border-white/15 bg-white/10 object-contain p-2"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-semibold">
                  Q
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white/70">Evento</p>
                <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">{event.name}</h1>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">{welcome}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Fecha</p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {formatDate(event.event_date)} · {event.start_time}
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Lugar</p>
                <p className="mt-1 text-sm font-semibold">{event.venue_name}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Invitado de ejemplo</p>
              <p className="text-lg font-semibold text-slate-900">Martina Gómez</p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Confirmado
            </span>
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <div className="flex size-20 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-semibold text-white">
              QR
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Acá el invitado real ve su código QR de ingreso. En la vista previa se representa con un
              marcador porque no hay un invitado cargado.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

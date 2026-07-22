import { notFound } from 'next/navigation'
import InvitationView, {
  buildAccessState,
  buildCalendarUrl,
  type InvitationEventInfo,
} from '@/components/invitation/InvitationView'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SURFACE_BRANDING_COLUMNS, type SurfaceBranding } from '@/types'

export const metadata = {
  title: 'Vista previa · Invitación',
}

type PreviewPageProps = {
  params: Promise<{ eventId: string }>
}

export default async function InvitationPreviewPage({ params }: PreviewPageProps) {
  const { eventId } = await params
  const supabase = getSupabaseAdminClient() ?? (await createServerSupabaseClient())

  const [eventResponse, brandingResponse] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, slug, event_date, start_time, venue_name, venue_address, status, description, contact_phone')
      .eq('id', eventId)
      .maybeSingle(),
    supabase.from('event_branding').select(SURFACE_BRANDING_COLUMNS).eq('event_id', eventId).maybeSingle(),
  ])

  if (eventResponse.error || !eventResponse.data) {
    notFound()
  }

  const branding = (brandingResponse.data ?? null) as SurfaceBranding | null
  const eventInfo = eventResponse.data as InvitationEventInfo

  const calendarUrl = buildCalendarUrl(eventInfo)

  // Estado inicial modelo: invitado pendiente de confirmar, sin pago, sin QR.
  const accessState = buildAccessState({
    invitationUsed: false,
    eventInactive: false,
    accessReady: false,
    invitationResponse: 'pending',
    paymentStatus: 'not_required',
  })

  return (
    <InvitationView
      event={eventInfo}
      branding={branding}
      guestDisplayName="Invitado/a de ejemplo"
      accessState={accessState}
      calendarUrl={calendarUrl}
      isPreview
    >
      {/* Formulario deshabilitado: muestra cómo se vería el paso previo sin
          enviar datos reales. */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[#fcb39e] [&>p:first-child]:border-b-2 [&>p:first-child]:border-dashed [&>p:first-child]:border-slate-300 [&>p:first-child]:pb-4 [&_h3]:!text-slate-950 [&_p]:!text-slate-600">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Paso previo al ingreso</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Confirmá tu asistencia y completá tus datos</h3>
        <p className="mt-2 text-sm leading-6 text-white/70">
          Así verá cada invitado el formulario antes de confirmar. En la vista previa los campos no envían datos.
        </p>

        <div className="mt-5 space-y-3 opacity-60" aria-hidden="true">
          <div className="rounded-[14px] border border-white/15 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Nombre y apellido</p>
            <div className="mt-2 h-9 rounded-lg bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-white/15 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">DNI</p>
              <div className="mt-2 h-9 rounded-lg bg-white/10" />
            </div>
            <div className="rounded-[14px] border border-white/15 bg-white/5 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Teléfono</p>
              <div className="mt-2 h-9 rounded-lg bg-white/10" />
            </div>
          </div>
          <div className="rounded-[14px] border border-white/15 bg-white/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Asistencia</p>
            <div className="mt-2 flex gap-2">
              <div className="h-9 flex-1 rounded-lg bg-white/10" />
              <div className="h-9 flex-1 rounded-lg bg-white/10" />
            </div>
          </div>
          <div className="rounded-[14px] border border-dashed border-amber-300/30 bg-amber-300/5 p-3 text-center text-xs text-amber-100/70">
            Vista previa · el botón de envío está deshabilitado
          </div>
        </div>
      </section>
    </InvitationView>
  )
}

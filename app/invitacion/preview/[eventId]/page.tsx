import { notFound } from 'next/navigation'
import InvitationView, {
  buildAccessState,
  buildCalendarUrl,
  type InvitationConfigInfo,
  type InvitationEventInfo,
} from '@/components/invitation/InvitationView'
import { getInvitationTemplate, normalizeInvitationTemplate } from '@/lib/invitation-templates'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SURFACE_BRANDING_COLUMNS, type SurfaceBranding } from '@/types'

export const metadata = {
  title: 'Vista previa · Invitación',
}

type PreviewPageProps = {
  params: Promise<{ eventId: string }>
  searchParams?: Promise<{ template?: string }>
}

export default async function InvitationPreviewPage({ params, searchParams }: PreviewPageProps) {
  const { eventId } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const supabase = getSupabaseAdminClient() ?? (await createServerSupabaseClient())

  const [eventResponse, brandingResponse] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, slug, event_date, start_time, venue_name, venue_address, dresscode, directions_url, status, description, gift_info, contact_phone')
      .eq('id', eventId)
      .maybeSingle(),
    supabase.from('event_branding').select(SURFACE_BRANDING_COLUMNS).eq('event_id', eventId).maybeSingle(),
  ])

  if (eventResponse.error || !eventResponse.data) {
    notFound()
  }

  const branding = (brandingResponse.data ?? null) as SurfaceBranding | null
  const invitationConfig = (branding?.config ?? {}) as InvitationConfigInfo
  const invitationTemplate = resolvedSearchParams?.template
    ? normalizeInvitationTemplate(resolvedSearchParams.template)
    : getInvitationTemplate(invitationConfig)
  const eventInfo = eventResponse.data as InvitationEventInfo

  const calendarUrl = buildCalendarUrl(eventInfo)

  // Estado inicial modelo: invitado pendiente de confirmar, sin pago, sin QR.
  const accessState = buildAccessState({
    invitationUsed: false,
    invitationExpired: false,
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
      calendarUrl={calendarUrl}
      template={invitationTemplate}
      config={invitationConfig}
      isPreview
    >
      {/* Formulario deshabilitado: muestra cómo se vería el paso previo sin
          enviar datos reales. */}
      <section className="invitation-surface-card relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[#fcb39e]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-slate-300 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Estado del acceso</p>
          <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold text-white">{accessState.label}</span>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-950">{accessState.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{accessState.detail}</p>

        <div className="mt-5 space-y-3" aria-hidden="true">
          <div className="rounded-[14px] border border-slate-300 bg-white/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Nombre y apellido</p>
            <div className="mt-2 h-9 rounded-lg border border-slate-200 bg-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[14px] border border-slate-300 bg-white/80 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">DNI</p>
              <div className="mt-2 h-9 rounded-lg border border-slate-200 bg-slate-100" />
            </div>
            <div className="rounded-[14px] border border-slate-300 bg-white/80 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Teléfono</p>
              <div className="mt-2 h-9 rounded-lg border border-slate-200 bg-slate-100" />
            </div>
          </div>
          <div className="rounded-[14px] border border-slate-300 bg-white/80 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Asistencia</p>
            <div className="mt-2 flex gap-2">
              <div className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-100" />
              <div className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-100" />
            </div>
          </div>
          <div className="rounded-[14px] border border-dashed border-amber-400/60 bg-amber-100/80 p-3 text-center text-xs font-medium text-amber-950">
            Vista previa · el botón de envío está deshabilitado
          </div>
        </div>
      </section>
    </InvitationView>
  )
}

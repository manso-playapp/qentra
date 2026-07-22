import Image from 'next/image'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import InvitationResponseForm from '@/components/invitation/InvitationResponseForm'
import InvitationView, {
  buildAccessState,
  buildCalendarUrl,
  type InvitationEventInfo,
} from '@/components/invitation/InvitationView'
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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e2e8f0,#f8fafc_45%,#ffffff)] px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-4xl border border-red-200 bg-white/92 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600">Acceso digital</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">No se pudo cargar tu acceso</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Intenta nuevamente más tarde o pedí al equipo del evento que reenvíe la invitación.
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
    .select('id, event_id, first_name, last_name, email, phone, status, notes, payment_status, photo_url')
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

  if (brandingResponse.error) {
    console.error('[invitacion] no se pudo cargar el branding del evento', brandingResponse.error)
  }

  const branding = (brandingResponse.data ?? null) as SurfaceBranding | null

  const invitationDetails = parseInvitationDetails(guest?.notes)
  const paymentStatus = (guest?.payment_status ?? 'not_required') as 'not_required' | 'pending' | 'approved'

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
  const invitationResponseForForm = invitationResponse === 'checked_in' ? 'confirmed' : invitationResponse

  const accessReady = isInvitationAccessReady(guest?.status, paymentStatus)
  const primaryColor = '#fcb39e'

  const invitationUsed =
    Boolean(invitationToken.last_used_at) ||
    (invitationToken.used_count ?? 0) > 0 ||
    invitationToken.is_active === false
  const eventInactive = event?.status === 'cancelled' || event?.status === 'inactive'

  const accessState = buildAccessState({
    invitationUsed,
    eventInactive,
    accessReady,
    invitationResponse,
    paymentStatus,
    lastUsedAt: invitationToken.last_used_at,
  })

  const eventInfo = (event ?? {}) as InvitationEventInfo
  const calendarUrl = buildCalendarUrl(eventInfo)

  // El QR y su payload solo se generan si el acceso está listo: en la rama
  // pendiente no se muestran y no tiene sentido gastar el render.
  let qrCodeUrl: string | null = null
  if (accessReady && !invitationUsed && !eventInactive) {
    const qrPayload = buildGuestAccessQrPayload({
      eventId: guest?.event_id,
      eventSlug: event?.slug,
      guestId: invitationToken.guest_id,
      guestName: guestDisplayName,
      token: invitationToken.token,
      issuedAt: invitationToken.created_at,
    })
    qrCodeUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 640,
    })
  }

  return (
    <InvitationView
      event={eventInfo}
      branding={branding}
      guestDisplayName={guestDisplayName}
      accessState={accessState}
      calendarUrl={calendarUrl}
    >
      {!accessReady ? (
        <section className="relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-slate-950 [&>p:first-child]:border-b-2 [&>p:first-child]:border-dashed [&>p:first-child]:border-slate-300 [&>p:first-child]:pb-4 [&_h3]:!text-slate-950 [&_p]:!text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Paso previo al ingreso</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Confirmá tu asistencia y completá tus datos</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
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
                dni: invitationDetails.dni,
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
          <section className="relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-center text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-slate-950 [&>p:first-child]:border-b-2 [&>p:first-child]:border-dashed [&>p:first-child]:border-slate-300 [&>p:first-child]:pb-4 [&_p]:!text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Tu acceso</p>
            {qrCodeUrl && (
              <>
                <div className="mx-auto mt-4 w-full max-w-70 rounded-3xl bg-white p-3 shadow-inner">
                  <Image
                    src={qrCodeUrl}
                    alt="QR de acceso al evento"
                    width={640}
                    height={640}
                    unoptimized
                    className="w-full rounded-2xl"
                  />
                </div>
                <a
                  href={qrCodeUrl}
                  download={`alista-${event?.slug || 'acceso'}-${invitationToken.token.slice(-6)}.png`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-[0.97]"
                  style={{ backgroundColor: primaryColor }}
                >
                  Descargar QR
                </a>
              </>
            )}
            <p className="mt-3 text-xs leading-5 text-white/60">Mostralo desde tu celular al llegar, con brillo suficiente.</p>
          </section>

          {/* Tu confirmación: solo lo que ya completaste, sin repetir el estado. */}
          <section className="relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-slate-950 [&>p:first-child]:border-b-2 [&>p:first-child]:border-dashed [&>p:first-child]:border-slate-300 [&>p:first-child]:pb-4 [&_dt]:!text-slate-500 [&_dd]:!text-slate-800 [&_p]:!text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Tu confirmación</p>
            <dl className="mt-3 space-y-2 text-sm text-white/85">
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">DNI</dt>
                <dd className="font-medium text-right">{invitationDetails.dni || 'No informado'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Menú</dt>
                <dd className="font-medium text-right">{invitationDetails.dietaryRequirements || 'Sin aclaraciones'}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-[18px] border border-dashed border-white/25 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Token de respaldo</p>
              <p className="mt-1 break-all font-mono text-xs text-white/75">{invitationToken.token}</p>
            </div>
          </section>
        </>
      )}
    </InvitationView>
  )
}

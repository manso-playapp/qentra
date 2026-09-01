import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import QRCode from 'qrcode'
import InvitationPaymentButton from '@/components/invitation/InvitationPaymentButton'
import InvitationPaymentStatusSyncButton from '@/components/invitation/InvitationPaymentStatusSyncButton'
import InvitationQrDownloadButton from '@/components/invitation/InvitationQrDownloadButton'
import InvitationResponseForm from '@/components/invitation/InvitationResponseForm'
import InvitationView, {
  buildAccessState,
  buildCalendarUrl,
  getInvitationColors,
  type InvitationConfigInfo,
  type InvitationEventInfo,
} from '@/components/invitation/InvitationView'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { normalizeGuestStatus } from '@/lib/guest-schema'
import { isInvitationExpired } from '@/lib/invitation-expiry'
import { isInvitationAccessReady, parseInvitationDetails } from '@/lib/invitation-response'
import { getInvitationTemplate } from '@/lib/invitation-templates'
import { buildAbsoluteAppUrl } from '@/lib/public-url'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { getPublishedInvitationConfig } from '@/lib/invitation-config-state'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SURFACE_BRANDING_COLUMNS, type SurfaceBranding } from '@/types'

type InvitationPageProps = {
  params: Promise<{ token: string }>
  searchParams?: Promise<{ guest?: string; confirmed?: string }>
}

const fallbackInvitationDescription = 'Estás invitado/a a una fiesta de 15.'

function buildInvitationDescription(eventName: string) {
  return `Est\u00e1s invitado/a al cumple de ${eventName}. Gestionado por Alista.com.ar`
}

function invitationShareImageUrl(imageUrl: string | null | undefined) {
  const normalized = imageUrl?.trim()
  if (!normalized) return buildAbsoluteAppUrl('/portada.jpg')
  return /^https?:\/\//i.test(normalized) ? normalized : buildAbsoluteAppUrl(normalized)
}

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { token } = await params
  const supabase = getSupabaseAdminClient() ?? (await createServerSupabaseClient())

  const { data: invitationToken } = await supabase
    .from('invitation_tokens')
    .select('guest_id')
    .eq('token', token)
    .maybeSingle()

  let eventName = 'Invitación'
  let description = fallbackInvitationDescription
  const shareImageUrl = invitationShareImageUrl('/invitacion/share-image')

  if (invitationToken?.guest_id) {
    const { data: guest } = await supabase
      .from('guests')
      .select('event_id')
      .eq('id', invitationToken.guest_id)
      .maybeSingle()

    if (guest?.event_id) {
      const { data: event } = await supabase
        .from('events')
        .select('name, description')
        .eq('id', guest.event_id)
        .maybeSingle()

      eventName = event?.name?.trim() || eventName
      description = buildInvitationDescription(eventName)
      description = event?.description?.trim() || `Estás invitado/a a ${eventName}.`
    }
  }

  description = buildInvitationDescription(eventName)
  const pageUrl = buildAbsoluteAppUrl(`/invitacion/${encodeURIComponent(token)}`)

  return {
    robots: { index: false, follow: false },
    title: `${eventName} · Invitación`,
    description,
    openGraph: {
      title: eventName,
      description,
      url: pageUrl,
      type: 'website',
      locale: 'es_AR',
      siteName: 'Alista',
      images: [{ url: shareImageUrl, alt: `Invitación ${eventName}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: eventName,
      description,
      images: [shareImageUrl],
    },
  }
}

export default async function InvitationPage({ params, searchParams }: InvitationPageProps) {
  // La vigencia depende de la hora de cada solicitud. Evita que Next conserve
  // una pagina con QR generada antes del vencimiento.
  await connection()

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
    .select(`
      id, event_id, guest_type_id, first_name, last_name, email, phone, status, notes, payment_status, photo_url,
      plus_ones_allowed, plus_ones_confirmed, companion_names,
      guest_types (name, payment_amount_cents, show_gift_info, access_start_time, access_start_day_offset)
    `)
    .eq('id', invitationToken.guest_id)
    .maybeSingle()

  const [{ data: event }, brandingResponse] = guest?.event_id
    ? await Promise.all([
        supabase
          .from('events')
          .select('id, name, slug, event_date, start_time, venue_name, venue_address, dresscode, directions_url, status, description, gift_info, contact_phone')
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
  const invitationConfig = getPublishedInvitationConfig(branding?.config ?? {}) as InvitationConfigInfo
  const invitationTemplate = getInvitationTemplate(invitationConfig)

  const invitationDetails = parseInvitationDetails(guest?.notes)
  const companionNames = Array.isArray(guest?.companion_names) && guest.companion_names.length > 0
    ? guest.companion_names.join('\n')
    : invitationDetails.companionNames
  const paymentStatus = (guest?.payment_status ?? 'not_required') as 'not_required' | 'pending' | 'approved'
  const guestType = Array.isArray(guest?.guest_types) ? guest.guest_types[0] : guest?.guest_types
  const paymentAmountCents = guestType?.payment_amount_cents ?? 0
  const invitationSchedule = {
    startTime: guestType?.access_start_time,
    startDayOffset: guestType?.access_start_day_offset,
  }

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
  const isMidnight = invitationTemplate === 'midnight'
  const primaryColor = isMidnight ? getInvitationColors(branding, invitationConfig).accent : '#fcb39e'

  const invitationUsed =
    Boolean(invitationToken.last_used_at) ||
    (invitationToken.used_count ?? 0) > 0 ||
    invitationToken.is_active === false
  const invitationExpired = isInvitationExpired(invitationToken.expires_at)
  const canEditInvitation =
    !accessReady && !invitationUsed && !invitationExpired && invitationResponse !== 'checked_in'
  const eventInactive = event?.status === 'cancelled' || event?.status === 'inactive'

  const accessState = buildAccessState({
    invitationUsed,
    invitationExpired,
    eventInactive,
    accessReady,
    invitationResponse,
    paymentStatus,
    lastUsedAt: invitationToken.last_used_at,
  })
  const showCheckinConfirmation =
    resolvedSearchParams?.confirmed === '1' && invitationResponse === 'confirmed' && accessReady && !invitationUsed

  const eventInfo = (event ?? {}) as InvitationEventInfo
  const calendarUrl = buildCalendarUrl(eventInfo, invitationSchedule)

  // El QR y su payload solo se generan si el acceso está listo: en la rama
  // pendiente no se muestran y no tiene sentido gastar el render.
  let qrCodeUrl: string | null = null
  if (accessReady && !invitationUsed && !invitationExpired && !eventInactive) {
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
      schedule={invitationSchedule}
      calendarUrl={calendarUrl}
      template={invitationTemplate}
      config={invitationConfig}
      showGiftInfo={guestType?.show_gift_info ?? true}
    >
      {invitationExpired ? (
        <section className="invitation-section invitation-surface-card relative overflow-hidden rounded-[28px] border border-rose-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-rose-500" data-invitation-block>
          {isMidnight ? (
            <>
              <h2 className="invitation-section-title">Acceso</h2>
              <p className="invitation-section-body mt-3">{accessState.detail}</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-slate-300 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Estado del acceso</p>
                <span className="rounded-full bg-rose-700 px-3 py-1 text-[11px] font-semibold text-white">
                  {accessState.label}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{accessState.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{accessState.detail}</p>
            </>
          )}
        </section>
      ) : canEditInvitation ? (
        <section className="invitation-section invitation-surface-card relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[#fcb39e]" data-invitation-block>
          {isMidnight ? (
            <h2 className="invitation-section-title">Tus Datos</h2>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-slate-300 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Estado del acceso</p>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold text-white">{accessState.label}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{accessState.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{accessState.detail}</p>
            </>
          )}
          <div className="mt-5">
            <InvitationResponseForm
              token={token}
              fields={invitationConfig.fields}
              initialData={{
                attendanceResponse: invitationResponseForForm,
                firstName: guest?.first_name || '',
                lastName: guest?.last_name || '',
                email: guest?.email || '',
                phone: guest?.phone || '',
                dni: invitationDetails.dni,
                plusOnesAllowed: Math.max(0, guest?.plus_ones_allowed ?? 0),
                plusOnesConfirmed: Math.max(0, guest?.plus_ones_confirmed ?? 0),
                companionNames,
                dietaryRequirements: invitationDetails.dietaryRequirements,
                song: invitationDetails.song,
                greeting: invitationDetails.greeting,
                observations: invitationDetails.observations,
                photoUrl: guest?.photo_url || '',
              }}
            />
          </div>
          {invitationResponse === 'confirmed' && paymentStatus === 'pending' && paymentAmountCents > 0 && (
            <>
              <InvitationPaymentButton token={token} amountCents={paymentAmountCents} />
              <InvitationPaymentStatusSyncButton token={token} />
            </>
          )}
        </section>
      ) : (
        <>
          {showCheckinConfirmation && (
            <section className="invitation-section invitation-surface-card relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[#fcb39e]" data-invitation-block>
              <p className="border-b-2 border-dashed border-slate-300 pb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Check-in confirmado
              </p>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">
                {isMidnight ? <>Ya est{'\u00E1'}s adentro. Nos vemos esta noche. {'\u2764\uFE0F'}</> : <>El pr{'\u00f3'}ximo destino: mis 15. {'\u2764\uFE0F'}</>}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isMidnight ? 'Una noche inolvidable te espera.' : 'Una noche inolvidable. Nos vemos a bordo.'}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-950">No olvides descargar tu QR.</p>
            </section>
          )}

          {!invitationUsed && (
            <section className="invitation-section invitation-surface-card relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-center text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[#fcb39e] [&>p:first-child]:border-b-2 [&>p:first-child]:border-dashed [&>p:first-child]:border-slate-300 [&>p:first-child]:pb-4 [&_p]:!text-slate-600" data-invitation-block>
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
                  <InvitationQrDownloadButton
                    qrCodeUrl={qrCodeUrl}
                    fileName={`alista-${event?.slug || 'acceso'}-${invitationToken.token.slice(-6)}.png`}
                    color={primaryColor}
                  />
                </>
              )}
              <p className="mt-3 text-xs leading-5 text-white/60">Mostralo desde tu celular al llegar, con brillo suficiente.</p>
            </section>
          )}

          {/* Tu confirmación: solo lo que ya completaste, sin repetir el estado. */}
          <section className="invitation-section invitation-surface-card relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[#fcb39e] [&>p:first-child]:border-b-2 [&>p:first-child]:border-dashed [&>p:first-child]:border-slate-300 [&>p:first-child]:pb-4 [&_dt]:!text-slate-500 [&_dd]:!text-slate-800 [&_p]:!text-slate-600" data-invitation-block>
            {isMidnight ? (
              <h2 className="invitation-section-title">Tus Datos</h2>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Tu confirmación</p>
            )}
            <dl className="mt-3 space-y-2 text-sm text-white/85">
              <div className="flex justify-between gap-4">
                <dt className="invitation-subtitle text-white/60">DNI</dt>
                <dd className="invitation-data font-medium text-right">{invitationDetails.dni || 'No informado'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="invitation-subtitle text-white/60">Menú</dt>
                <dd className="invitation-data font-medium text-right">{invitationDetails.dietaryRequirements || 'Sin aclaraciones'}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-[18px] border border-dashed border-white/25 bg-white/5 p-3">
              <p className="invitation-subtitle text-[10px] uppercase tracking-[0.24em] text-white/50">Token de respaldo</p>
              <p className="mt-1 break-all font-mono text-xs text-white/75">{invitationToken.token}</p>
            </div>
          </section>
        </>
      )}
    </InvitationView>
  )
}

import { notFound } from 'next/navigation'
import EventDashboard from '@/components/admin/EventDashboard'
import AdminLayout from '@/components/admin/AdminLayout'
import EventActivationCard from '@/components/admin/EventActivationCard'
import EventOwnershipCard from '@/components/admin/EventOwnershipCard'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { getEventScheduleEndDate, type AccessSchedule } from '@/lib/event-schedule'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMercadoPagoOAuthConfig } from '@/lib/mercadopago'
import { isPaymentCredentialEncryptionConfigured } from '@/lib/payment-credentials'
import { resolveActivation, type EventActivation } from '@/lib/event-activation'
import type { ActivationPaymentStatus } from '@/lib/alista-service-payment'
import { getCurrentOperatorProfile } from '@/lib/operator-auth'
import { isAlistaStaff } from '@/lib/event-access'
import type { Event, EventBranding } from '@/types'

export const metadata = {
  title: 'Resumen del evento',
}

type EventDetailPageProps = {
  params: Promise<{ id: string }>
}

type GuestStateRow = {
  status: string | null
  payment_status: string | null
}

type GuestTypePaymentRow = AccessSchedule & {
  payment_amount_cents: number | null
}

function argentinaTodayIso() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const valueFor = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${valueFor('year')}-${valueFor('month')}-${valueFor('day')}`
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const adminClient = getSupabaseAdminClient()
  const supabase = adminClient ?? (await createServerSupabaseClient())

  const [
    eventResponse,
    brandingResponse,
    guestTypesResponse,
    guestStatesResponse,
    checkinsCountResponse,
    paymentAccountResponse,
    activationResponse,
    activationPaymentResponse,
  ] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).maybeSingle(),
    supabase.from('event_branding').select('*').eq('event_id', id).maybeSingle(),
    supabase
      .from('guest_types')
      .select('payment_amount_cents, is_active, access_start_time, access_end_time, access_start_day_offset, access_end_day_offset')
      .eq('event_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('guests').select('status, payment_status').eq('event_id', id),
    supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('result', 'approved'),
    supabase
      .from('event_payment_accounts')
      .select('updated_at')
      .eq('event_id', id)
      .maybeSingle(),
    supabase
      .from('event_activations')
      .select('status, source, activated_at, expires_at, note')
      .eq('event_id', id)
      .maybeSingle(),
    supabase
      .from('event_activation_payments')
      .select('status')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (eventResponse.error) {
    return (
      <AdminLayout>
        <div className="mx-4 mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 sm:mx-0">
          No se pudo cargar el evento. Volvé a intentarlo en unos instantes.
        </div>
      </AdminLayout>
    )
  }

  if (!eventResponse.data) notFound()

  const event = eventResponse.data as Event
  const branding = brandingResponse.data as EventBranding | null
  const guestTypes = (guestTypesResponse.data ?? []) as GuestTypePaymentRow[]
  const guestRows = (guestStatesResponse.data ?? []) as GuestStateRow[]
  const guestCount = guestRows.length
  const checkinCount = checkinsCountResponse.count ?? 0
  const paymentAccount = paymentAccountResponse.data as { updated_at?: string | null } | null
  const paymentAccountConfigured = Boolean(getMercadoPagoOAuthConfig() && isPaymentCredentialEncryptionConfigured())
  const hasPaidAccess = guestTypes.some((guestType) => (guestType.payment_amount_cents ?? 0) > 0)
  const activation = activationResponse.data as
    | (EventActivation & { activated_at?: string | null; note?: string | null })
    | null
  const activationState = resolveActivation(activation)
  const activationPaymentStatus = (activationPaymentResponse.data as { status?: ActivationPaymentStatus } | null)?.status ?? null
  const authState = await getCurrentOperatorProfile()
  const staffAccess = isAlistaStaff(authState.access)
  const canPayActivation = !staffAccess && event.owner_user_id === authState.user?.id

  let currentOwnerEmail: string | null = null
  if (event.owner_user_id && adminClient) {
    const { data: ownerData } = await adminClient.auth.admin.getUserById(event.owner_user_id)
    currentOwnerEmail = ownerData.user?.email ?? null
  }
  if (!currentOwnerEmail && event.owner_user_id === authState.user?.id) {
    currentOwnerEmail = authState.user?.email ?? null
  }

  const withoutInvitation = guestRows.filter((guest) => guest.status === 'preinvited').length
  const awaitingConfirmation = guestRows.filter((guest) => guest.status === 'link_sent').length
  const pendingPayments = guestRows.filter((guest) => guest.payment_status === 'pending').length
  const readyGuests = guestRows.filter((guest) => guest.status === 'enabled' || guest.status === 'checked_in').length

  const attentionItems = [
    withoutInvitation > 0
      ? {
          title: `${withoutInvitation} ${withoutInvitation === 1 ? 'invitado todavía no tiene' : 'invitados todavía no tienen'} su invitación generada`,
          detail: 'Sin link generado no hay nada para mandar. Generalos desde la gestión de invitados.',
          href: `/admin/events/${event.id}/guests`,
        }
      : null,
    awaitingConfirmation > 0
      ? {
          title: `${awaitingConfirmation} ${awaitingConfirmation === 1 ? 'invitación generada sin respuesta' : 'invitaciones generadas sin respuesta'}`,
          detail: 'Revisá las confirmaciones. Tener un link generado no indica si ya se compartió.',
          href: `/admin/events/${event.id}/guests`,
        }
      : null,
    hasPaidAccess && pendingPayments > 0
      ? {
          title: `${pendingPayments} ${pendingPayments === 1 ? 'pago pendiente' : 'pagos pendientes'} de revisión`,
          detail: 'La acreditación debe quedar asociada al invitado correcto.',
          href: `/admin/events/${event.id}/guests`,
        }
      : null,
    !branding?.cover_image_url
      ? {
          title: 'La invitación todavía no tiene portada',
          detail: 'Completá la imagen principal antes de compartirla.',
          href: `/admin/events/${event.id}/invitacion`,
        }
      : null,
    hasPaidAccess && !paymentAccount
      ? {
          title: 'La cuenta de cobros todavía no está vinculada',
          detail: 'Es necesaria para acreditar los pagos de invitados en la cuenta responsable.',
          href: '#cuenta-y-cobros',
        }
      : null,
  ].filter(Boolean) as { title: string; detail: string; href: string }[]

  const today = argentinaTodayIso()
  const lastAccessDate = getEventScheduleEndDate(event, guestTypes)
  const isEventDay = event.event_date <= today && today <= lastAccessDate
  const eventHasPassed = lastAccessDate < today
  const receptionTitle = isEventDay
    ? 'Hoy hay accesos programados'
    : eventHasPassed
      ? 'Resumen de la recepción'
      : 'Recepción y check-in'
  const receptionDetail = isEventDay
    ? 'Abrí Puerta para validar ingresos y usá el panel para seguir el aforo en tiempo real.'
    : eventHasPassed
      ? `${checkinCount} ${checkinCount === 1 ? 'ingreso registrado' : 'ingresos registrados'} durante el evento.`
      : 'Prepará el control de acceso ahora. El día de la fiesta esta sección pasará a ser la acción principal.'

  return (
    <EventDashboard
      event={event} branding={branding} guestTypes={guestTypes} guestRows={guestRows}
      guestsUnavailable={Boolean(guestStatesResponse.error)}
      guestCount={guestCount} readyGuests={readyGuests} checkinCount={checkinCount}
      pendingPayments={pendingPayments} hasPaidAccess={hasPaidAccess}
      attentionItems={attentionItems} isEventDay={isEventDay} eventHasPassed={eventHasPassed}
      receptionTitle={receptionTitle} receptionDetail={receptionDetail}
      serviceActive={activationState.activated}
      accountControls={<>
          <EventOwnershipCard
            event={event}
            currentOwnerEmail={currentOwnerEmail}
            canTransferOwnership={staffAccess}
            ownerUserId={event.owner_user_id}
            showPaymentAccount={hasPaidAccess}
            paymentAccount={{
              connected: Boolean(paymentAccount),
              configured: paymentAccountConfigured,
              updatedAt: paymentAccount?.updated_at,
            }}
          />
          <EventActivationCard
            event={event}
            state={activationState}
            activatedAt={activation?.activated_at}
            note={activation?.note}
            canGrant={staffAccess}
            canPay={canPayActivation}
            paymentStatus={activationPaymentStatus}
          />
      </>}
    />
  )
}

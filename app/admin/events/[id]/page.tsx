import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Mail,
  MapPin,
  Palette,
  Pencil,
  ScanLine,
  ShieldCheck,
  Tv,
  Users2,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import EventActivationCard from '@/components/admin/EventActivationCard'
import EventOwnershipCard from '@/components/admin/EventOwnershipCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { formatEventSchedule, getEventScheduleEndDate, type AccessSchedule } from '@/lib/event-schedule'
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

const EVENT_STATUS_LABELS = {
  active: 'Publicado',
  inactive: 'No publicado',
  cancelled: 'Cancelado',
} as const

const EVENT_STATUS_VARIANTS = {
  active: 'success',
  inactive: 'outline',
  cancelled: 'danger',
} as const

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
          detail: 'Pendiente de respuesta. La invitación ya tiene link; revisá su confirmación sin asumir que falta enviarla.',
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
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <header className="border-b border-border/70 pb-6">
          <Link href="/admin/events" className="text-sm font-medium text-primary hover:text-primary/80">
            ← Volver a eventos
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="admin-heading text-4xl leading-none text-foreground sm:text-5xl">{event.name}</h1>
                <Badge variant={EVENT_STATUS_VARIANTS[event.status] as 'success' | 'outline' | 'danger'}>
                  {EVENT_STATUS_LABELS[event.status]}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  {formatEventSchedule(event, guestTypes)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  {event.venue_name}
                </span>
              </div>
            </div>

            <Button asChild variant="outline">
              <Link href={`/admin/events/${event.id}/edit`}>
                <Pencil className="size-4" />
                Editar datos del evento
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            <span><strong className="text-lg text-foreground">{guestCount}</strong> invitados cargados</span>
            <span><strong className="text-lg text-foreground">{readyGuests}</strong> listos para ingresar</span>
            <span>Capacidad declarada: <strong className="text-foreground">{event.max_capacity}</strong></span>
            {isEventDay || eventHasPassed ? (
              <span><strong className="text-lg text-foreground">{checkinCount}</strong> ingresos</span>
            ) : null}
          </div>
        </header>

        <section id="cuenta-y-cobros" className="mt-6 space-y-3" aria-label="Cuenta y estado del evento">
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
        </section>

        {attentionItems.length > 0 ? (
          <section className="mt-8" aria-labelledby="attention-heading">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-amber-700" />
              <h2 id="attention-heading" className="admin-heading text-2xl text-foreground">Necesita tu atención</h2>
            </div>
            <div className="mt-3 divide-y divide-amber-200/80 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60">
              {attentionItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-amber-100/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-amber-950">{item.title}</span>
                    <span className="mt-1 block text-sm text-amber-900/75">{item.detail}</span>
                  </span>
                  <ArrowRight className="size-4 flex-none text-amber-700" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8" aria-labelledby="preparation-heading">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Trabajo principal</p>
            <h2 id="preparation-heading" className="admin-heading mt-1 text-2xl text-foreground">Preparación del evento</h2>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-border/70 bg-white/65">
            <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
              <article className="flex flex-col gap-5 border-b border-border/60 p-6 lg:border-b-0 lg:border-r">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 flex-none place-items-center rounded-2xl bg-sky-50 text-sky-700">
                    <Users2 className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-foreground">Invitados y confirmaciones</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {guestCount} cargados · {withoutInvitation} sin invitar · {awaitingConfirmation} sin confirmar
                      {hasPaidAccess && pendingPayments > 0 ? ` · ${pendingPayments} pagos pendientes` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-auto">
                  <Button asChild>
                    <Link href={`/admin/events/${event.id}/guests`}>
                      Abrir invitados
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </article>

              <div className="divide-y divide-border/60">
                <article className="p-5">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-5 flex-none text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-foreground">Invitación</h3>
                        <Badge variant={branding?.cover_image_url ? 'success' : 'warning'}>
                          {branding?.cover_image_url ? 'Portada lista' : 'Portada pendiente'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                        <Link href={`/admin/events/${event.id}/invitacion`} className="inline-flex items-center gap-1 text-primary hover:text-primary/80">
                          <Palette className="size-4" /> Editar
                        </Link>
                        <Link href={`/invitacion/preview/${event.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          Ver como invitado <ExternalLink className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="p-5">
                  <div className="flex items-start gap-3">
                    <Tv className="mt-0.5 size-5 flex-none text-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-foreground">Tótem</h3>
                        <Badge variant={branding?.background_image_url ? 'success' : 'warning'}>
                          {branding?.background_image_url ? 'Fondo listo' : 'Fondo pendiente'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                        <Link href={`/admin/events/${event.id}/branding#mensajes-totem`} className="inline-flex items-center gap-1 text-primary hover:text-primary/80">
                          <Palette className="size-4" /> Personalizar
                        </Link>
                        <Link href={`/t/${event.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          Ver en vivo <ExternalLink className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section
          className={
            isEventDay
              ? 'mt-8 rounded-3xl border border-slate-800 bg-admin-navy p-6 text-white shadow-[0_18px_50px_rgba(23,37,84,0.18)]'
              : 'mt-8 rounded-3xl border border-border/70 bg-white/65 p-6'
          }
          aria-labelledby="reception-heading"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className={isEventDay ? 'grid size-11 flex-none place-items-center rounded-2xl bg-white/10 text-sky-300' : 'grid size-11 flex-none place-items-center rounded-2xl bg-slate-100 text-slate-700'}>
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className={isEventDay ? 'text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/70' : 'text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground'}>
                  {isEventDay ? 'Evento en curso' : eventHasPassed ? 'Después de la fiesta' : 'Día del evento'}
                </p>
                <h2 id="reception-heading" className={isEventDay ? 'admin-heading mt-1 text-2xl text-white' : 'admin-heading mt-1 text-2xl text-foreground'}>
                  {receptionTitle}
                </h2>
                <p className={isEventDay ? 'mt-2 max-w-2xl text-sm leading-6 text-slate-300' : 'mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'}>
                  {receptionDetail}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isEventDay ? (
                <Button asChild variant="info">
                  <Link href={`/puerta/${event.id}`} target="_blank" rel="noreferrer">
                    <ScanLine className="size-4" /> Abrir puerta
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className={isEventDay ? 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white' : undefined}>
                <Link href={`/admin/events/${event.id}/check-in`}>
                  <ScanLine className="size-4" />
                  {eventHasPassed ? 'Ver actividad' : 'Preparar check-in'}
                </Link>
              </Button>
              {!isEventDay && !eventHasPassed ? (
                <Button asChild variant="ghost">
                  <Link href={`/puerta/${event.id}`} target="_blank" rel="noreferrer">
                    Abrir puerta <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'
import type { Event, EventBranding } from '@/types'
import { formatEventSchedule, type AccessSchedule } from '@/lib/event-schedule'
import EventConfirmationSummary from './EventConfirmationSummary'

export type EventDashboardProps = {
  event: Event
  branding: EventBranding | null
  guestTypes: AccessSchedule[]
  guestRows: { status: string | null }[]
  guestsUnavailable: boolean
  guestCount: number
  readyGuests: number
  checkinCount: number
  pendingPayments: number
  hasPaidAccess: boolean
  attentionItems: { title: string; detail: string; href: string }[]
  isEventDay: boolean
  eventHasPassed: boolean
  receptionTitle: string
  receptionDetail: string
  serviceActive: boolean
  accountControls: ReactNode
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

export default function EventDashboard({
  event, branding, guestTypes, guestRows, guestsUnavailable, guestCount, readyGuests, checkinCount,
  pendingPayments, hasPaidAccess, attentionItems,
  isEventDay, eventHasPassed, receptionTitle, receptionDetail, serviceActive, accountControls,
}: EventDashboardProps) {
  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0 lg:py-8">
        <header className="pb-2">
          <Link href="/admin/events" className="text-sm font-medium text-primary hover:text-primary/80">
            ← Volver a eventos
          </Link>

          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="admin-heading break-words text-4xl leading-tight tracking-tight text-foreground sm:text-[2.75rem]">{event.name}</h1>
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

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/events/${event.id}/edit`}><Pencil className="size-3.5" /> Editar evento</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/admin/events/${event.id}/guests`}><Users2 className="size-4" /> Gestionar invitados</Link>
              </Button>
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'Invitaciones', value: guestsUnavailable ? '—' : guestCount, detail: 'Titulares o grupos cargados' },
              { label: 'Accesos habilitados', value: guestsUnavailable ? '—' : readyGuests, detail: 'Grupos habilitados o ingresados' },
              { label: 'Capacidad del lugar', value: event.max_capacity, detail: 'Personas · incluye acompañantes' },
              { label: isEventDay || eventHasPassed ? 'Ingresos registrados' : 'Pagos pendientes', value: isEventDay || eventHasPassed ? checkinCount : hasPaidAccess ? (guestsUnavailable ? '—' : pendingPayments) : '—', detail: isEventDay || eventHasPassed ? 'Registros de acceso aprobados' : hasPaidAccess ? 'Invitaciones por acreditar' : 'Este evento no tiene entrada paga' },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-border/70 bg-white/80 px-4 py-4 sm:px-5">
                <dt className="text-xs font-medium text-muted-foreground">{metric.label}</dt>
                <dd className="admin-heading mt-2 text-3xl tabular-nums leading-none text-admin-navy">{metric.value}</dd>
                <dd className="mt-2 text-[11px] leading-4 text-muted-foreground">{metric.detail}</dd>
              </div>
            ))}
          </dl>
        </header>

        {!serviceActive ? (
          <section id="cuenta-y-cobros" className="mt-4 space-y-2" aria-label="Cuenta y estado del evento">
            {accountControls}
          </section>
        ) : null}

        <div className="mt-5 grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <EventConfirmationSummary guests={guestRows} unavailable={guestsUnavailable} guestsHref={`/admin/events/${event.id}/guests`} />
          <section className="flex min-w-0 flex-col rounded-3xl border border-border/70 bg-white/75 p-5 sm:p-6" aria-labelledby="attention-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="attention-heading" className="admin-heading text-2xl text-foreground">Para seguir avanzando</h2>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700"><AlertCircle aria-hidden="true" className="size-4" /></span>
            </div>
            {attentionItems.length > 0 ? (
              <div className="mt-4 divide-y divide-border/60">
                {attentionItems.map((item) => (
                  <Link key={item.title} href={item.href} className="group flex items-start gap-3 rounded-lg py-4 transition hover:bg-slate-50">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-5 text-foreground group-hover:text-primary">{item.title}</span>
                      <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
                    </span>
                    <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="my-auto py-8">
                {guestsUnavailable ? <AlertCircle aria-hidden="true" className="mb-3 size-7 text-amber-600" /> : <CheckCircle2 aria-hidden="true" className="mb-3 size-7 text-emerald-600" />}
                <p className="text-sm font-semibold text-foreground">{guestsUnavailable ? 'Las confirmaciones no están disponibles' : 'Sin pendientes en este resumen'}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{guestsUnavailable ? 'Volvé a cargar la página para revisar el estado de los invitados.' : 'Podés seguir revisando tus invitados y preparar los detalles de la recepción.'}</p>
              </div>
            )}
          </section>
        </div>

        <section className="mt-8" aria-labelledby="preparation-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="preparation-heading" className="admin-heading text-2xl text-foreground">Prepará cada detalle</h2>
            <span className="hidden text-xs text-muted-foreground sm:block">Todo en su lugar antes de la fiesta</span>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <article className="flex flex-col rounded-2xl border border-border/70 bg-white/80 p-5">
              <span className="mb-4 grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><Users2 aria-hidden="true" className="size-5" /></span>
              <h3 className="font-semibold text-foreground">Invitados e invitaciones</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Organizá los grupos, compartí sus links y seguí cada respuesta.</p>
              <Link href={`/admin/events/${event.id}/guests`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Abrir invitados <ArrowRight aria-hidden="true" className="size-4" /></Link>
            </article>
            <article className="flex flex-col rounded-2xl border border-border/70 bg-white/80 p-5">
              <div className="mb-4 flex items-center justify-between gap-2"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Mail aria-hidden="true" className="size-5" /></span><Badge variant={branding?.cover_image_url ? 'success' : 'warning'}>{branding?.cover_image_url ? 'Portada lista' : 'Sin portada'}</Badge></div>
              <h3 className="font-semibold text-foreground">Diseño de la invitación</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Los colores, las imágenes y las palabras que hacen única su fiesta.</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
                <Link href={`/admin/events/${event.id}/invitacion`} className="inline-flex items-center gap-1 text-primary hover:underline"><Palette aria-hidden="true" className="size-4" /> Editar</Link>
                <Link href={`/invitacion/preview/${event.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">Vista previa <ExternalLink className="size-3.5" /></Link>
              </div>
            </article>
            <article className="flex flex-col rounded-2xl border border-border/70 bg-white/80 p-5">
              <div className="mb-4 flex items-center justify-between gap-2"><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Tv aria-hidden="true" className="size-5" /></span><Badge variant={branding?.background_image_url ? 'success' : 'warning'}>{branding?.background_image_url ? 'Fondo listo' : 'Sin fondo'}</Badge></div>
              <h3 className="font-semibold text-foreground">Pantalla de bienvenida</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Personalizá el recibidor para que cada invitado se sienta esperado.</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
                <Link href={`/admin/events/${event.id}/branding#mensajes-totem`} className="inline-flex items-center gap-1 text-primary hover:underline"><Palette aria-hidden="true" className="size-4" /> Editar</Link>
                <Link href={`/t/${event.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">Ver tótem <ExternalLink className="size-3.5" /></Link>
              </div>
            </article>
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
        {serviceActive ? (
          <section id="cuenta-y-cobros" className="mt-8 space-y-3" aria-label="Cuenta y estado del evento">
            <h2 className="admin-heading text-xl text-foreground">Cuenta y servicio</h2>
            {accountControls}
          </section>
        ) : null}
      </div>
    </AdminLayout>
  )
}

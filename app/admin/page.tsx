import Link from 'next/link'
import { ArrowRight, CalendarRange, CheckCircle2, Clock, Mail, ScanLine, Users2, Wallet } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import type { Event } from '@/types'

export const metadata = {
  title: 'Inicio',
}

/**
 * El evento que el equipo esta operando: el activo mas proximo que todavia no
 * paso. Si ya pasaron todos, mostramos el ultimo, que es el que sigue teniendo
 * check-ins frescos.
 */
function pickFocusEvent(events: Event[]): Event | null {
  if (events.length === 0) return null

  const today = new Date().toISOString().slice(0, 10)
  const active = events.filter((event) => event.status === 'active')
  const pool = active.length > 0 ? active : events

  const byDateAsc = [...pool].sort((left, right) => left.event_date.localeCompare(right.event_date))
  const upcoming = byDateAsc.find((event) => event.event_date >= today)

  return upcoming ?? byDateAsc[byDateAsc.length - 1]
}

function formatEventDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function daysUntilLabel(isoDate: string, today: string) {
  const eventDay = new Date(`${isoDate}T00:00:00`).getTime()
  const todayDay = new Date(`${today}T00:00:00`).getTime()
  const days = Math.round((eventDay - todayDay) / 86_400_000)

  if (days > 1) return `Faltan ${days} días`
  if (days === 1) return 'Es mañana'
  if (days === 0) return 'Es hoy'
  if (days === -1) return 'Fue ayer'
  return `Hace ${Math.abs(days)} días`
}

export default async function AdminPage() {
  // Service role: RLS oculta guests/checkins al cliente con cookies (operator-auth
  // no crea sesion de Supabase). La ruta ya esta protegida por el layout del admin.
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <Card className="bg-admin-panel">
            <CardContent className="p-8">
              <p className="text-sm text-rose-700">
                SUPABASE_SERVICE_ROLE_KEY no está configurada en el entorno.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const { data: eventsData, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  if (error) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <Card className="bg-admin-panel">
            <CardContent className="p-8">
              <p className="text-sm text-rose-700">No se pudieron cargar los eventos: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const events = (eventsData ?? []) as Event[]
  const focusEvent = pickFocusEvent(events)

  if (!focusEvent) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <Card className="bg-admin-panel">
            <CardContent className="px-6 py-16 text-center">
              <h2 className="admin-heading text-4xl text-foreground">Todavía no hay eventos</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
                Cuando cargues el primero, acá vas a ver qué te falta para dejarlo listo y vas a poder
                saltar directo a operarlo.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/events/new">Crear primer evento</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  // Una sola consulta con el estado y el pago de cada invitado del evento en foco;
  // el desglose (que falta hacer, que tan listo esta) se calcula en memoria.
  const { data: guestRows } = await supabase
    .from('guests')
    .select('status, payment_status')
    .eq('event_id', focusEvent.id)

  const rows = (guestRows ?? []) as { status: string | null; payment_status: string | null }[]
  const total = rows.length
  const countStatus = (value: string) => rows.filter((row) => row.status === value).length

  const sinInvitar = countStatus('preinvited')
  const sinConfirmar = countStatus('link_sent')
  const ingresados = countStatus('checked_in')
  const listos = countStatus('enabled') + ingresados
  const pagosPendientes = rows.filter((row) => row.payment_status === 'pending').length
  const readyPct = total > 0 ? Math.round((listos / total) * 100) : 0

  const guestsHref = `/admin/events/${focusEvent.id}/guests`

  const attention = [
    sinInvitar > 0 && {
      icon: Mail,
      count: sinInvitar,
      label: 'sin invitación enviada',
      cta: 'Enviar invitaciones',
    },
    sinConfirmar > 0 && {
      icon: Clock,
      count: sinConfirmar,
      label: 'sin confirmar asistencia',
      cta: 'Seguir a los pendientes',
    },
    pagosPendientes > 0 && {
      icon: Wallet,
      count: pagosPendientes,
      label: 'con pago pendiente de revisar',
      cta: 'Revisar pagos',
    },
  ].filter(Boolean) as { icon: typeof Mail; count: number; label: string; cta: string }[]

  const stats = [
    { label: 'Invitados', value: total, detail: `${focusEvent.max_capacity} de cupo` },
    { label: 'Listos para entrar', value: listos, detail: `de ${total} cargados` },
    { label: 'Ingresaron', value: ingresados, detail: total > 0 ? `${Math.round((ingresados / total) * 100)}% del total` : 'Sin datos' },
  ]

  const otherEvents = events
    .filter((event) => event.id !== focusEvent.id && event.status === 'active')
    .slice(0, 4)

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          {/* Launchpad: el evento en foco, su estado de preparacion y el salto al taller. */}
          <Card className="overflow-hidden bg-admin-panel">
            <CardContent className="p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={focusEvent.status === 'active' ? 'success' : 'outline'}>
                  {focusEvent.status === 'active' ? 'Tu próximo evento' : 'Pausado'}
                </Badge>
                <Badge variant="outline">{daysUntilLabel(focusEvent.event_date, today)}</Badge>
              </div>

              <h2 className="admin-heading mt-5 text-5xl leading-none text-foreground">{focusEvent.name}</h2>
              <p className="mt-3 text-base capitalize text-muted-foreground">
                {formatEventDate(focusEvent.event_date)} · {focusEvent.start_time} · {focusEvent.venue_name}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] border border-border/70 bg-white/80 p-5">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{stat.label}</p>
                    <p className="mt-3 text-4xl font-semibold text-foreground">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Listos para entrar</span>
                  <span className="font-semibold text-foreground">{readyPct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${readyPct}%` }} />
                </div>
              </div>

              {/* Botones importantes: entrar al centro de operaciones + los dos saltos mas usados. */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={`/admin/events/${focusEvent.id}`}>
                    Abrir evento
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={guestsHref}>
                    <Users2 className="size-4" />
                    Invitados
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/admin/events/${focusEvent.id}/check-in`}>
                    <ScanLine className="size-4" />
                    Check-in
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Qué necesita tu atención: lo accionable, no un espejo del evento. */}
          <Card className="bg-admin-navy text-white">
            <CardHeader>
              <CardDescription className="text-sky-200/70">Antes de la fiesta</CardDescription>
              <CardTitle className="text-white">Qué necesita tu atención</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attention.length === 0 ? (
                <div className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/6 p-5">
                  <CheckCircle2 className="size-5 flex-none text-emerald-400" />
                  <p className="text-sm leading-6 text-slate-300">
                    Todo al día. No hay invitaciones sin enviar, confirmaciones pendientes ni pagos por
                    revisar.
                  </p>
                </div>
              ) : (
                attention.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.label}
                      href={guestsHref}
                      className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/6 p-4 transition hover:bg-white/10"
                    >
                      <span className="flex size-10 flex-none items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">
                          {item.count} {item.label}
                        </span>
                        <span className="block text-xs text-sky-200/80">{item.cta} →</span>
                      </span>
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {otherEvents.length > 0 && (
          <Card className="mt-6 bg-admin-panel">
            <CardHeader>
              <CardDescription>Después de este</CardDescription>
              <CardTitle className="admin-heading text-3xl">Otros eventos activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {otherEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="flex items-center justify-between gap-4 rounded-[24px] border border-border/70 bg-white/80 p-5 transition hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-foreground">{event.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(`${event.event_date}T00:00:00`).toLocaleDateString('es-AR')} ·{' '}
                        {event.venue_name}
                      </p>
                    </div>
                    <CalendarRange className="size-4 flex-none text-muted-foreground" />
                  </Link>
                ))}
              </div>

              <Button asChild variant="ghost" className="mt-4 px-0 text-primary hover:bg-transparent">
                <Link href="/admin/events">
                  Ver agenda completa
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

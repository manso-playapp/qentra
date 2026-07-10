import Link from 'next/link'
import { ArrowRight, CalendarRange, QrCode, ScanLine, Users2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerSupabaseClient } from '@/lib/supabase-server'
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

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

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
                Cuando cargues el primero, acá vas a ver cuántos invitados tenés, cuántos accesos se
                emitieron y cuánta gente entró.
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

  // Solo pedimos metricas del evento en foco: son las unicas que se leen aca.
  const [guestsCount, qrCount, checkinsCount] = await Promise.all([
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', focusEvent.id),
    // guest_qr_codes no tiene event_id: se llega al evento a traves del invitado.
    supabase
      .from('guest_qr_codes')
      .select('id, guests!inner(event_id)', { count: 'exact', head: true })
      .eq('guests.event_id', focusEvent.id)
      .eq('is_active', true),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('event_id', focusEvent.id),
  ])

  const guests = guestsCount.count ?? 0
  const qrIssued = qrCount.count ?? 0
  const checkins = checkinsCount.count ?? 0
  const attendance = guests > 0 ? Math.round((checkins / guests) * 100) : 0

  const otherEvents = events
    .filter((event) => event.id !== focusEvent.id && event.status === 'active')
    .slice(0, 4)

  const metrics = [
    {
      label: 'Invitados',
      value: guests,
      detail: `${focusEvent.max_capacity} de cupo declarado`,
      icon: Users2,
    },
    {
      label: 'Accesos emitidos',
      value: qrIssued,
      detail: guests > 0 && qrIssued < guests ? `Faltan ${guests - qrIssued}` : 'Todos emitidos',
      icon: QrCode,
    },
    {
      label: 'Check-ins',
      value: checkins,
      detail: checkins === 0 ? 'Nadie ingresó todavía' : `De ${guests} invitados`,
      icon: ScanLine,
    },
  ]

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          {/* El evento que estas operando, no un manifiesto de arquitectura. */}
          <Card className="overflow-hidden bg-admin-panel">
            <CardContent className="p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={focusEvent.status === 'active' ? 'success' : 'outline'}>
                  {focusEvent.status === 'active' ? 'Activo' : 'Pausado'}
                </Badge>
                <Badge variant="outline">{focusEvent.event_type}</Badge>
              </div>

              <h2 className="admin-heading mt-6 text-5xl leading-none text-foreground">
                {focusEvent.name}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {formatEventDate(focusEvent.event_date)} · {focusEvent.start_time} ·{' '}
                {focusEvent.venue_name}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => {
                  const Icon = metric.icon

                  return (
                    <div
                      key={metric.label}
                      className="rounded-[24px] border border-border/70 bg-white/80 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                          {metric.label}
                        </p>
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <p className="mt-4 text-4xl font-semibold text-foreground">{metric.value}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.detail}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/admin/events/${focusEvent.id}/guests`}>Gestionar invitados</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/admin/events/${focusEvent.id}/check-in`}>Abrir check-in</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Asistencia: el unico numero que importa el dia del evento. */}
          <Card className="bg-admin-navy text-white">
            <CardHeader>
              <CardDescription className="text-sky-200/70">Asistencia</CardDescription>
              <CardTitle className="text-white">Cuánta gente entró</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <p className="text-5xl font-semibold text-white">{attendance}%</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-emerald-400" style={{ width: `${attendance}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {checkins} de {guests} invitados
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/10 p-4 text-sm leading-6 text-slate-300">
                {checkins === 0
                  ? qrIssued === 0
                    ? 'Todavía no emitiste accesos. Sin QR nadie puede entrar por escaneo.'
                    : 'Accesos emitidos y puerta lista. Esperando el primer ingreso.'
                  : 'La puerta está registrando ingresos.'}
              </div>
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

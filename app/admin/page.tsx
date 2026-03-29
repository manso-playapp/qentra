'use client'

import Link from 'next/link'
import { ArrowRight, CalendarRange, Radio, Send, ShieldCheck, Users2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEvents } from '@/lib/hooks'

export default function AdminPage() {
  const { events, loading, error } = useEvents()

  const activeEvents = events.filter(event => event.status === 'active')
  const inactiveEvents = events.filter(event => event.status !== 'active')
  const totalGuests = events.reduce((sum, event) => sum + (event.max_capacity || 0), 0)
  const nextEvents = [...events]
    .sort((left, right) => new Date(left.event_date).getTime() - new Date(right.event_date).getTime())
    .slice(0, 4)

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <Card className="overflow-hidden bg-admin-panel">
            <CardContent className="p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default">Resumen general</Badge>
                <Badge variant="outline">Tailwind v4 base</Badge>
                <Badge variant="outline">UI semantica</Badge>
              </div>

              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="admin-heading text-5xl leading-none text-foreground">
                    Agenda, accesos y operadores sobre un sistema visual de verdad.
                  </h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    El objetivo ya no es “que se vea distinto”, sino que el backend tenga una base reusable, consistente y lista para convivir con branding por evento sin degenerar en CSS suelto.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button asChild size="lg">
                    <Link href="/admin/events/new">Crear evento</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/admin/settings">Canales y usuarios</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-navy text-white">
            <CardHeader>
              <CardDescription className="text-sky-200/70">Turno actual</CardDescription>
              <CardTitle className="text-white">Pulso operativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Eventos activos</p>
                <p className="mt-3 text-4xl font-semibold text-white">{loading ? '...' : activeEvents.length}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/10 p-4 text-sm leading-6 text-slate-300">
                {loading
                  ? 'Sincronizando panel operativo...'
                  : activeEvents.length > 0
                  ? 'Hay operacion lista para recibir invitados, validar accesos y sostener recepcion.'
                  : 'No hay eventos activos ahora mismo. Puedes preparar el siguiente bloque desde agenda.'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Agenda activa',
              value: loading ? '...' : String(activeEvents.length),
              detail: 'Eventos abiertos para operacion',
              icon: CalendarRange,
              tone: 'bg-card text-card-foreground',
            },
            {
              label: 'Capacidad total',
              value: loading ? '...' : String(totalGuests),
              detail: 'Cupo bruto declarado en agenda',
              icon: Users2,
              tone: 'bg-card text-card-foreground',
            },
            {
              label: 'Eventos pausados',
              value: loading ? '...' : String(inactiveEvents.length),
              detail: 'Inactivos o cancelados',
              icon: Radio,
              tone: 'bg-card text-card-foreground',
            },
            {
              label: 'Base operativa',
              value: loading ? '...' : String(events.length),
              detail: 'Total cargado en sistema',
              icon: ShieldCheck,
              tone: 'bg-admin-navy text-white',
            },
          ].map((card) => (
            (() => {
              const Icon = card.icon

              return (
                <Card
                  key={card.label}
                  className={`rounded-[28px] shadow-[0_18px_40px_rgba(86,62,38,0.06)] ${card.tone}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.3em] opacity-70">{card.label}</p>
                      <Icon className="size-4 opacity-65" />
                    </div>
                    <p className="mt-4 text-4xl font-semibold">{card.value}</p>
                    <p className="mt-3 text-sm leading-6 opacity-80">{card.detail}</p>
                  </CardContent>
                </Card>
              )
            })()
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
          <Card className="bg-admin-panel">
            <CardHeader>
              <CardDescription>Accesos directos</CardDescription>
              <CardTitle className="admin-heading text-3xl">Tareas frecuentes del equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  {
                    href: '/admin/events/new',
                    label: 'Nuevo evento',
                    title: 'Crear evento',
                    icon: CalendarRange,
                    detail: 'Arranca un evento nuevo con fecha, lugar, canal de envio y telefono operativo listos para configurarse.',
                  },
                  {
                    href: '/admin/events',
                    label: 'Eventos',
                    title: 'Ver eventos',
                    icon: Users2,
                    detail: 'Salta a invitados, check-in, puerta, totem o branding desde una sola grilla.',
                  },
                  {
                    href: '/admin/settings',
                    label: 'Configuracion',
                    title: 'Ajustar delivery',
                    icon: Send,
                    detail: 'Revisa proveedores, operadores, recovery links y salud de canales antes de abrir una puerta real.',
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-[26px] border border-border/70 bg-white/80 p-6 transition hover:-translate-y-1 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">{item.label}</Badge>
                      <item.icon className="size-4 text-muted-foreground transition group-hover:text-primary" />
                    </div>
                    <h4 className="admin-heading mt-5 text-2xl text-foreground">{item.title}</h4>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                  </Link>
                ))}
              </div>

              {error && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  Error al cargar datos: {error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-admin-panel">
            <CardHeader>
              <CardDescription>Proximos movimientos</CardDescription>
              <CardTitle className="admin-heading text-3xl">Eventos por venir</CardTitle>
            </CardHeader>
            <CardContent>
              {nextEvents.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-white/70 p-6">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Todavia no hay eventos cargados. El siguiente paso natural es crear la primera agenda operativa.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nextEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/admin/events/${event.id}`}
                      className="block rounded-[24px] border border-border/70 bg-white/80 p-5 transition hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{event.name}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {new Date(event.event_date).toLocaleDateString('es-AR')} · {event.venue_name}
                          </p>
                        </div>
                        <Badge variant={event.status === 'active' ? 'success' : 'outline'}>
                          {event.status === 'active' ? 'Activo' : 'Pausado'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Button asChild variant="ghost" className="mt-4 px-0 text-primary hover:bg-transparent">
                <Link href="/admin/events">
                  Ver agenda completa
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </AdminLayout>
  )
}

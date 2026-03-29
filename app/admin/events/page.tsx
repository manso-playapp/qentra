'use client'

import Link from 'next/link'
import { Phone, Shield, Users2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEvents } from '@/lib/hooks'

export default function EventsPage() {
  const { events, loading, error } = useEvents()
  const activeEvents = events.filter((event) => event.status === 'active').length
  const cancelledEvents = events.filter((event) => event.status === 'cancelled').length
  const totalCapacity = events.reduce((total, event) => total + event.max_capacity, 0)

  if (loading) {
    return (
      <AdminLayout>
        <Card className="flex min-h-[360px] items-center justify-center bg-admin-panel">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <Card className="bg-admin-panel">
          <CardContent className="p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
                  Agenda operativa
                </p>
                <h2 className="admin-heading mt-3 text-5xl leading-none text-foreground">
                  Eventos listos para producir, recibir y controlar.
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  El tablero de agenda queda sobre la nueva base visual del sistema: más consistente, menos manual y preparado para branding por evento donde haga falta.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/admin/settings">Revisar canales</Link>
                </Button>
                <Button asChild>
                  <Link href="/admin/events/new">Nuevo evento</Link>
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Eventos activos', value: String(activeEvents), tone: 'bg-emerald-50 text-emerald-900' },
              { label: 'Eventos cancelados', value: String(cancelledEvents), tone: 'bg-rose-50 text-rose-900' },
              { label: 'Capacidad acumulada', value: String(totalCapacity), tone: 'bg-white text-[color:var(--admin-ink)]' },
            ].map((item) => (
              <div key={item.label} className={`rounded-[24px] border border-border/70 p-5 ${item.tone}`}>
                <p className="text-[11px] uppercase tracking-[0.3em] opacity-70">{item.label}</p>
                <p className="mt-4 text-4xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-sm text-red-700">
              Error al cargar eventos: {error}
            </div>
          </div>
        )}

        <Card className="mt-6 bg-admin-panel">
          <CardHeader>
            <CardDescription>Agenda completa</CardDescription>
            <CardTitle className="admin-heading text-3xl">Produccion, recepcion y control por evento</CardTitle>
          </CardHeader>
          <CardContent>
          {events.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white/70 px-6 py-14 text-center">
              <h3 className="admin-heading text-3xl text-foreground">No hay eventos cargados</h3>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
                Arranca con la primera agenda y deja resuelto desde el principio el delivery, el telefono operativo y la superficie de control.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/events/new">Crear primer evento</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-[28px] border border-border/70 bg-white/80 p-6 transition hover:-translate-y-1 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        {event.event_type}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-foreground">
                        {event.name}
                      </h3>
                    </div>
                    <Badge
                      variant={
                        event.status === 'active'
                          ? 'success'
                          : event.status === 'inactive'
                          ? 'outline'
                          : 'danger'
                      }
                    >
                      {event.status === 'active' ? 'Activo' :
                       event.status === 'inactive' ? 'Inactivo' : 'Cancelado'}
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-event-surface px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">Fecha</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {new Date(event.event_date).toLocaleDateString('es-AR')} · {event.start_time}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-100 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">Capacidad</p>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {event.max_capacity} invitados
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <p className="flex items-center gap-2"><Users2 className="size-4" /> {event.venue_name}</p>
                    <p className="flex items-center gap-2"><Phone className="size-4" /> {event.contact_phone || 'Pendiente de definir'}</p>
                  </div>

                  {event.description && (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild variant="warm">
                      <Link href={`/admin/events/${event.id}`}>Ver ficha</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/admin/events/${event.id}/guests`}>Invitados</Link>
                    </Button>
                    <Button asChild variant="info">
                      <Link href={`/puerta/${event.id}`}><Shield className="size-4" /> Puerta</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

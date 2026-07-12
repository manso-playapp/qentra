'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin, Users2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEvents } from '@/lib/hooks'

const EVENT_TYPE_LABELS: Record<string, string> = {
  quince: 'Fiesta de 15',
  wedding: 'Casamiento',
  corporate: 'Corporativo',
  private: 'Privado',
}

export default function EventsPage() {
  const { events, loading, error } = useEvents()

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
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-sm text-red-700">
              Error al cargar eventos: {error}
            </div>
          </div>
        )}

        <Card className="bg-admin-panel">
          <CardHeader>
            <CardDescription>Agenda</CardDescription>
            <CardTitle className="admin-heading text-3xl">Elegí un evento para operar</CardTitle>
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
                  className="flex flex-col rounded-[28px] border border-border/70 bg-white/80 p-6 transition hover:border-primary/30 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                      </p>
                      <h3 className="mt-2 truncate text-2xl font-semibold text-foreground">
                        <Link href={`/admin/events/${event.id}`} className="transition-colors hover:text-primary">
                          {event.name}
                        </Link>
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

                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="size-4 flex-none" />
                      {new Date(`${event.event_date}T00:00:00`).toLocaleDateString('es-AR')} · {event.start_time}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 flex-none" />
                      {event.venue_name}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users2 className="size-4 flex-none" />
                      {event.max_capacity} de cupo
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-5">
                    <Button asChild>
                      <Link href={`/admin/events/${event.id}`}>
                        Abrir evento
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/events/${event.id}/guests`}>Invitados</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/events/${event.id}/check-in`}>Check-in</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/events/${event.id}/edit`}>Editar</Link>
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

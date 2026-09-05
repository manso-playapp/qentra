'use client'

import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin, Users2 } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatEventSchedule } from '@/lib/event-schedule'
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

        <AdminPageHeader title="Mis eventos" eyebrow="Agenda" description="Elegí la fiesta que querés preparar o seguir durante la recepción." actions={<Button asChild><Link href="/admin/events/new">Crear evento <ArrowRight className="size-4" /></Link></Button>} />
          {events.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white/70 px-6 py-14 text-center">
              <h3 className="admin-heading text-3xl text-foreground">No hay eventos cargados</h3>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
                Empezá con tu fiesta y organizá desde el principio las invitaciones, los invitados y la llegada.
              </p>
              <Button asChild className="mt-6">
                <Link href="/admin/events/new">Crear primer evento</Link>
              </Button>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="flex min-w-0 flex-col rounded-[28px] border border-border/70 bg-white/80 p-6 transition hover:border-primary/30 hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                      </p>
                      <h3 className="mt-2 break-words text-2xl font-semibold text-foreground">
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
                      {formatEventSchedule(event, event.guest_types ?? [], { compact: true })}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 flex-none" />
                      {event.venue_name}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users2 className="size-4 flex-none" />
                      {event.max_capacity} personas de capacidad
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

      </div>
    </AdminLayout>
  )
}

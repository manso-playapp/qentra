import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { DeliveryProfile, Event, EventBranding, GuestType } from '@/types'

type EventDetailPageProps = {
  params: Promise<{ id: string }>
}

const EVENT_TYPE_LABELS = {
  quince: '15 anos',
  wedding: 'Boda',
  corporate: 'Corporativo',
  private: 'Privado',
} as const

const EVENT_STATUS_LABELS = {
  active: 'Activo',
  inactive: 'Inactivo',
  cancelled: 'Cancelado',
} as const

const EVENT_STATUS_VARIANTS = {
  active: 'success',
  inactive: 'outline',
  cancelled: 'danger',
} as const

function formatChannelMode(mode: DeliveryProfile['channel_mode']) {
  if (mode === 'hybrid') {
    return 'Mixto'
  }

  if (mode === 'email') {
    return 'Email'
  }

  return 'WhatsApp'
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
  }).format(new Date(date))
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [
    eventResponse,
    brandingResponse,
    guestTypesResponse,
    deliveryProfileResponse,
    guestsCountResponse,
    checkinsCountResponse,
  ] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).maybeSingle(),
    supabase.from('event_branding').select('*').eq('event_id', id).maybeSingle(),
    supabase
      .from('guest_types')
      .select('id, name, description')
      .eq('event_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('delivery_profiles').select('*'),
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', id),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('event_id', id),
  ])

  if (eventResponse.error) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          No se pudo cargar el evento. Verifica la conexion con Supabase y las politicas de acceso.
        </div>
      </AdminLayout>
    )
  }

  if (!eventResponse.data) {
    notFound()
  }

  const event = eventResponse.data as Event
  const branding = brandingResponse.data as EventBranding | null
  const guestTypes = (guestTypesResponse.data ?? []) as GuestType[]
  const deliveryProfiles = (deliveryProfileResponse.data ?? []) as DeliveryProfile[]
  const selectedDeliveryProfile = deliveryProfiles.find((profile) => profile.id === event.delivery_profile_id) ?? null
  const guestCount = guestsCountResponse.count ?? 0
  const checkinCount = checkinsCountResponse.count ?? 0
  const availableSeats = Math.max(event.max_capacity - guestCount, 0)

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <Card className="overflow-hidden bg-admin-panel">
          <CardContent className="p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Link href="/admin/events" className="text-sm font-medium text-primary hover:text-primary/80">
                  ← Volver a eventos
                </Link>
                <h1 className="admin-heading mt-4 text-5xl leading-none text-foreground">{event.name}</h1>
                <p className="mt-3 text-base text-muted-foreground">
                  {EVENT_TYPE_LABELS[event.event_type]} · slug <span className="rounded-full bg-secondary px-3 py-1 font-mono text-sm text-secondary-foreground">{event.slug}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={EVENT_STATUS_VARIANTS[event.status] as 'success' | 'outline' | 'danger'}>
                  {EVENT_STATUS_LABELS[event.status]}
                </Badge>
                <Button asChild variant="secondary">
                  <Link href={`/admin/events/${event.id}/edit`}>Editar</Link>
                </Button>
                <Button asChild>
                  <Link href="/admin/events/new">Crear otro evento</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8 mt-6 grid gap-4 md:grid-cols-4">
          {[
            { label: 'Fecha', value: formatDate(event.event_date), detail: `Inicio a las ${event.start_time}` },
            { label: 'Capacidad', value: `${event.max_capacity} personas`, detail: `${availableSeats} lugares disponibles` },
            { label: 'Invitados', value: String(guestCount), detail: `${guestTypes.length} tipos configurados` },
            { label: 'Check-ins', value: String(checkinCount), detail: 'Control de acceso registrado' },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="space-y-6">
            <Card className="bg-admin-panel">
              <CardHeader>
                <CardDescription>Base del evento</CardDescription>
                <CardTitle>Datos del evento</CardTitle>
              </CardHeader>
              <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Venue</dt>
                  <dd className="mt-1 font-medium text-foreground">{event.venue_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Direccion</dt>
                  <dd className="mt-1 font-medium text-foreground">{event.venue_address}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Tipo de evento</dt>
                  <dd className="mt-1 font-medium text-foreground">{EVENT_TYPE_LABELS[event.event_type]}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Creado</dt>
                  <dd className="mt-1 font-medium text-foreground">{formatDate(event.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Telefono del evento</dt>
                  <dd className="mt-1 font-medium text-foreground">{event.contact_phone || 'No configurado'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Canal asignado</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {selectedDeliveryProfile
                      ? `${selectedDeliveryProfile.name} · ${formatChannelMode(selectedDeliveryProfile.channel_mode)}`
                      : event.delivery_profile_id || 'Pendiente de definir'}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-border/60 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Descripcion</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {event.description?.trim() || 'Este evento todavia no tiene una descripcion cargada.'}
                </p>
              </div>
              </CardContent>
            </Card>

            <Card className="bg-admin-panel">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardDescription>Acceso</CardDescription>
                  <CardTitle>Tipos de invitado</CardTitle>
                </div>
                <Badge variant="outline">{guestTypes.length} configurados</Badge>
              </CardHeader>
              <CardContent>

              {guestTypes.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                  Todavia no hay tipos de invitado definidos para este evento.
                </p>
              ) : (
                <div className="space-y-3">
                  {guestTypes.map((guestType) => (
                    <div key={guestType.id} className="rounded-[24px] border border-border/70 bg-white/75 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">{guestType.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {guestType.description?.trim() || 'Sin descripcion adicional.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="event-theme-surface">
              <CardHeader>
                <CardDescription>Personalizacion controlada</CardDescription>
                <CardTitle>Branding</CardTitle>
              </CardHeader>
              <CardContent>

              {branding ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Primario</p>
                      <div className="mt-3 h-12 rounded-md border border-black/5" style={{ backgroundColor: branding.primary_color }} />
                      <p className="mt-2 font-mono text-xs text-muted-foreground">{branding.primary_color}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Secundario</p>
                      <div className="mt-3 h-12 rounded-md border border-black/5" style={{ backgroundColor: branding.secondary_color }} />
                      <p className="mt-2 font-mono text-xs text-muted-foreground">{branding.secondary_color}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Tipografia libre: no. Base fija del sistema.</p>
                    <p>Logo: {branding.logo_url ? 'Configurado' : 'Pendiente'}</p>
                    <p>Banner: {branding.banner_url ? 'Configurado' : 'Pendiente'}</p>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-secondary/60 p-4 text-sm text-muted-foreground">
                  El branding de este evento todavia no fue configurado.
                </p>
              )}
              </CardContent>
            </Card>

            <Card className="bg-admin-panel">
              <CardHeader>
                <CardDescription>Superficies operativas</CardDescription>
                <CardTitle>Siguiente bloque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  La logica del evento ya existe. Desde aqui saltas a invitados, acceso operativo, puerta y pantalla publica sin duplicar flujos.
                </p>
                <Button asChild variant="secondary" className="w-full justify-start">
                  <Link href={`/totem/${event.id}`}>Abrir pantalla publica</Link>
                </Button>
                <Button asChild variant="info" className="w-full justify-start">
                  <Link href={`/puerta/${event.id}`}>Abrir control de acceso</Link>
                </Button>
                <Button asChild variant="success" className="w-full justify-start">
                  <Link href={`/admin/events/${event.id}/check-in`}>Abrir panel operativo</Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/admin/events/${event.id}/guests`}>Gestionar invitados</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/admin/events">Volver al listado</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AdminLayout>
  )
}

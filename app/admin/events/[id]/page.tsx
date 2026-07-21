import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  ExternalLink,
  Mail,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { DeliveryProfile, Event, EventBranding, GuestType } from '@/types'

export const metadata = {
  title: 'Detalle',
}

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
  // Service role: RLS oculta guests/checkins/delivery_profiles al cliente con
  // cookies (operator-auth no crea sesion de Supabase). La ruta ya esta
  // protegida por el layout. Fallback al cliente con sesion si falta la key.
  const supabase = getSupabaseAdminClient() ?? (await createServerSupabaseClient())

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

              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={EVENT_STATUS_VARIANTS[event.status] as 'success' | 'outline' | 'danger'}>
                  {EVENT_STATUS_LABELS[event.status]}
                </Badge>
                <Button asChild size="lg">
                  <Link href={`/admin/events/${event.id}/edit`}>
                    <Pencil className="size-4" />
                    Editar datos del evento
                  </Link>
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

        {/* Paginas publicas: lo que ven invitados y salon. Cada una lleva a su personalizacion. */}
        <section className="mt-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="admin-heading text-2xl text-foreground">Páginas públicas</h2>
            <p className="text-sm text-muted-foreground">Lo que ven tus invitados y el salón — personalizables</p>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* Invitacion */}
            <Card className="event-theme-surface">
              <CardContent className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 flex-none place-items-center rounded-2xl bg-white/70 text-primary ring-1 ring-primary/15">
                    <Mail className="size-6" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Página pública</p>
                    <h3 className="admin-heading mt-1 text-2xl text-foreground">Invitación</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Lo que recibe cada invitado: portada, colores y la experiencia (canción, saludo).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-medium ${branding?.cover_image_url ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {branding?.cover_image_url ? 'Portada configurada' : 'Portada pendiente'}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 font-medium ${branding ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                    {branding ? 'Colores definidos' : 'Colores por defecto'}
                  </span>
                </div>

                <div className="mt-auto flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`/admin/events/${event.id}/invitacion`}>
                      <Palette className="size-4" />
                      Personalizar invitación
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/invitacion/preview/${event.id}`} target="_blank" rel="noreferrer">
                      Ver en vivo
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Totem */}
            <Card className="bg-admin-panel">
              <CardContent className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 flex-none place-items-center rounded-2xl bg-event-surface text-primary ring-1 ring-primary/15">
                    <Tv className="size-6" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Página pública</p>
                    <h3 className="admin-heading mt-1 text-2xl text-foreground">Tótem</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      La pantalla de bienvenida en el salón: fondo y mensajes que reciben a cada invitado con su foto.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-medium ${branding?.background_image_url ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {branding?.background_image_url ? 'Fondo configurado' : 'Fondo pendiente'}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 font-medium ${branding?.welcome_message ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                    {branding?.welcome_message ? 'Mensajes propios' : 'Mensajes por defecto'}
                  </span>
                </div>

                <div className="mt-auto flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`/admin/events/${event.id}/branding#mensajes-totem`}>
                      <Palette className="size-4" />
                      Personalizar
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/totem/${event.id}`} target="_blank">
                      Ver en vivo
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Operacion: gestion y control de acceso. */}
        <section className="mt-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="admin-heading text-2xl text-foreground">Operación</h2>
            <p className="text-sm text-muted-foreground">Gestión de invitados y control de acceso</p>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* Gestion de invitados */}
            <Card className="bg-admin-panel">
              <CardContent className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 flex-none place-items-center rounded-2xl bg-event-surface text-primary ring-1 ring-primary/15">
                    <Users2 className="size-6" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="admin-heading text-2xl text-foreground">Gestión de invitados</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Alta manual o masiva, tipos, estados, QR, envíos y conciliación de pagos.
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {guestCount} invitados · {guestTypes.length} tipos
                    </p>
                  </div>
                </div>
                <div className="mt-auto">
                  <Button asChild>
                    <Link href={`/admin/events/${event.id}/guests`}>
                      Abrir gestión
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Puerta / check-in */}
            <Card className="bg-admin-navy text-white">
              <CardContent className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 flex-none place-items-center rounded-2xl bg-white/10 text-sky-300 ring-1 ring-white/10">
                    <ShieldCheck className="size-6" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="admin-heading text-2xl text-white">Puerta y check-in</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Validación de acceso, aforo en vivo y excepciones en el ingreso.
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">{checkinCount} ingresos registrados</p>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white">
                    <Link href={`/admin/events/${event.id}/check-in`}>
                      <ScanLine className="size-4" />
                      Panel de check-in
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white">
                    <Link href={`/puerta/${event.id}`} target="_blank">
                      Abrir puerta
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Referencia: datos base y tipos de invitado. */}
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
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
        </div>
      </div>
    </AdminLayout>
  )
}

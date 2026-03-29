'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarRange, Phone, Send, Sparkles } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/errors'
import { useDeliveryProfiles, useEvents } from '@/lib/hooks'
import type { CreateEventForm } from '@/types'

export default function NewEventPage() {
  const router = useRouter()
  const { createEvent } = useEvents()
  const { deliveryProfiles, loading: loadingDeliveryProfiles } = useDeliveryProfiles()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateEventForm>({
    name: '',
    slug: '',
    event_type: 'quince',
    event_date: '',
    start_time: '',
    venue_name: '',
    venue_address: '',
    max_capacity: 100,
    description: '',
    contact_phone: '',
    delivery_profile_id: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_capacity' ? parseInt(value) || 0 : value
    }))

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createEvent({
        ...formData,
        status: 'active'
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/events')
      }
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="overflow-hidden bg-admin-panel">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Nuevo evento</Badge>
                    <Badge variant="outline">Base visual comun</Badge>
                    <Badge variant="outline">Branding acotado por evento</Badge>
                  </div>
                  <h1 className="admin-heading mt-5 text-5xl leading-none text-foreground">
                    Crea un evento sin mezclar operacion, identidad y delivery.
                  </h1>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    La estructura del producto queda fija. Lo que personalizaremos por evento despues serán acentos, fondos y branding puntual, no la arquitectura del sistema.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link href="/admin/events">
                      <ArrowLeft className="size-4" />
                      Volver a agenda
                    </Link>
                  </Button>
                  <Button type="submit" size="lg" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear evento'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <Card className="bg-admin-panel">
              <CardHeader>
                <CardDescription>Base del evento</CardDescription>
                <CardTitle className="admin-heading text-3xl">Datos principales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div>
                    <Label htmlFor="name">Nombre del evento</Label>
                    <Input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-2"
                      placeholder="Ej: 15 años de Martina"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      type="text"
                      name="slug"
                      id="slug"
                      required
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="mt-2"
                      placeholder="15-martina-demo"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">URL del evento: /event/{formData.slug || 'slug-del-evento'}</p>
                  </div>

                  <div>
                    <Label htmlFor="event_type">Tipo de evento</Label>
                    <Select
                      name="event_type"
                      id="event_type"
                      required
                      value={formData.event_type}
                      onChange={handleInputChange}
                      className="mt-2"
                    >
                      <option value="quince">15 años</option>
                      <option value="wedding">Boda</option>
                      <option value="corporate">Corporativo</option>
                      <option value="private">Privado</option>
                    </Select>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="event_date">Fecha del evento</Label>
                      <Input
                        type="date"
                        name="event_date"
                        id="event_date"
                        required
                        value={formData.event_date}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_time">Hora de inicio</Label>
                      <Input
                        type="time"
                        name="start_time"
                        id="start_time"
                        required
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="venue_name">Venue</Label>
                    <Input
                      type="text"
                      name="venue_name"
                      id="venue_name"
                      required
                      value={formData.venue_name}
                      onChange={handleInputChange}
                      className="mt-2"
                      placeholder="Salón Palazzo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="venue_address">Dirección del venue</Label>
                    <Input
                      type="text"
                      name="venue_address"
                      id="venue_address"
                      required
                      value={formData.venue_address}
                      onChange={handleInputChange}
                      className="mt-2"
                      placeholder="Av. Siempre Viva 123, Ciudad"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      name="description"
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-2"
                      placeholder="Descripción opcional del evento..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-admin-navy text-white">
                <CardHeader>
                  <CardDescription className="text-orange-200/80">Datos operativos</CardDescription>
                  <CardTitle className="text-white">Contacto y envio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label htmlFor="contact_phone" className="text-white">Teléfono visible del evento</Label>
                    <Input
                      type="tel"
                      name="contact_phone"
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      className="mt-2 border-white/10 bg-white/6 text-white placeholder:text-slate-400"
                      placeholder="+54 9 351 ..."
                    />
                    <p className="mt-2 text-sm text-slate-300">
                      Número que ve el invitado. No define por sí solo la infraestructura real de envío.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="delivery_profile_id" className="text-white">Canal de envio</Label>
                    <Select
                      id="delivery_profile_id"
                      name="delivery_profile_id"
                      value={formData.delivery_profile_id}
                      onChange={handleInputChange}
                      disabled={loadingDeliveryProfiles}
                      className="mt-2 border-white/10 bg-white/6 text-white"
                    >
                      <option value="">Sin perfil asignado</option>
                      {deliveryProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} · {profile.channel_mode}
                          {profile.active ? '' : ' · inactivo'}
                        </option>
                      ))}
                    </Select>
                    <div className="mt-3">
                      <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                        <Link href="/admin/settings">
                          <Send className="size-4" />
                          Gestionar canales de envio
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="max_capacity" className="text-white">Capacidad máxima</Label>
                    <Input
                      type="number"
                      name="max_capacity"
                      id="max_capacity"
                      required
                      min="1"
                      value={formData.max_capacity}
                      onChange={handleInputChange}
                      className="mt-2 border-white/10 bg-white/6 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="event-theme-surface">
                <CardHeader>
                  <CardDescription>Personalizacion posterior</CardDescription>
                  <CardTitle className="admin-heading text-3xl">Elementos editables por evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-4 text-primary" />
                    Acento cromático del evento
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarRange className="size-4 text-primary" />
                    Fondo o hero de invitación
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-primary" />
                    Branding puntual en accesos y superficies públicas
                  </div>
                  <p>
                    La tipografía, la estructura y los componentes base quedan fijos para no convertir cada evento en un producto aparte.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm text-rose-700">Error al crear evento: {error}</div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear evento'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

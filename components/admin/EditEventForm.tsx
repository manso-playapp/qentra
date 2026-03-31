'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarRange, Phone, Save, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/errors'
import { useDeliveryProfiles } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types'

type EditEventFormProps = {
  event: Pick<
    Event,
    | 'id'
    | 'name'
    | 'slug'
    | 'event_type'
    | 'event_date'
    | 'start_time'
    | 'venue_name'
    | 'venue_address'
    | 'max_capacity'
    | 'description'
    | 'contact_phone'
    | 'delivery_profile_id'
    | 'status'
  >
}

type EventFormState = {
  name: string
  slug: string
  event_type: Event['event_type']
  event_date: string
  start_time: string
  venue_name: string
  venue_address: string
  max_capacity: number
  description: string
  contact_phone: string
  delivery_profile_id: string
  status: Event['status']
}

function formatChannelMode(mode: 'email' | 'whatsapp' | 'hybrid') {
  if (mode === 'hybrid') {
    return 'Mixto'
  }

  if (mode === 'email') {
    return 'Email'
  }

  return 'WhatsApp'
}

export default function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter()
  const { deliveryProfiles, loading: loadingDeliveryProfiles } = useDeliveryProfiles()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [formData, setFormData] = useState<EventFormState>({
    name: event.name,
    slug: event.slug,
    event_type: event.event_type,
    event_date: event.event_date,
    start_time: event.start_time,
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    max_capacity: event.max_capacity,
    description: event.description || '',
    contact_phone: event.contact_phone || '',
    delivery_profile_id: event.delivery_profile_id || '',
    status: event.status,
  })

  const handleInputChange = (
    inputEvent: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = inputEvent.target

    setFormData((current) => ({
      ...current,
      [name]: name === 'max_capacity' ? Number.parseInt(value || '0', 10) || 0 : value,
    }))

    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      setFormData((current) => ({ ...current, slug }))
    }
  }

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        event_type: formData.event_type,
        event_date: formData.event_date,
        start_time: formData.start_time,
        venue_name: formData.venue_name.trim(),
        venue_address: formData.venue_address.trim(),
        max_capacity: formData.max_capacity,
        description: formData.description.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        delivery_profile_id: formData.delivery_profile_id || null,
        status: formData.status,
      }

      const { error: updateError } = await supabase
        .from('events')
        .update(payload)
        .eq('id', event.id)

      if (updateError) {
        throw updateError
      }

      setNotice('Evento actualizado correctamente.')
      router.refresh()
      router.push(`/admin/events/${event.id}`)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-0">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="overflow-hidden bg-admin-panel">
          <CardContent className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Editar evento</Badge>
                  <Badge variant="outline">Ajuste operativo</Badge>
                  <Badge variant="outline">Datos y canal</Badge>
                </div>
                <h1 className="admin-heading mt-5 text-5xl leading-none text-foreground">
                  Actualiza la informacion de {event.name}
                </h1>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Corrige agenda, venue, contacto, canal asignado y estado sin salir del centro de operaciones.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href={`/admin/events/${event.id}`}>
                    <ArrowLeft className="size-4" />
                    Volver a la ficha
                  </Link>
                </Button>
                <Button type="submit" size="lg" disabled={loading}>
                  <Save className="size-4" />
                  {loading ? 'Guardando...' : 'Guardar cambios'}
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
                  <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" required value={formData.slug} onChange={handleInputChange} className="mt-2" />
                  <p className="mt-2 text-sm text-muted-foreground">URL del evento: /event/{formData.slug || 'slug-del-evento'}</p>
                </div>

                <div>
                  <Label htmlFor="event_type">Tipo de evento</Label>
                  <Select id="event_type" name="event_type" required value={formData.event_type} onChange={handleInputChange} className="mt-2">
                    <option value="quince">15 años</option>
                    <option value="wedding">Boda</option>
                    <option value="corporate">Corporativo</option>
                    <option value="private">Privado</option>
                  </Select>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="event_date">Fecha del evento</Label>
                    <Input id="event_date" name="event_date" type="date" required value={formData.event_date} onChange={handleInputChange} className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="start_time">Hora de inicio</Label>
                    <Input id="start_time" name="start_time" type="time" required value={formData.start_time} onChange={handleInputChange} className="mt-2" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="venue_name">Venue</Label>
                  <Input id="venue_name" name="venue_name" required value={formData.venue_name} onChange={handleInputChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="venue_address">Direccion del venue</Label>
                  <Input id="venue_address" name="venue_address" required value={formData.venue_address} onChange={handleInputChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea id="description" name="description" rows={4} value={formData.description} onChange={handleInputChange} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-admin-navy text-white">
              <CardHeader>
                <CardDescription className="text-orange-200/80">Datos operativos</CardDescription>
                <CardTitle className="text-white">Contacto, canal y estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="contact_phone" className="text-white">Telefono visible del evento</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className="mt-2 border-white/10 bg-white/6 text-white placeholder:text-slate-400"
                    placeholder="+54 9 351 ..."
                  />
                </div>

                <div>
                  <Label htmlFor="delivery_profile_id" className="text-white">Canal asignado</Label>
                  <Select
                    id="delivery_profile_id"
                    name="delivery_profile_id"
                    value={formData.delivery_profile_id}
                    onChange={handleInputChange}
                    disabled={loadingDeliveryProfiles}
                    className="mt-2 border-white/10 bg-white/6 text-white"
                  >
                    <option value="">Sin canal asignado</option>
                    {deliveryProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} · {formatChannelMode(profile.channel_mode)}
                        {profile.active ? '' : ' · inactivo'}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status" className="text-white">Estado</Label>
                  <Select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-2 border-white/10 bg-white/6 text-white"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="cancelled">Cancelado</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_capacity" className="text-white">Capacidad maxima</Label>
                  <Input
                    id="max_capacity"
                    name="max_capacity"
                    type="number"
                    min="1"
                    required
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
                  Acento cromatico y superficies publicas
                </div>
                <div className="flex items-center gap-3">
                  <CalendarRange className="size-4 text-primary" />
                  Hero de invitacion y pantalla publica
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-primary" />
                  Canal visible y branding puntual
                </div>
                <p>La tipografia, la estructura y los componentes base permanecen fijos para cuidar consistencia operativa.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Error al actualizar evento: {error}
          </div>
        )}

        {notice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </div>
        )}
      </form>
    </div>
  )
}

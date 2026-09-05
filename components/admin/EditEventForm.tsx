'use client'

import AdminPageHeader from './AdminPageHeader'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ClockInput } from '@/components/admin/ClockInput'
import { formatEventSchedule } from '@/lib/event-schedule'
import { getErrorMessage } from '@/lib/errors'
import type { Event } from '@/types'

type EditEventFormProps = {
  event: Pick<
    Event,
    | 'id'
    | 'name'
    | 'slug'
    | 'event_type'
    | 'event_date'
    | 'confirmation_deadline'
    | 'start_time'
    | 'venue_name'
    | 'venue_address'
    | 'dresscode'
    | 'directions_url'
    | 'max_capacity'
    | 'description'
    | 'gift_info'
    | 'contact_phone'
    | 'status'
  >
}

type EventFormState = {
  name: string
  slug: string
  event_type: Event['event_type']
  event_date: string
  confirmation_deadline: string
  start_time: string
  venue_name: string
  venue_address: string
  dresscode: string
  directions_url: string
  max_capacity: number
  description: string
  gift_info: string
  contact_phone: string
  status: Event['status']
}

export default function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [formData, setFormData] = useState<EventFormState>({
    name: event.name,
    slug: event.slug,
    event_type: event.event_type,
    event_date: event.event_date,
    confirmation_deadline: event.confirmation_deadline || '',
    start_time: event.start_time,
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    dresscode: event.dresscode || '',
    directions_url: event.directions_url || '',
    max_capacity: event.max_capacity,
    description: event.description || '',
    gift_info: event.gift_info || '',
    contact_phone: event.contact_phone || '',
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
        confirmation_deadline: formData.confirmation_deadline || null,
        start_time: formData.start_time,
        venue_name: formData.venue_name.trim(),
        venue_address: formData.venue_address.trim(),
        dresscode: formData.dresscode.trim() || null,
        directions_url: formData.directions_url.trim() || null,
        max_capacity: formData.max_capacity,
        description: formData.description.trim() || null,
        gift_info: formData.gift_info.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        status: formData.status,
      }

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(result?.error || 'No se pudo actualizar el evento.')
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
        <AdminPageHeader title="Datos de la fiesta" eyebrow={event.name} backHref={`/admin/events/${event.id}`} description="Fecha, lugar y capacidad. Los horarios de cada acceso se definen en Invitados." actions={<Button type="submit" disabled={loading}><Save className="size-4" />{loading ? 'Guardando…' : 'Guardar cambios'}</Button>} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card className="bg-admin-panel">
            <CardHeader>
              <CardDescription>Información principal</CardDescription>
              <CardTitle className="admin-heading text-3xl">Fecha y lugar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div>
                  <Label htmlFor="name">Nombre del evento</Label>
                  <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="slug">Identificador del enlace</Label>
                  <Input id="slug" name="slug" required value={formData.slug} onChange={handleInputChange} className="mt-2" />
                  <p className="mt-2 text-sm text-muted-foreground">Enlace del recibidor: /t/{formData.slug || 'slug-del-evento'}</p>
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
                    <Label htmlFor="event_date">Fecha de inicio de la fiesta</Label>
                    <Input id="event_date" name="event_date" type="date" required value={formData.event_date} onChange={handleInputChange} className="mt-2" />
                    {formData.event_date && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        La fecha en que empieza, aunque continúe después de medianoche.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="start_time">Hora de inicio · 24 h</Label>
                    <ClockInput id="start_time" name="start_time" aria-label="Hora de inicio" required value={formData.start_time} onChange={(value) => setFormData((current) => ({ ...current, start_time: value }))} className="mt-2" />
                    {formData.event_date && formData.start_time && <p className="mt-2 text-sm font-medium text-foreground">{formatEventSchedule(formData)}</p>}
                  </div>
                  <div>
                    <Label htmlFor="confirmation_deadline">Fecha límite para confirmar</Label>
                    <Input id="confirmation_deadline" name="confirmation_deadline" type="date" value={formData.confirmation_deadline} onChange={handleInputChange} className="mt-2" />
                    <p className="mt-2 text-sm text-muted-foreground">Se incluirá en el mensaje de WhatsApp para cada invitado.</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="venue_name">Lugar</Label>
                  <Input id="venue_name" name="venue_name" required value={formData.venue_name} onChange={handleInputChange} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="venue_address">Dirección</Label>
                  <Input id="venue_address" name="venue_address" required value={formData.venue_address} onChange={handleInputChange} className="mt-2" />
                </div>

                <div className="grid gap-6">
                  <div>
                    <Label htmlFor="dresscode">Dresscode</Label>
                    <Input id="dresscode" name="dresscode" value={formData.dresscode} onChange={handleInputChange} className="mt-2" placeholder="Ej: Elegante sport" />
                  </div>
                  <div>
                    <Label htmlFor="directions_url">Cómo llegar (link de mapa)</Label>
                    <Input id="directions_url" name="directions_url" type="url" value={formData.directions_url} onChange={handleInputChange} className="mt-2" placeholder="https://maps.google.com/..." />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción del evento</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-2"
                    placeholder="Una breve presentación de la fiesta..."
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Se muestra a los invitados como presentación general del evento.
                  </p>
                </div>

                <div>
                  <Label htmlFor="gift_info">Regalo</Label>
                  <Textarea
                    id="gift_info"
                    name="gift_info"
                    rows={4}
                    value={formData.gift_info}
                    onChange={handleInputChange}
                    className="mt-2"
                    placeholder="Alias, CBU o instrucciones para regalos..."
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Se mostrará como un bloque propio en la invitación y admite varias líneas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-admin-panel">
              <CardHeader>
                <CardDescription>Publicación y capacidad</CardDescription>
                <CardTitle>Estado del evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="contact_phone">Teléfono de contacto</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className="mt-2"
                    placeholder="+54 9 351 ..."
                  />
                </div>

                <div>
                  <Label htmlFor="status">Publicación</Label>
                  <Select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-2"
                  >
                    <option value="active">Publicado</option>
                    <option value="inactive">No publicado</option>
                    <option value="cancelled">Cancelado</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max_capacity">Capacidad máxima</Label>
                  <Input
                    id="max_capacity"
                    name="max_capacity"
                    type="number"
                    min="1"
                    required
                    value={formData.max_capacity}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
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
        <div className="flex justify-end border-t border-border/60 pt-4"><Button type="submit" disabled={loading}><Save className="size-4" />{loading ? 'Guardando…' : 'Guardar cambios'}</Button></div>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarRange, Phone, Sparkles } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EVENT_TEMPLATES, type EventTemplateKey, getEventTemplateByKey } from '@/lib/event-templates'
import { ClockInput } from '@/components/admin/ClockInput'
import { formatEventSchedule } from '@/lib/event-schedule'
import { getErrorMessage } from '@/lib/errors'
import { useEvents } from '@/lib/hooks'
import type { CreateEventForm } from '@/types'

export default function NewEventPage() {
  const router = useRouter()
  const { createEvent } = useEvents()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templateKey, setTemplateKey] = useState<EventTemplateKey | ''>('')
  const selectedTemplate = getEventTemplateByKey(templateKey)

  const [formData, setFormData] = useState<CreateEventForm>({
    name: '',
    slug: '',
    event_type: 'quince',
    event_date: '',
    confirmation_deadline: '',
    start_time: '',
    venue_name: '',
    venue_address: '',
    dresscode: '',
    directions_url: '',
    max_capacity: 100,
    gift_info: '',
    contact_phone: '',
  })

  const handleTemplateChange = (value: string) => {
    const nextTemplateKey = value as EventTemplateKey | ''
    setTemplateKey(nextTemplateKey)

    const nextTemplate = getEventTemplateByKey(nextTemplateKey)

    if (nextTemplate) {
      setFormData((current) => ({
        ...current,
        event_type: nextTemplate.eventType,
      }))
    }
  }

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
      } else if (result.data?.id && templateKey) {
        const response = await fetch('/api/event-templates/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: result.data.id,
            templateKey,
          }),
        })

        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null

        if (!response.ok) {
          setError(
            payload?.error ||
              'El evento se creo, pero no se pudo aplicar la plantilla de tipos.'
          )
          router.push(`/admin/events/${result.data.id}/guests`)
          return
        }

        router.push(`/admin/events/${result.data.id}/guests`)
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
                    Crea un evento sin mezclar operacion e identidad.
                  </h1>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    La estructura del producto queda fija. Lo que personalizaremos por evento despues seran acentos, fondos y branding puntual, no la arquitectura del sistema.
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
                    <Label htmlFor="event-template">Plantilla operativa</Label>
                    <Select
                      id="event-template"
                      value={templateKey}
                      onChange={(event) => handleTemplateChange(event.target.value)}
                      className="mt-2"
                    >
                      <option value="">Sin plantilla inicial</option>
                      {EVENT_TEMPLATES.map((template) => (
                        <option key={template.key} value={template.key}>
                          {template.label}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Preconfigura tipos de invitado y reglas horarias segun el tipo de evento.
                    </p>
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

                  {selectedTemplate && (
                    <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
                      <p className="text-sm font-medium text-foreground">
                        Plantilla seleccionada: {selectedTemplate.label}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedTemplate.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedTemplate.guestTypes.map((guestType) => (
                          <Badge key={guestType.name} variant="outline">
                            {guestType.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor="event_date">Fecha de inicio de la fiesta</Label>
                      <Input
                        type="date"
                        name="event_date"
                        id="event_date"
                        required
                        value={formData.event_date}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                      {formData.event_date && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          La fecha en que empieza, aunque continúe después de medianoche.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="start_time">Hora de inicio · 24 h</Label>
                      <ClockInput
                        name="start_time"
                        aria-label="Hora de inicio"
                        id="start_time"
                        required
                        value={formData.start_time}
                        onChange={(value) => setFormData((current) => ({ ...current, start_time: value }))}
                        className="mt-2"
                      />
                      {formData.event_date && formData.start_time && <p className="mt-2 text-sm font-medium text-foreground">{formatEventSchedule(formData)}</p>}
                    </div>
                    <div>
                      <Label htmlFor="confirmation_deadline">Fecha límite para confirmar</Label>
                      <Input
                        type="date"
                        name="confirmation_deadline"
                        id="confirmation_deadline"
                        value={formData.confirmation_deadline}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Se incluirá en el mensaje de WhatsApp para cada invitado.
                      </p>
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

                  <div className="grid gap-6">
                    <div>
                      <Label htmlFor="dresscode">Dresscode</Label>
                      <Input
                        type="text"
                        name="dresscode"
                        id="dresscode"
                        value={formData.dresscode}
                        onChange={handleInputChange}
                        className="mt-2"
                        placeholder="Elegante sport"
                      />
                    </div>
                    <div>
                      <Label htmlFor="directions_url">Cómo llegar (link de mapa)</Label>
                      <Input
                        type="url"
                        name="directions_url"
                        id="directions_url"
                        value={formData.directions_url}
                        onChange={handleInputChange}
                        className="mt-2"
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gift_info">Regalo</Label>
                    <Textarea
                      name="gift_info"
                      id="gift_info"
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
              <Card className="bg-admin-navy text-white">
                <CardHeader>
                  <CardDescription className="text-sky-300/80">Datos operativos</CardDescription>
                  <CardTitle className="text-white">Contacto y capacidad</CardTitle>
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
                      Numero que ve el invitado. No define por si solo la infraestructura real de envio.
                    </p>
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

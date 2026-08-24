'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const CONTACT_EMAIL = 'hola@alista.com.ar'

type ContactAudience = 'general' | 'family' | 'professional'

const audienceCopy = {
  general: {
    organizationLabel: 'Organización',
    organizationPlaceholder: 'Empresa, productora o salón',
    eventTypeLabel: 'Tipo de evento',
    eventTypePlaceholder: 'Social, corporativo, institucional…',
  },
  family: {
    organizationLabel: 'Nombre de la quinceañera',
    organizationPlaceholder: 'Por ejemplo, Martina',
    eventTypeLabel: 'Fecha aproximada',
    eventTypePlaceholder: 'Mes y año estimados',
  },
  professional: {
    organizationLabel: 'Organización',
    organizationPlaceholder: 'Productora, salón o estudio',
    eventTypeLabel: 'Eventos que organizan',
    eventTypePlaceholder: 'Cantidad o frecuencia aproximada',
  },
} as const

export function ContactForm({
  subject,
  cta,
  source,
  audience = 'general',
}: {
  subject: string
  cta: string
  source?: string
  audience?: ContactAudience
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: '',
    eventType: '',
    message: '',
  })
  const [preparedMailto, setPreparedMailto] = useState<string | null>(null)
  const copy = audienceCopy[audience]

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setPreparedMailto(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const body = [
      ...(source ? [`Origen: ${source}`, ''] : []),
      `Nombre: ${form.name}`,
      `Email: ${form.email}`,
      `${copy.organizationLabel}: ${form.organization}`,
      `${copy.eventTypeLabel}: ${form.eventType}`,
      '',
      form.message,
    ].join('\n')

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
    setPreparedMailto(mailto)
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-contact-source={source}
      className="rounded-3xl border border-border/70 bg-card p-6 shadow-[0_18px_50px_rgba(22,33,90,0.08)] sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="mt-2"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="mt-2"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <Label htmlFor="organization">{copy.organizationLabel}</Label>
          <Input
            id="organization"
            name="organization"
            value={form.organization}
            onChange={handleChange}
            className="mt-2"
            placeholder={copy.organizationPlaceholder}
          />
        </div>
        <div>
          <Label htmlFor="eventType">{copy.eventTypeLabel}</Label>
          <Input
            id="eventType"
            name="eventType"
            value={form.eventType}
            onChange={handleChange}
            className="mt-2"
            placeholder={copy.eventTypePlaceholder}
          />
        </div>
      </div>
      <div className="mt-5">
        <Label htmlFor="message">Contanos qué necesitás</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          className="mt-2"
          placeholder="Fecha aproximada, cantidad de invitados y qué te gustaría resolver."
        />
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">
        {preparedMailto ? 'Actualizar consulta' : cta}
      </Button>
      {preparedMailto ? (
        <div className="mt-5 rounded-2xl border border-emerald-700/20 bg-emerald-50 p-4" role="status" aria-live="polite">
          <p className="text-sm font-semibold text-emerald-950">Tu consulta está preparada.</p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/65">
            Todavía no fue enviada. Abrí tu correo, revisá el mensaje y completá el envío.
          </p>
          <Button asChild size="lg" className="mt-4 w-full sm:w-auto">
            <a href={preparedMailto}>Abrir correo para enviar</a>
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Primero preparamos el mensaje. Vos lo revisás y lo enviás desde tu correo a{' '}
          <span className="font-medium text-foreground">{CONTACT_EMAIL}</span>.
        </p>
      )}
    </form>
  )
}

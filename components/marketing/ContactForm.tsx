'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trackMarketingEvent, type MarketingAudience } from '@/lib/marketing-analytics'

const CONTACT_EMAIL = 'hola@alista.com.ar'

type ContactAudience = 'general' | 'family' | 'professional'
type ContactSource = 'familia-demo' | 'profesionales-page' | 'contacto-page'

const audienceCopy = {
  general: {
    organizationLabel: 'Ciudad y salón',
    organizationPlaceholder: 'Dónde serán los 15',
    eventTypeLabel: 'Fecha aproximada',
    eventTypePlaceholder: 'Día, mes y año, si ya lo saben',
  },
  family: {
    organizationLabel: 'Ciudad y salón',
    organizationPlaceholder: 'Dónde serán los 15',
    eventTypeLabel: 'Fecha aproximada',
    eventTypePlaceholder: 'Mes y año estimados',
  },
  professional: {
    organizationLabel: 'Salón, estudio o productora',
    organizationPlaceholder: 'Productora, salón o estudio',
    eventTypeLabel: 'Ciudad donde trabajás',
    eventTypePlaceholder: 'Ciudad y zona',
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
  source?: ContactSource
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
  const analyticsSource = source ?? 'contacto-page'
  const analyticsAudience: MarketingAudience = audience

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
    trackMarketingEvent('contact_form_prepared', {
      source: analyticsSource,
      audience: analyticsAudience,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-contact-source={analyticsSource}
      className="rounded-3xl border border-border/70 bg-card p-6 shadow-[0_18px_50px_rgba(22,33,90,0.08)] sm:p-8"
    >
      <p className="mb-6 text-sm leading-6 text-muted-foreground">{audience === 'professional' ? 'Dejanos tus datos profesionales para conversar. No hace falta compartir contactos de familias o invitados.' : 'Completá la consulta con los datos de una persona adulta responsable de la fiesta. Para empezar no necesitamos datos de la quinceañera ni de sus invitados.'}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Tu nombre</Label>
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
          <Label htmlFor="email">Tu email</Label>
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
        <Label htmlFor="message">{audience === 'professional' ? 'Cómo acompañás a las familias' : 'La fiesta y lo que quieren delegar'}</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          className="mt-2"
          placeholder={audience === 'professional' ? 'Qué fiestas de 15 acompañás, cómo se organiza la recepción y qué te gustaría resolver con Alista.' : 'Cantidad aproximada de invitados, el estilo que imaginan, si habrá trasnoche con entrada paga y qué tareas quieren delegar.'}
        />
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto">
        {preparedMailto ? 'Actualizar consulta' : cta}
      </Button>
      {preparedMailto ? (
        <div className="mt-5 rounded-2xl border border-emerald-700/20 bg-emerald-50 p-4" role="status" aria-live="polite">
          <p className="text-sm font-semibold text-emerald-950">Tu consulta está lista para revisar.</p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/65">
            Todavía no la recibimos. Abrí tu correo, revisá el mensaje y enviá la consulta cuando esté lista.
          </p>
          <Button asChild size="lg" className="mt-4 w-full sm:w-auto">
            <a
              href={preparedMailto}
              onClick={() => {
                trackMarketingEvent('contact_email_opened', {
                  source: analyticsSource,
                  audience: analyticsAudience,
                })
              }}
            >
              Abrir correo para enviar
            </a>
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Este formulario prepara un correo. Vos lo revisás y lo enviás a{' '}
          <span className="font-medium text-foreground">{CONTACT_EMAIL}</span>.
        </p>
      )}
    </form>
  )
}

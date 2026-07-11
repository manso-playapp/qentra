'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const CONTACT_EMAIL = 'hola@alista.com.ar'

export function ContactForm({ subject, cta }: { subject: string; cta: string }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: '',
    eventType: '',
    message: '',
  })

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const body = [
      `Nombre: ${form.name}`,
      `Email: ${form.email}`,
      `Organización: ${form.organization}`,
      `Tipo de evento: ${form.eventType}`,
      '',
      form.message,
    ].join('\n')

    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  return (
    <form
      onSubmit={handleSubmit}
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
          <Label htmlFor="organization">Organización</Label>
          <Input
            id="organization"
            name="organization"
            value={form.organization}
            onChange={handleChange}
            className="mt-2"
            placeholder="Empresa, productora o salón"
          />
        </div>
        <div>
          <Label htmlFor="eventType">Tipo de evento</Label>
          <Input
            id="eventType"
            name="eventType"
            value={form.eventType}
            onChange={handleChange}
            className="mt-2"
            placeholder="Social, corporativo, institucional…"
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
        {cta}
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        Al enviar se abrirá tu correo con el mensaje listo para{' '}
        <span className="font-medium text-foreground">{CONTACT_EMAIL}</span>.
      </p>
    </form>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ImageUpload from '@/components/admin/ImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/errors'
import type { EventBranding } from '@/types'

type BrandingFormProps = {
  eventId: string
  eventSlug: string
  eventName: string
  branding: EventBranding | null
}

type BrandingState = {
  primary_color: string
  secondary_color: string
  logo_url: string
  cover_image_url: string
  background_image_url: string
  welcome_message: string
  approved_message: string
  assistance_message: string
  invalid_message: string
  return_to_idle_seconds: number
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

function initialState(branding: EventBranding | null): BrandingState {
  return {
    primary_color: branding?.primary_color || '#8b5e3c',
    secondary_color: branding?.secondary_color || '#f1e8da',
    logo_url: branding?.logo_url ?? '',
    cover_image_url: branding?.cover_image_url ?? '',
    background_image_url: branding?.background_image_url ?? '',
    welcome_message: branding?.welcome_message ?? '',
    approved_message: branding?.approved_message ?? '',
    assistance_message: branding?.assistance_message ?? '',
    invalid_message: branding?.invalid_message ?? '',
    return_to_idle_seconds: branding?.return_to_idle_seconds ?? 5,
  }
}

export default function BrandingForm({ eventId, eventSlug, eventName, branding }: BrandingFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<BrandingState>(() => initialState(branding))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function update<K extends keyof BrandingState>(key: K, value: BrandingState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault()
    setError(null)

    if (!HEX_COLOR.test(form.primary_color) || !HEX_COLOR.test(form.secondary_color)) {
      setError('Los colores deben ser hexadecimales tipo #RRGGBB.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/event-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, ...form }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo guardar el branding.')
      }

      setSaved(true)
      router.refresh()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card id="identidad-visual" className="scroll-mt-24 bg-admin-panel">
            <CardHeader>
              <CardDescription>Identidad visual</CardDescription>
              <CardTitle className="admin-heading text-3xl">Colores e imágenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="primary_color">Color primario</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={HEX_COLOR.test(form.primary_color) ? form.primary_color : '#8b5e3c'}
                      onChange={(event) => update('primary_color', event.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
                      aria-label="Selector de color primario"
                    />
                    <Input
                      id="primary_color"
                      value={form.primary_color}
                      onChange={(event) => update('primary_color', event.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary_color">Color secundario</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={HEX_COLOR.test(form.secondary_color) ? form.secondary_color : '#f1e8da'}
                      onChange={(event) => update('secondary_color', event.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
                      aria-label="Selector de color secundario"
                    />
                    <Input
                      id="secondary_color"
                      value={form.secondary_color}
                      onChange={(event) => update('secondary_color', event.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <ImageUpload
                label="Logo"
                hint="PNG, JPG, WEBP o SVG. Hasta 5 MB."
                value={form.logo_url}
                onChange={(url) => update('logo_url', url)}
                fields={{ bucket: 'event-assets', folder: eventId, label: 'logo' }}
              />

              <ImageUpload
                label="Fondo del tótem"
                hint="La imagen de fondo de la pantalla del tótem. La invitación tiene su propio fondo en su editor."
                value={form.background_image_url}
                onChange={(url) => update('background_image_url', url)}
                fields={{ bucket: 'event-assets', folder: eventId, label: 'background' }}
              />
            </CardContent>
          </Card>

          <Card id="mensajes-totem" className="scroll-mt-24 bg-admin-panel">
            <CardHeader>
              <CardDescription>Textos del tótem</CardDescription>
              <CardTitle className="admin-heading text-3xl">Mensajes de la pantalla</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="welcome_message">Mensaje de bienvenida</Label>
                <Textarea
                  id="welcome_message"
                  value={form.welcome_message}
                  onChange={(event) => update('welcome_message', event.target.value)}
                  placeholder="Bienvenidos a los 15 de Martina"
                  className="mt-2"
                  rows={2}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="approved_message">Acceso aprobado</Label>
                  <Input
                    id="approved_message"
                    value={form.approved_message}
                    onChange={(event) => update('approved_message', event.target.value)}
                    placeholder="Acceso aprobado"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="invalid_message">Acceso no válido</Label>
                  <Input
                    id="invalid_message"
                    value={form.invalid_message}
                    onChange={(event) => update('invalid_message', event.target.value)}
                    placeholder="Acceso no válido"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="assistance_message">Derivar a asistencia</Label>
                  <Input
                    id="assistance_message"
                    value={form.assistance_message}
                    onChange={(event) => update('assistance_message', event.target.value)}
                    placeholder="Por favor dirigite a asistencia"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="return_to_idle_seconds">Segundos antes de volver a idle</Label>
                  <Input
                    id="return_to_idle_seconds"
                    type="number"
                    min={2}
                    max={30}
                    value={form.return_to_idle_seconds}
                    onChange={(event) => update('return_to_idle_seconds', Number(event.target.value))}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview + acciones, pegado arriba mientras se hace scroll del form. */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden bg-admin-panel">
            <CardHeader>
              <CardDescription>Vista previa</CardDescription>
              <CardTitle className="admin-heading text-2xl">Cómo se ve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex min-h-[150px] flex-col justify-end rounded-[24px] border border-black/5 p-5 text-white"
                style={{
                  background: form.cover_image_url
                    ? `linear-gradient(135deg, rgba(15,23,42,0.62), rgba(15,23,42,0.78)), url(${form.cover_image_url}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${HEX_COLOR.test(form.primary_color) ? form.primary_color : '#8b5e3c'} 0%, #1f2937 100%)`,
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">Invitación</p>
                <p className="mt-1 text-xl font-semibold">{eventName}</p>
                <p className="mt-1 text-sm text-white/80">
                  {form.welcome_message || 'Mensaje de bienvenida del evento'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="h-9 w-9 rounded-full border border-black/10"
                  style={{ backgroundColor: HEX_COLOR.test(form.primary_color) ? form.primary_color : '#8b5e3c' }}
                />
                <span
                  className="h-9 w-9 rounded-full border border-black/10"
                  style={{ backgroundColor: HEX_COLOR.test(form.secondary_color) ? form.secondary_color : '#f1e8da' }}
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {form.primary_color} · {form.secondary_color}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-panel">
            <CardContent className="space-y-3 p-5">
              {error && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
              )}
              {saved && !error && (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Branding guardado. Ya se refleja en las superficies del evento.
                </p>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                <Save className="size-4" />
                {saving ? 'Guardando…' : 'Guardar branding'}
              </Button>

              <div className="grid gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/t/${eventSlug}`} target="_blank">
                    <ExternalLink className="size-4" />
                    Ver tótem
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

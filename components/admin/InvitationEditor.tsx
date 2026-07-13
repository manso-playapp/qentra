'use client'

import { useState } from 'react'
import { CalendarDays, Clock, MapPin, Music2, MessageCircle, HelpCircle } from 'lucide-react'
import ImageUpload from '@/components/admin/ImageUpload'

// Editor tipo "front editor" para la invitacion: panel de controles a la
// izquierda, preview en vivo (mockup de celular) a la derecha. Los campos
// visuales (colores, imagenes) persisten en event_branding; el resto de la
// configuracion (tipografia, dresscode, widgets, campos) va en un JSON de config.

export type InvitationConfig = {
  fontFamily: 'sans' | 'serif' | 'display'
  dresscode: string
  directionsUrl: string
  widgets: { message: boolean; trivia: boolean; song: boolean }
  triviaQuestion: string
  fields: { rsvp: boolean; dni: boolean; menu: boolean; companions: boolean }
}

// La invitacion usa cover_image_url como su imagen de fondo (columna propia).
// background_image_url queda para el totem, para que no se pisen.
export type InvitationVisual = {
  primary_color: string
  secondary_color: string
  logo_url: string
  cover_image_url: string
}

type EventInfo = {
  name: string
  event_date: string
  start_time: string
  venue_name: string
  venue_address: string
}

export const DEFAULT_INVITATION_CONFIG: InvitationConfig = {
  fontFamily: 'display',
  dresscode: '',
  directionsUrl: '',
  widgets: { message: true, trivia: false, song: false },
  triviaQuestion: '',
  fields: { rsvp: true, dni: true, menu: true, companions: true },
}

const FONT_STACKS: Record<InvitationConfig['fontFamily'], string> = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  display: 'var(--font-display), ui-sans-serif, system-ui, sans-serif',
}

const FONT_LABELS: Record<InvitationConfig['fontFamily'], string> = {
  sans: 'Moderna (sans)',
  serif: 'Clásica (serif)',
  display: 'Display (marca)',
}

const HEX = /^#[0-9a-fA-F]{6}$/

function formatDate(iso: string) {
  if (!iso) return 'Fecha a definir'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function InvitationEditor({
  eventId,
  event,
  initialVisual,
  initialConfig,
}: {
  eventId: string
  event: EventInfo
  initialVisual: InvitationVisual
  initialConfig: InvitationConfig
}) {
  const [visual, setVisual] = useState<InvitationVisual>(initialVisual)
  const [config, setConfig] = useState<InvitationConfig>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const primary = HEX.test(visual.primary_color) ? visual.primary_color : '#8b5e3c'
  const secondary = HEX.test(visual.secondary_color) ? visual.secondary_color : '#f1e8da'
  const fontStack = FONT_STACKS[config.fontFamily]

  const setVisualField = (key: keyof InvitationVisual, value: string) =>
    setVisual((current) => ({ ...current, [key]: value }))
  const toggleWidget = (key: keyof InvitationConfig['widgets']) =>
    setConfig((current) => ({ ...current, widgets: { ...current.widgets, [key]: !current.widgets[key] } }))
  const toggleField = (key: keyof InvitationConfig['fields']) =>
    setConfig((current) => ({ ...current, fields: { ...current.fields, [key]: !current.fields[key] } }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/events/${eventId}/invitation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visual, config }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; configPersisted?: boolean }
        | null
      if (!response.ok) throw new Error(payload?.error || 'No se pudo guardar.')
      setNotice(
        payload?.configPersisted === false
          ? 'Aspecto guardado. Los widgets se guardan al correr la migración de config (columna event_branding.config).'
          : 'Invitación guardada.'
      )
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
      {/* Panel de controles */}
      <div className="space-y-5">
        <Section title="Aspecto" desc="Colores, tipografía e imágenes de la invitación.">
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorControl label="Color primario" value={visual.primary_color} fallback="#8b5e3c" onChange={(v) => setVisualField('primary_color', v)} />
            <ColorControl label="Color secundario" value={visual.secondary_color} fallback="#f1e8da" onChange={(v) => setVisualField('secondary_color', v)} />
          </div>
          <Field label="Tipografía">
            <select
              value={config.fontFamily}
              onChange={(e) => setConfig((c) => ({ ...c, fontFamily: e.target.value as InvitationConfig['fontFamily'] }))}
              className={inputClass}
            >
              {(Object.keys(FONT_LABELS) as InvitationConfig['fontFamily'][]).map((key) => (
                <option key={key} value={key}>{FONT_LABELS[key]}</option>
              ))}
            </select>
          </Field>
          <ImageUpload
            label="Imagen de fondo"
            hint="Cubre toda la invitación. El contenido va en tarjetas encima."
            value={visual.cover_image_url}
            onChange={(url) => setVisualField('cover_image_url', url)}
            fields={{ bucket: 'event-assets', folder: eventId, label: 'invitation-bg' }}
          />
          <ImageUpload
            label="Logo (PNG transparente)"
            hint="Se muestra arriba, sobre el fondo. Ideal PNG con fondo transparente."
            value={visual.logo_url}
            onChange={(url) => setVisualField('logo_url', url)}
            fields={{ bucket: 'event-assets', folder: eventId, label: 'logo' }}
          />
        </Section>

        <Section title="Información del evento" desc="Lo que ve el invitado sobre cuándo y dónde.">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            📅 {formatDate(event.event_date)} · 🕒 {event.start_time || 'Hora a definir'} · 📍 {event.venue_name || 'Lugar a definir'}
            <p className="mt-1 text-xs text-gray-400">Se edita en “Editar datos del evento”.</p>
          </div>
          <Field label="Dresscode"><input className={inputClass} value={config.dresscode} onChange={(e) => setConfig((c) => ({ ...c, dresscode: e.target.value }))} placeholder="Ej: Elegante sport" /></Field>
          <Field label="Cómo llegar (link de mapa)"><input className={inputClass} value={config.directionsUrl} onChange={(e) => setConfig((c) => ({ ...c, directionsUrl: e.target.value }))} placeholder="https://maps.google.com/..." /></Field>
        </Section>

        <Section title="Widgets opcionales" desc="Activá solo los que quieras. La invitación no obliga a completarlos.">
          <ToggleRow icon={MessageCircle} label="Campo de mensajes" desc="El invitado deja un saludo o dedicatoria." on={config.widgets.message} onToggle={() => toggleWidget('message')} />
          <ToggleRow icon={HelpCircle} label="Trivia" desc="“¿Quién sabe más de…?”" on={config.widgets.trivia} onToggle={() => toggleWidget('trivia')} />
          {config.widgets.trivia && (
            <Field label="Pregunta de la trivia"><input className={inputClass} value={config.triviaQuestion} onChange={(e) => setConfig((c) => ({ ...c, triviaQuestion: e.target.value }))} placeholder="¿En qué año se conocieron los novios?" /></Field>
          )}
          <ToggleRow icon={Music2} label="Canción (Spotify)" desc="El invitado suma un tema a la playlist del evento." on={config.widgets.song} onToggle={() => toggleWidget('song')} />
        </Section>

        <Section title="Datos que pedimos" desc="Los campos funcionales del formulario de confirmación.">
          <ToggleRow label="Confirmar asistencia (RSVP)" on={config.fields.rsvp} onToggle={() => toggleField('rsvp')} />
          <ToggleRow label="DNI" on={config.fields.dni} onToggle={() => toggleField('dni')} />
          <ToggleRow label="Menú especial" on={config.fields.menu} onToggle={() => toggleField('menu')} />
          <ToggleRow label="Acompañantes" on={config.fields.companions} onToggle={() => toggleField('companions')} />
        </Section>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? 'Guardando...' : 'Guardar invitación'}
        </button>
      </div>

      {/* Preview en vivo */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Vista previa en vivo</p>
        <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[36px] border-4 border-gray-900 bg-white shadow-2xl">
          <div
            className="relative min-h-[560px] px-4 py-6"
            style={{
              fontFamily: fontStack,
              ...(visual.cover_image_url
                ? {
                    backgroundImage: `url(${visual.cover_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : { background: `linear-gradient(160deg, ${primary}, ${secondary})` }),
            }}
          >
            {/* Scrim: legibilidad del logo y separacion de las tarjetas. */}
            <div className="absolute inset-0 bg-black/15" />

            <div className="relative space-y-4">
              {/* Logo transparente, arriba, sobre el fondo. */}
              {visual.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={visual.logo_url} alt="Logo" className="mx-auto h-16 max-w-[70%] object-contain drop-shadow-md" />
              ) : (
                <div className="mx-auto flex h-14 w-28 items-center justify-center rounded-lg border border-dashed border-white/70 text-[10px] font-medium text-white/85">
                  Logo (PNG)
                </div>
              )}

              {/* Tarjeta: info del evento */}
              <div className="rounded-2xl bg-white/92 p-4 text-center shadow-lg backdrop-blur-sm">
                <h2 className="text-xl font-semibold" style={{ color: primary }}>
                  {event.name || 'Nombre del evento'}
                </h2>
                <div className="mt-3 space-y-1.5 text-sm text-gray-700">
                  <p className="flex items-center justify-center gap-1.5"><CalendarDays className="size-4" style={{ color: primary }} /> {formatDate(event.event_date)}</p>
                  <p className="flex items-center justify-center gap-1.5"><Clock className="size-4" style={{ color: primary }} /> {event.start_time || 'Hora a definir'}</p>
                  <p className="flex items-center justify-center gap-1.5"><MapPin className="size-4" style={{ color: primary }} /> {event.venue_name || 'Lugar a definir'}</p>
                </div>
                {config.dresscode && (
                  <p className="mx-auto mt-3 w-fit rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: primary, color: secondary }}>
                    Dresscode: {config.dresscode}
                  </p>
                )}
                {config.directionsUrl && (
                  <p className="mt-2 text-xs font-semibold underline" style={{ color: primary }}>Cómo llegar →</p>
                )}
              </div>

              {/* Widgets: cada uno su tarjeta. */}
              {config.widgets.song && (
                <PreviewWidget primary={primary} icon={Music2} title="Sumá tu canción">
                  <div className="rounded-lg bg-black/5 px-3 py-2 text-xs text-gray-500">🔎 Buscar en Spotify…</div>
                </PreviewWidget>
              )}
              {config.widgets.trivia && (
                <PreviewWidget primary={primary} icon={HelpCircle} title="Trivia">
                  <p className="text-xs text-gray-600">{config.triviaQuestion || '¿Quién sabe más de…?'}</p>
                </PreviewWidget>
              )}
              {config.widgets.message && (
                <PreviewWidget primary={primary} icon={MessageCircle} title="Dejá tu saludo">
                  <div className="rounded-lg bg-black/5 px-3 py-3 text-xs text-gray-400">Escribí un mensaje…</div>
                </PreviewWidget>
              )}

              {/* Tarjeta: formulario funcional */}
              <div className="rounded-2xl bg-white/92 p-4 shadow-lg backdrop-blur-sm">
                {config.fields.rsvp && (
                  <div className="grid grid-cols-2 gap-2">
                    <span className="rounded-lg py-2 text-center text-xs font-semibold text-white" style={{ backgroundColor: primary }}>Confirmar</span>
                    <span className="rounded-lg border py-2 text-center text-xs font-semibold text-gray-600">No asistiré</span>
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  {config.fields.dni && <MockInput label="DNI" />}
                  {config.fields.companions && <MockInput label="Acompañantes" />}
                  {config.fields.menu && <MockInput label="Menú especial" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {children}
    </label>
  )
}

function ColorControl({ label, value, fallback, onChange }: { label: string; value: string; fallback: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={HEX.test(value) ? value : fallback} onChange={(e) => onChange(e.target.value)} className="size-9 flex-none cursor-pointer rounded border border-gray-300" aria-label={label} />
        <input value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} mt-0 font-mono`} placeholder={fallback} />
      </div>
    </Field>
  )
}

function ToggleRow({ icon: Icon, label, desc, on, onToggle }: { icon?: typeof Music2; label: string; desc?: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${on ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
      {Icon && <Icon className={`size-4 flex-none ${on ? 'text-emerald-600' : 'text-gray-400'}`} />}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {desc && <span className="block text-xs text-gray-500">{desc}</span>}
      </span>
      <span className={`flex h-5 w-9 flex-none items-center rounded-full p-0.5 transition ${on ? 'bg-emerald-500' : 'bg-gray-300'}`}>
        <span className={`size-4 rounded-full bg-white transition ${on ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  )
}

function PreviewWidget({ primary, icon: Icon, title, children }: { primary: string; icon: typeof Music2; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/92 p-3 shadow-lg backdrop-blur-sm">
      <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: primary }}>
        <Icon className="size-3.5" /> {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function MockInput({ label }: { label: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-500">{label}</p>
      <div className="mt-0.5 h-7 rounded-md border border-gray-200 bg-gray-50" />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { CalendarDays, Clock, MapPin, Music2, Timer, Sparkles } from 'lucide-react'
import ImageUpload from '@/components/admin/ImageUpload'
import AudioUpload from '@/components/admin/AudioUpload'
import InvitationView, { buildCalendarUrl, type InvitationConfigInfo, type InvitationEventInfo } from '@/components/invitation/InvitationView'
import type { SurfaceBranding } from '@/types'
import {
  INVITATION_TEMPLATES,
  type InvitationTemplateKey,
} from '@/lib/invitation-templates'
import {
  DEFAULT_INVITATION_FONTS,
  INVITATION_FONT_KEYS,
  INVITATION_FONT_LABELS,
  type InvitationFontKey,
} from '@/lib/invitation-fonts'

// Editor tipo "front editor" para la invitacion: panel de controles a la
// izquierda, preview en vivo (mockup de celular) a la derecha. Los campos
// visuales (colores, imagenes) persisten en event_branding; el resto de la
// configuracion (tipografia, dresscode, widgets, campos) va en un JSON de config.

export type InvitationConfig = {
  template: InvitationTemplateKey
  fontFamily: 'sans' | 'serif' | 'display'
  dresscode: string
  directionsUrl: string
  audio_url: string
  colors: {
    background: string
    title: string
    subtitle: string
    data: string
    accent: string
  }
  fonts: {
    titles: InvitationFontKey
    subtitles: InvitationFontKey
    data: InvitationFontKey
  }
  widgets: { countdown: boolean; particles: boolean }
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
  gift_info?: string
  contact_phone?: string
}

export const DEFAULT_INVITATION_CONFIG: InvitationConfig = {
  template: 'travel',
  fontFamily: 'display',
  dresscode: '',
  directionsUrl: '',
  audio_url: '',
  colors: {
    background: '',
    title: '',
    subtitle: '#ffffff',
    data: '#ffffff',
    accent: '',
  },
  fonts: DEFAULT_INVITATION_FONTS,
  widgets: { countdown: false, particles: false },
  fields: { rsvp: true, dni: true, menu: true, companions: true },
}

const LEGACY_FONT_STACKS: Record<InvitationConfig['fontFamily'], string> = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  display: 'var(--font-display), ui-sans-serif, system-ui, sans-serif',
}

export const LEGACY_FONT_LABELS: Record<InvitationConfig['fontFamily'], string> = {
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
  const paletteFallbacks = {
    background: '#000000',
    title: secondary,
    subtitle: '#ffffff',
    data: '#ffffff',
    accent: secondary,
  }
  const fontStack = LEGACY_FONT_STACKS[config.fontFamily]
  const isMidnight = config.template === 'midnight'
  const previewEvent = event as InvitationEventInfo
  const previewBranding = {
    primary_color: primary,
    secondary_color: secondary,
    logo_url: visual.logo_url || null,
    cover_image_url: visual.cover_image_url || null,
  } as SurfaceBranding
  const previewConfig = config as InvitationConfigInfo
  const previewCalendarUrl = buildCalendarUrl(previewEvent)

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
          <Field label="Template">
            <select
              value={config.template}
              onChange={(event) => setConfig((current) => ({ ...current, template: event.target.value as InvitationTemplateKey }))}
              className={inputClass}
            >
              {INVITATION_TEMPLATES.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label} — {template.description}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Paleta de la invitación</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(paletteFallbacks) as Array<keyof typeof paletteFallbacks>).map((key) => (
                <ColorControl
                  key={key}
                  label={
                    key === 'background'
                      ? 'Color de fondo'
                      : key === 'title'
                      ? 'Color de títulos'
                      : key === 'subtitle'
                      ? 'Color de subtítulos'
                      : key === 'data'
                      ? 'Color de datos'
                      : 'Color de acento'
                  }
                  value={config.colors[key] || paletteFallbacks[key]}
                  fallback={paletteFallbacks[key]}
                  onChange={(value) => setConfig((current) => ({ ...current, colors: { ...current.colors, [key]: value } }))}
                />
              ))}
            </div>
          </div>
          <Field label="Tipografía">
            <div className="grid gap-3 sm:grid-cols-2">
              <FontControl
                label="TipografÃ­a de tÃ­tulos"
                role="titles"
                value={config.fonts.titles}
                onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...current.fonts, titles: value } }))}
              />
              <FontControl
                label="TipografÃ­a de subtÃ­tulos"
                role="subtitles"
                value={config.fonts.subtitles}
                onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...current.fonts, subtitles: value } }))}
              />
              <FontControl
                label="TipografÃ­a de datos"
                role="data"
                value={config.fonts.data}
                onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...current.fonts, data: value } }))}
              />
            </div>
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
          <AudioUpload
            label="Música de la invitación"
            hint="Subí MP3, M4A, WAV, OGG o WEBM (máximo 20 MB). El navegador puede requerir un toque para iniciar el audio."
            value={config.audio_url}
            onChange={(audio_url) => setConfig((current) => ({ ...current, audio_url }))}
            fields={{ bucket: 'event-assets', folder: eventId, label: 'invitation-audio' }}
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
          {isMidnight && (
            <>
              <ToggleRow icon={Timer} label="Cuenta regresiva" desc="Días, horas, minutos y segundos para el evento." on={config.widgets.countdown} onToggle={() => toggleWidget('countdown')} />
              <ToggleRow icon={Sparkles} label="Partículas animadas" desc="Efecto de luces flotando sobre el fondo." on={config.widgets.particles} onToggle={() => toggleWidget('particles')} />
            </>
          )}
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
        <div className="invitation-editor-thumbnail mx-auto h-[680px] w-full max-w-[360px] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[36px] border-4 border-gray-900 bg-black shadow-2xl">
          <div className="invitation-editor-canvas">
            <InvitationView
              event={previewEvent}
              branding={previewBranding}
              guestDisplayName="Invitado/a de ejemplo"
              calendarUrl={previewCalendarUrl}
              template={config.template}
              config={previewConfig}
              isPreview
            >
              <EditorPreviewContent config={config} isMidnight={isMidnight} primary={primary} />
            </InvitationView>
          </div>
        </div>
        <div className="hidden mx-auto w-full max-w-[360px] overflow-hidden rounded-[36px] border-4 border-gray-900 bg-white shadow-2xl">
          <div
            className="relative min-h-[560px] px-4 py-6"
            style={{
              fontFamily: fontStack,
              ...(isMidnight
                ? {
                    background: `radial-gradient(circle at 18% 8%, ${primary}99, transparent 32%), radial-gradient(circle at 84% 18%, ${secondary}88, transparent 36%), #110d1c`,
                  }
                : visual.cover_image_url
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
              <div className={`rounded-2xl px-4 py-3 text-xs font-semibold ${isMidnight ? 'border border-white/15 bg-white/8 text-white' : 'bg-white/18 text-white'}`}>
                <span className="uppercase tracking-[0.16em] opacity-60">Template</span>
                <p className="mt-1 text-sm font-bold">{isMidnight ? 'Noche · portada editorial' : 'Viaje · boarding pass'}</p>
              </div>
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

function EditorPreviewContent({
  config,
  isMidnight,
  primary,
}: {
  config: InvitationConfig
  isMidnight: boolean
  primary: string
}) {
  return (
    <section className="invitation-surface-card relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl">
      {isMidnight ? (
        <h2 className="invitation-section-title">Tus Datos</h2>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Estado del acceso</p>
          <h3 className="mt-4 text-xl font-semibold text-slate-950">Completá tu check-in</h3>
        </>
      )}
      <div className="mt-5 space-y-3" aria-hidden="true">
        {config.fields.rsvp && (
          <div className="grid grid-cols-2 gap-2">
            <span className="rounded-lg py-2 text-center text-xs font-semibold text-white" style={{ backgroundColor: primary }}>
              Confirmar
            </span>
            <span className="rounded-lg border border-white/25 py-2 text-center text-xs font-semibold text-white/65">
              No asistiré
            </span>
          </div>
        )}
        <MockInput label="Nombre y apellido" />
        {config.fields.dni && <MockInput label="DNI" />}
        {config.fields.companions && <MockInput label="Acompañantes" />}
        {config.fields.menu && <MockInput label="Menú especial" />}
        <div className="rounded-xl border border-dashed border-white/25 px-3 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-white/50">
          Vista previa · envío deshabilitado
        </div>
      </div>
    </section>
  )
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const isTypographyGroup = typeof label === 'string' && label.startsWith('Tipograf')

  if (isTypographyGroup) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Tipograf&iacute;as</p>
        {children}
      </div>
    )
  }

  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {children}
    </label>
  )
}

function FontControl(props: { label?: string; role: keyof typeof DEFAULT_INVITATION_FONTS; value: InvitationFontKey; onChange: (value: InvitationFontKey) => void }) {
  const { role, value, onChange } = props
  const label = role === 'titles' ? <>Tipograf&iacute;a de t&iacute;tulos</> : role === 'subtitles' ? <>Tipograf&iacute;a de subt&iacute;tulos</> : <>Tipograf&iacute;a de datos</>

  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as InvitationFontKey)}
        className={inputClass}
      >
        {INVITATION_FONT_KEYS.map((key) => (
          <option key={key} value={key}>{INVITATION_FONT_LABELS[key]}</option>
        ))}
      </select>
    </Field>
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

function MockInput({ label }: { label: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-500">{label}</p>
      <div className="mt-0.5 h-7 rounded-md border border-gray-200 bg-gray-50" />
    </div>
  )
}

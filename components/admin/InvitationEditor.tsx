'use client'

import { useState } from 'react'
import type { DragEvent } from 'react'
import { ChevronDown, ChevronUp, GripVertical, Music2, Sparkles, Timer } from 'lucide-react'
import ImageUpload from '@/components/admin/ImageUpload'
import AudioUpload from '@/components/admin/AudioUpload'
import InvitationView, { buildCalendarUrl, type InvitationConfigInfo, type InvitationEventInfo } from '@/components/invitation/InvitationView'
import type { SurfaceBranding } from '@/types'
import {
  DEFAULT_INVITATION_BLOCKS,
  getInvitationBlock,
  getInvitationBlockOrder,
  INVITATION_BLOCK_KEYS,
  type InvitationBlockKey,
  type InvitationBlocks,
} from '@/lib/invitation-blocks'
import {
  INVITATION_TEMPLATES,
  getInvitationTemplateDefinition,
  type InvitationTemplateKey,
} from '@/lib/invitation-templates'
import { DEFAULT_INVITATION_LOGO, type InvitationLogoConfig } from '@/lib/invitation-logo'
import {
  DEFAULT_INVITATION_FONTS,
  getInvitationFonts,
  INVITATION_FONT_KEYS,
  INVITATION_FONT_LABELS,
  type InvitationFontKey,
} from '@/lib/invitation-fonts'
import type { InvitationConfigHistoryEntry } from '@/lib/invitation-config-state'
import { formatArgentinaDateTime } from '@/lib/event-date'

// Editor tipo "front editor" para la invitacion: panel de controles a la
// izquierda, preview en vivo (mockup de celular) a la derecha. Los campos
// visuales (colores, imagenes) persisten en event_branding; el resto de la
// configuracion visual (tipografia, widgets y campos) va en un JSON de config.

export type InvitationConfig = {
  template: InvitationTemplateKey
  fontFamily: 'sans' | 'serif' | 'display'
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
  blocks: InvitationBlocks
  logo: InvitationLogoConfig
}

type InvitationPreviewMode = 'pending' | 'confirmed' | 'ready' | 'checked_in'

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
  dresscode?: string
  directions_url?: string
  gift_info?: string
  contact_phone?: string
}

export const DEFAULT_INVITATION_CONFIG: InvitationConfig = {
  template: 'travel',
  fontFamily: 'display',
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
  blocks: DEFAULT_INVITATION_BLOCKS,
  logo: DEFAULT_INVITATION_LOGO,
}

export const LEGACY_FONT_LABELS: Record<InvitationConfig['fontFamily'], string> = {
  sans: 'Moderna (sans)',
  serif: 'Clásica (serif)',
  display: 'Display (marca)',
}

const HEX = /^#[0-9a-fA-F]{6}$/

export default function InvitationEditor({
  eventId,
  event,
  initialVisual,
  initialConfig,
  initialHistory = [],
}: {
  eventId: string
  event: EventInfo
  initialVisual: InvitationVisual
  initialConfig: InvitationConfig
  initialHistory?: InvitationConfigHistoryEntry[]
}) {
  const [visual, setVisual] = useState<InvitationVisual>(initialVisual)
  const [config, setConfig] = useState<InvitationConfig>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<InvitationPreviewMode>('pending')
  const [history, setHistory] = useState<InvitationConfigHistoryEntry[]>(initialHistory)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedBlock, setExpandedBlock] = useState<InvitationBlockKey | null>('personal')
  const [draggedBlock, setDraggedBlock] = useState<InvitationBlockKey | null>(null)

  const primary = HEX.test(visual.primary_color) ? visual.primary_color : '#8b5e3c'
  const secondary = HEX.test(visual.secondary_color) ? visual.secondary_color : '#f1e8da'
  const paletteFallbacks = {
    background: '#000000',
    title: secondary,
    subtitle: '#ffffff',
    data: '#ffffff',
    accent: secondary,
  }
  const isMidnight = config.template === 'midnight'
  const templateDefinition = getInvitationTemplateDefinition(config.template)
  const orderedBlockKeys = getInvitationBlockOrder(config.blocks, templateDefinition.supportedBlocks, templateDefinition.defaultBlockOrder)
  // La invitación resuelve sus tipografías con getInvitationFonts. El editor
  // tiene que leer exactamente lo mismo: un <select> cuyo value no coincide con
  // ninguna opción muestra la primera (Nunito) y afirma una fuente que no es la
  // que se está aplicando.
  const fonts = getInvitationFonts(config)
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
  const toggleBlock = (key: InvitationBlockKey) =>
    setConfig((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        [key]: {
          ...getInvitationBlock(current.blocks, key),
          visible: !getInvitationBlock(current.blocks, key).visible,
        },
      },
    }))
  const updateBlock = (key: InvitationBlockKey, field: 'title' | 'body', value: string) =>
    setConfig((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        [key]: { ...getInvitationBlock(current.blocks, key), [field]: value },
      },
    }))
  const updateLogo = (field: keyof InvitationLogoConfig, value: string | number) =>
    setConfig((current) => ({ ...current, logo: { ...DEFAULT_INVITATION_LOGO, ...current.logo, [field]: value } }))
  const moveBlock = (key: InvitationBlockKey, direction: -1 | 1) =>
    setConfig((current) => {
      const currentOrder = getInvitationBlockOrder(current.blocks, templateDefinition.supportedBlocks, templateDefinition.defaultBlockOrder)
      const index = currentOrder.indexOf(key)
      const target = index + direction
      if (index < 0 || target < 0 || target >= currentOrder.length) return current
      const nextOrder = [...currentOrder]
      ;[nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]]
      return { ...current, blocks: { ...current.blocks, order: nextOrder } }
    })
  const handleBlockDrop = (event: DragEvent<HTMLDivElement>, target: InvitationBlockKey) => {
    event.preventDefault()
    const source = draggedBlock
    setDraggedBlock(null)
    if (!source || source === target) return
    setConfig((current) => {
      const currentOrder = getInvitationBlockOrder(current.blocks, templateDefinition.supportedBlocks, templateDefinition.defaultBlockOrder)
      const from = currentOrder.indexOf(source)
      const to = currentOrder.indexOf(target)
      if (from < 0 || to < 0) return current
      const nextOrder = [...currentOrder]
      nextOrder.splice(from, 1)
      nextOrder.splice(to, 0, source)
      return { ...current, blocks: { ...current.blocks, order: nextOrder } }
    })
  }

  // Guardar es publicar. No hay borrador: lo que se guarda es lo que ven todos
  // los invitados, en el momento. La red de seguridad son las versiones
  // guardadas, no un estado intermedio invisible.
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/events/${eventId}/invitation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visual, config, mode: 'publish' }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; configPersisted?: boolean; history?: InvitationConfigHistoryEntry[] }
        | null
      if (!response.ok) throw new Error(payload?.error || 'No se pudo guardar.')
      setNotice(
        payload?.configPersisted === false
          ? 'Aspecto guardado. Los widgets se guardan al correr la migración de config (columna event_branding.config).'
          : 'Invitación guardada.'
      )
      if (payload?.configPersisted !== false) {
        setNotice('Invitación guardada. Ya la ven todos los invitados.')
        if (payload?.history) setHistory(payload.history)
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const restoreVersion = (entry: InvitationConfigHistoryEntry) => {
    const value = entry.config as Partial<InvitationConfig> & Record<string, unknown>
    setConfig({
      ...DEFAULT_INVITATION_CONFIG,
      ...value,
      colors: { ...DEFAULT_INVITATION_CONFIG.colors, ...(value.colors as Partial<InvitationConfig['colors']> ?? {}) },
      fonts: { ...DEFAULT_INVITATION_FONTS, ...(value.fonts as Partial<InvitationConfig['fonts']> ?? {}) },
      widgets: { ...DEFAULT_INVITATION_CONFIG.widgets, ...(value.widgets as Partial<InvitationConfig['widgets']> ?? {}) },
      fields: { ...DEFAULT_INVITATION_CONFIG.fields, ...(value.fields as Partial<InvitationConfig['fields']> ?? {}) },
      blocks: { ...DEFAULT_INVITATION_BLOCKS, ...(value.blocks as Partial<InvitationBlocks> ?? {}) },
      logo: { ...DEFAULT_INVITATION_LOGO, ...(value.logo as Partial<InvitationLogoConfig> ?? {}) },
    })
    setNotice('Versión restaurada en el editor. Guardá para aplicarla.')
    setError(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
      {/* Panel de controles */}
      <div className="space-y-5">
        <StructuredEditorControls
          eventId={eventId}
          visual={visual}
          config={config}
          fonts={fonts}
          paletteFallbacks={paletteFallbacks}
          templateDefinition={templateDefinition}
          orderedBlockKeys={orderedBlockKeys}
          expandedBlock={expandedBlock}
          draggedBlock={draggedBlock}
          setConfig={setConfig}
          setVisualField={setVisualField}
          updateLogo={updateLogo}
          toggleWidget={toggleWidget}
          toggleField={toggleField}
          toggleBlock={toggleBlock}
          updateBlock={updateBlock}
          setExpandedBlock={setExpandedBlock}
          setDraggedBlock={setDraggedBlock}
          moveBlock={moveBlock}
          handleBlockDrop={handleBlockDrop}
        />
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
                role="titles"
                value={fonts.titles}
                onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...fonts, titles: value } }))}
              />
              <FontControl
                role="subtitles"
                value={fonts.subtitles}
                onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...fonts, subtitles: value } }))}
              />
              <FontControl
                role="data"
                value={fonts.data}
                onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...fonts, data: value } }))}
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

        <Section title="Widgets opcionales" desc="Activá solo los que quieras. La invitación no obliga a completarlos.">
          {isMidnight && (
            <ToggleRow icon={Timer} label="Cuenta regresiva" desc="Días, horas y minutos para el evento." on={config.widgets.countdown} onToggle={() => toggleWidget('countdown')} />
          )}
          <ToggleRow icon={Sparkles} label="Partículas animadas" desc="Efecto de luces flotando sobre el fondo." on={config.widgets.particles} onToggle={() => toggleWidget('particles')} />
        </Section>

        <Section title="Bloques y contenido" desc="Elegí qué aparece y ajustá sólo los textos permitidos por la template.">
          <Field label="Título de invitación especial">
            <input
              value={getInvitationBlock(config.blocks, 'personal').title}
              onChange={(event) => updateBlock('personal', 'title', event.target.value)}
              className={inputClass}
              maxLength={120}
            />
          </Field>
          <Field label="Texto de invitación especial">
            <textarea
              value={getInvitationBlock(config.blocks, 'personal').body}
              onChange={(event) => updateBlock('personal', 'body', event.target.value)}
              className={`${inputClass} min-h-20`}
              maxLength={500}
              rows={3}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            {INVITATION_BLOCK_KEYS.map((key) => {
              const labels: Record<InvitationBlockKey, string> = {
                personal: 'Invitación especial',
                eventDetails: 'Fecha, hora y lugar',
                countdown: 'Cuenta regresiva',
                dresscode: 'Dress code',
                gift: 'Regalo',
                actions: 'Botones de interacción',
                audio: 'Música',
                guestData: 'Tus datos',
              }
              return (
                <ToggleRow
                  key={key}
                  label={labels[key]}
                  on={getInvitationBlock(config.blocks, key).visible}
                  onToggle={() => toggleBlock(key)}
                />
              )
            })}
          </div>
        </Section>

        <Section title="Datos que pedimos" desc="Los campos funcionales del formulario de confirmación.">
          <ToggleRow label="Confirmar asistencia (RSVP)" on={config.fields.rsvp} onToggle={() => toggleField('rsvp')} />
          <ToggleRow label="DNI" on={config.fields.dni} onToggle={() => toggleField('dni')} />
          <ToggleRow label="Menú especial" on={config.fields.menu} onToggle={() => toggleField('menu')} />
          <ToggleRow label="Acompañantes" on={config.fields.companions} onToggle={() => toggleField('companions')} />
        </Section>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? 'Guardando...' : 'Guardar invitación'}
          </button>
          <span className="text-xs text-gray-500">
            Lo que guardes se ve al instante en todas las invitaciones ya enviadas.
          </span>
        </div>

        {history.length > 0 ? (
          <Section title="Versiones guardadas" desc="Volvé a una versión anterior. Se aplica cuando guardás.">
            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800">Versión guardada</p>
                    <p className="truncate text-xs text-gray-500">
                      {formatArgentinaDateTime(entry.saved_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreVersion(entry)}
                    className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          </Section>
        ) : null}
      </div>

      {/* Preview en vivo */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Vista previa en vivo</p>
        <label className="mb-3 block text-xs font-medium text-gray-500">
          Ver como
          <select
            value={previewMode}
            onChange={(event) => setPreviewMode(event.target.value as InvitationPreviewMode)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="pending">Invitación pendiente</option>
            <option value="confirmed">Asistencia confirmada</option>
            <option value="ready">Acceso habilitado</option>
            <option value="checked_in">Ingreso registrado</option>
          </select>
        </label>
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
              <EditorPreviewContent config={config} isMidnight={isMidnight} primary={primary} previewMode={previewMode} />
            </InvitationView>
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
  previewMode,
}: {
  config: InvitationConfig
  isMidnight: boolean
  primary: string
  previewMode: InvitationPreviewMode
}) {
  const statusCopy: Record<InvitationPreviewMode, { label: string; detail: string }> = {
    pending: { label: 'Acreditación pendiente', detail: 'Completá tus datos para confirmar asistencia.' },
    confirmed: { label: 'Asistencia confirmada', detail: 'Tu respuesta fue registrada correctamente.' },
    ready: { label: 'Acceso confirmado', detail: 'Tu QR final está listo para ingresar.' },
    checked_in: { label: 'Ingreso registrado', detail: 'Tu ingreso ya fue registrado en puerta.' },
  }
  const status = statusCopy[previewMode]

  if (previewMode !== 'pending') {
    return <PreviewModeState mode={previewMode} primary={primary} isMidnight={isMidnight} status={status} />
  }

  return (
    <section className="invitation-surface-card relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl">
      <div className="mb-5 rounded-2xl px-4 py-3 text-left text-white" style={{ backgroundColor: primary }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-75">{status.label}</p>
        <p className="mt-1 text-sm font-medium">{status.detail}</p>
      </div>
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

function PreviewModeState({
  mode,
  primary,
  isMidnight,
  status,
}: {
  mode: Exclude<InvitationPreviewMode, 'pending'>
  primary: string
  isMidnight: boolean
  status: { label: string; detail: string }
}) {
  return (
    <section className="invitation-surface-card relative overflow-hidden rounded-[28px] border border-slate-300 bg-[#eed8d2] p-6 pt-7 text-slate-950 shadow-2xl">
      <div className="mb-5 rounded-2xl px-4 py-3 text-left text-white" style={{ backgroundColor: primary }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-75">{status.label}</p>
        <p className="mt-1 text-sm font-medium">{status.detail}</p>
      </div>

      {mode === 'confirmed' ? (
        <>
          <h2 className="invitation-section-title">{isMidnight ? 'Tus Datos' : 'Tu confirmación'}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Tu asistencia quedó registrada. Este es el resumen que verá la persona invitada.</p>
          <dl className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm">
            <PreviewSummaryRow label="Nombre" value="Invitado/a de ejemplo" />
            <PreviewSummaryRow label="DNI" value="No informado" />
            <PreviewSummaryRow label="Menú" value="Sin aclaraciones" />
          </dl>
          <p className="mt-4 rounded-xl border border-dashed border-amber-400/70 bg-amber-100/70 px-3 py-2 text-center text-xs font-medium text-amber-950">
            Si este tipo requiere pago, el botón de pago aparece en este paso.
          </p>
        </>
      ) : mode === 'ready' ? (
        <>
          <h2 className="invitation-section-title">Tu acceso</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">El QR ya está habilitado y listo para mostrar en la puerta.</p>
          <div className="mx-auto mt-5 grid aspect-square w-52 place-items-center rounded-3xl bg-white p-4 shadow-inner">
            <PreviewQrPlaceholder />
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-slate-600">Mostralo desde tu celular al llegar.</p>
        </>
      ) : (
        <>
          <h2 className="invitation-section-title">Ingreso registrado</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Esta invitación ya fue utilizada en la puerta.</p>
          <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-100/80 p-4 text-center text-sm font-semibold text-emerald-950">
            Check-in confirmado
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-slate-600">El QR no vuelve a mostrarse como acceso disponible.</p>
        </>
      )}
    </section>
  )
}

function PreviewSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  )
}

function PreviewQrPlaceholder() {
  return (
    <div className="grid size-full grid-cols-9 grid-rows-9 gap-1" aria-label="Vista previa de un QR">
      {Array.from({ length: 81 }, (_, index) => {
        const row = Math.floor(index / 9)
        const column = index % 9
        const finder = (row < 3 && column < 3) || (row < 3 && column > 5) || (row > 5 && column < 3)
        const filled = finder || ((index * 17 + row * 5 + column) % 7 < 3)
        return <span key={index} className={filled ? 'rounded-[1px] bg-slate-950' : 'rounded-[1px] bg-transparent'} />
      })}
    </div>
  )
}

type StructuredEditorControlsProps = {
  eventId: string
  visual: InvitationVisual
  config: InvitationConfig
  fonts: ReturnType<typeof getInvitationFonts>
  paletteFallbacks: Record<keyof InvitationConfig['colors'], string>
  templateDefinition: ReturnType<typeof getInvitationTemplateDefinition>
  orderedBlockKeys: InvitationBlockKey[]
  expandedBlock: InvitationBlockKey | null
  draggedBlock: InvitationBlockKey | null
  setConfig: React.Dispatch<React.SetStateAction<InvitationConfig>>
  setVisualField: (key: keyof InvitationVisual, value: string) => void
  updateLogo: (field: keyof InvitationLogoConfig, value: string | number) => void
  toggleWidget: (key: keyof InvitationConfig['widgets']) => void
  toggleField: (key: keyof InvitationConfig['fields']) => void
  toggleBlock: (key: InvitationBlockKey) => void
  updateBlock: (key: InvitationBlockKey, field: 'title' | 'body', value: string) => void
  setExpandedBlock: (key: InvitationBlockKey | null) => void
  setDraggedBlock: (key: InvitationBlockKey | null) => void
  moveBlock: (key: InvitationBlockKey, direction: -1 | 1) => void
  handleBlockDrop: (event: DragEvent<HTMLDivElement>, target: InvitationBlockKey) => void
}

function StructuredEditorControls({
  eventId,
  visual,
  config,
  fonts,
  paletteFallbacks,
  templateDefinition,
  orderedBlockKeys,
  expandedBlock,
  draggedBlock,
  setConfig,
  setVisualField,
  updateLogo,
  toggleWidget,
  toggleField,
  toggleBlock,
  updateBlock,
  setExpandedBlock,
  setDraggedBlock,
  moveBlock,
  handleBlockDrop,
}: StructuredEditorControlsProps) {
  return (
    <>
      <Section title="1. Plantilla" desc="Elegí un universo visual. El contenido se conserva al cambiar de plantilla.">
        <div className="grid gap-3 sm:grid-cols-2">
          {INVITATION_TEMPLATES.map((template) => (
            <button key={template.key} type="button" onClick={() => setConfig((current) => ({ ...current, template: template.key }))} className={`rounded-xl border p-4 text-left transition ${config.template === template.key ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-400'}`} aria-pressed={config.template === template.key}>
              <span className="block text-sm font-semibold">{template.label}</span>
              <span className={`mt-1 block text-xs leading-5 ${config.template === template.key ? 'text-white/70' : 'text-gray-500'}`}>{template.description}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="2. Identidad" desc="Definí el fondo, la paleta y la marca de la invitación.">
        <ImageUpload label="Imagen de fondo" hint="Cubre toda la invitación. El contenido se adapta encima." value={visual.cover_image_url} onChange={(url) => setVisualField('cover_image_url', url)} fields={{ bucket: 'event-assets', folder: eventId, label: 'invitation-bg' }} />
        <ImageUpload label="Logo (opcional)" hint="PNG transparente recomendado. Si no cargás uno, podés usar una marca de texto." value={visual.logo_url} onChange={(url) => setVisualField('logo_url', url)} fields={{ bucket: 'event-assets', folder: eventId, label: 'logo' }} />
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">Marca de texto alternativa</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">Se usa solo cuando no hay una imagen de logo.</p>
          <div className="mt-3 space-y-3">
            <Field label="Nombre o texto de marca"><input value={config.logo?.text ?? ''} onChange={(event) => updateLogo('text', event.target.value)} className={inputClass} maxLength={80} placeholder="Ej. Alfonsina" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tipografía"><select value={config.logo?.font ?? DEFAULT_INVITATION_LOGO.font} onChange={(event) => updateLogo('font', event.target.value)} className={inputClass}>{INVITATION_FONT_KEYS.map((key) => <option key={key} value={key}>{INVITATION_FONT_LABELS[key]}</option>)}</select></Field>
              <Field label="Tamaño (px)"><input type="number" min={16} max={96} value={config.logo?.size ?? DEFAULT_INVITATION_LOGO.size} onChange={(event) => updateLogo('size', Number(event.target.value) || DEFAULT_INVITATION_LOGO.size)} className={inputClass} /></Field>
              <Field label="Interletrado (em)"><input type="number" min={-0.05} max={0.5} step={0.01} value={config.logo?.letterSpacing ?? DEFAULT_INVITATION_LOGO.letterSpacing} onChange={(event) => updateLogo('letterSpacing', Number(event.target.value) || 0)} className={inputClass} /></Field>
              <ColorControl label="Color de la marca" value={config.logo?.color ?? DEFAULT_INVITATION_LOGO.color} fallback={DEFAULT_INVITATION_LOGO.color} onChange={(value) => updateLogo('color', value)} />
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Paleta</p>
          <div className="grid gap-4 sm:grid-cols-2">{(Object.keys(paletteFallbacks) as Array<keyof typeof paletteFallbacks>).map((key) => <ColorControl key={key} label={key === 'background' ? 'Color de fondo' : key === 'title' ? 'Color de títulos' : key === 'subtitle' ? 'Color de subtítulos' : key === 'data' ? 'Color de datos' : 'Color de acento'} value={config.colors[key] || paletteFallbacks[key]} fallback={paletteFallbacks[key]} onChange={(value) => setConfig((current) => ({ ...current, colors: { ...current.colors, [key]: value } }))} />)}</div>
        </div>
        <Field label="Tipografías"><div className="grid gap-3 sm:grid-cols-2"><FontControl role="titles" value={fonts.titles} onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...fonts, titles: value } }))} /><FontControl role="subtitles" value={fonts.subtitles} onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...fonts, subtitles: value } }))} /><FontControl role="data" value={fonts.data} onChange={(value) => setConfig((current) => ({ ...current, fonts: { ...fonts, data: value } }))} /></div></Field>
      </Section>

      <Section title="3. Contenido y orden" desc="Activá cada módulo, editá sus textos y arrastralo para cambiar su posición.">
        <div className="space-y-2">
          {orderedBlockKeys.map((key, index) => <BlockEditorCard key={key} blockKey={key} index={index} total={orderedBlockKeys.length} expanded={expandedBlock === key} block={getInvitationBlock(config.blocks, key)} dragged={draggedBlock === key} disabled={key === 'countdown' && templateDefinition.key !== 'midnight'} onToggle={() => toggleBlock(key)} onExpand={() => setExpandedBlock(expandedBlock === key ? null : key)} onMove={(direction) => moveBlock(key, direction)} onDragStart={() => setDraggedBlock(key)} onDrop={(event) => handleBlockDrop(event, key)} onDragEnd={() => setDraggedBlock(null)} onUpdate={(field, value) => updateBlock(key, field, value)} />)}
        </div>
      </Section>

      <Section title="4. Interacción y ambiente" desc="Configurá los datos que pedís y los efectos opcionales.">
        <ToggleRow label="Confirmar asistencia (RSVP)" on={config.fields.rsvp} onToggle={() => toggleField('rsvp')} />
        <ToggleRow label="DNI" on={config.fields.dni} onToggle={() => toggleField('dni')} />
        <ToggleRow label="Menú especial" on={config.fields.menu} onToggle={() => toggleField('menu')} />
        <ToggleRow label="Acompañantes" on={config.fields.companions} onToggle={() => toggleField('companions')} />
        <div className="border-t border-gray-200 pt-3"><ToggleRow icon={Sparkles} label="Partículas animadas" desc="Efecto de luces flotando sobre el fondo." on={config.widgets.particles} onToggle={() => toggleWidget('particles')} /></div>
        <AudioUpload label="Música de la invitación" hint="MP3, M4A, WAV, OGG o WEBM (máximo 20 MB)." value={config.audio_url} onChange={(audio_url) => setConfig((current) => ({ ...current, audio_url }))} fields={{ bucket: 'event-assets', folder: eventId, label: 'invitation-audio' }} />
      </Section>
    </>
  )
}

const BLOCK_LABELS: Record<InvitationBlockKey, string> = {
  personal: 'Invitación especial',
  eventDetails: 'Fecha, hora y lugar',
  countdown: 'Cuenta regresiva',
  dresscode: 'Dress code',
  gift: 'Regalo',
  actions: 'Botones de interacción',
  audio: 'Música',
  guestData: 'Tus datos',
}

function BlockEditorCard({
  blockKey,
  index,
  total,
  expanded,
  block,
  dragged,
  disabled = false,
  onToggle,
  onExpand,
  onMove,
  onDragStart,
  onDrop,
  onDragEnd,
  onUpdate,
}: {
  blockKey: InvitationBlockKey
  index: number
  total: number
  expanded: boolean
  block: ReturnType<typeof getInvitationBlock>
  dragged: boolean
  disabled?: boolean
  onToggle: () => void
  onExpand: () => void
  onMove: (direction: -1 | 1) => void
  onDragStart: () => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
  onUpdate: (field: 'title' | 'body', value: string) => void
}) {
  return (
    <div draggable={!disabled} onDragStart={onDragStart} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} onDragEnd={onDragEnd} className={`rounded-xl border bg-white transition ${dragged ? 'border-gray-900 opacity-50' : block.visible ? 'border-gray-200' : 'border-gray-200 opacity-70'}`}>
      <div className="flex items-center gap-2 p-3">
        <span className={`cursor-grab text-gray-400 ${disabled ? 'cursor-not-allowed opacity-40' : ''}`} aria-label="Arrastrar módulo"><GripVertical className="size-5" aria-hidden="true" /></span>
        <button type="button" onClick={onExpand} className="min-w-0 flex-1 text-left" aria-expanded={expanded}><span className="block text-sm font-semibold text-gray-900">{BLOCK_LABELS[blockKey]}</span><span className="block text-xs text-gray-500">{disabled ? 'No disponible en esta plantilla' : block.visible ? 'Visible en la invitación' : 'Oculto en la invitación'}</span></button>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0 || disabled} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Subir módulo"><ChevronUp className="size-4" /></button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1 || disabled} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Bajar módulo"><ChevronDown className="size-4" /></button>
        <button type="button" onClick={onToggle} disabled={disabled} className={`flex h-5 w-9 flex-none items-center rounded-full p-0.5 transition ${block.visible && !disabled ? 'bg-emerald-500' : 'bg-gray-300'}`} aria-label={`${block.visible ? 'Ocultar' : 'Mostrar'} ${BLOCK_LABELS[blockKey]}`}><span className={`size-4 rounded-full bg-white transition ${block.visible && !disabled ? 'translate-x-4' : ''}`} /></button>
      </div>
      {expanded && !disabled ? <div className="space-y-3 border-t border-gray-100 bg-gray-50 p-3"><Field label="Título"><input value={block.title} onChange={(event) => onUpdate('title', event.target.value)} className={inputClass} maxLength={120} /></Field><Field label="Texto complementario"><textarea value={block.body} onChange={(event) => onUpdate('body', event.target.value)} className={`${inputClass} min-h-20`} maxLength={500} rows={3} /></Field></div> : null}
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  const legacyEditorSection = ['Aspecto', 'Widgets opcionales', 'Bloques y contenido', 'Datos que pedimos'].includes(title)
  return (
    <div className={`${legacyEditorSection ? 'hidden ' : ''}rounded-xl border border-gray-200 bg-white p-5 shadow-sm`}>
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

function FontControl({ role, value, onChange }: { role: keyof typeof DEFAULT_INVITATION_FONTS; value: InvitationFontKey; onChange: (value: InvitationFontKey) => void }) {
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
      <div className="mt-2 flex items-center gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
          <span
            className="absolute inset-1 rounded-lg"
            style={{ backgroundColor: HEX.test(value) ? value : fallback }}
            aria-hidden="true"
          />
          <input
            type="color"
            value={HEX.test(value) ? value : fallback}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={`Selector de ${label.toLocaleLowerCase('es-AR')}`}
          />
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} mt-0 min-w-0 flex-1 font-mono`}
          placeholder={fallback}
        />
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

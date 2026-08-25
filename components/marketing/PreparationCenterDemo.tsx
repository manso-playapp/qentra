'use client'

import { useState } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CreditCard,
  DoorOpen,
  QrCode,
  RotateCcw,
  Users,
  Utensils,
  WalletCards,
} from 'lucide-react'
import { trackMarketingEvent } from '@/lib/marketing-analytics'

const attentionItems = [
  {
    id: 'confirmations',
    icon: Users,
    eyebrow: 'Confirmaciones',
    title: '17 grupos todavía no confirmaron.',
    detail: 'Alista los ordena por último contacto para que puedas decidir a quién escribir primero.',
    action: 'Ver grupos',
    resolveAction: 'Marcar seguimiento iniciado',
  },
  {
    id: 'payments',
    icon: CreditCard,
    eyebrow: 'Pagos',
    title: '2 pagos siguen pendientes.',
    detail: 'Los dos accesos permanecen reservados y todavía no están habilitados para la puerta.',
    action: 'Revisar pagos',
    resolveAction: 'Marcar pagos revisados',
  },
  {
    id: 'groups',
    icon: Users,
    eyebrow: 'Grupos',
    title: 'Un acompañante fue modificado.',
    detail: 'Familia López cambió a su acompañante. El grupo conserva un único QR y requiere validación.',
    action: 'Ver cambio',
    resolveAction: 'Validar modificación',
  },
  {
    id: 'restrictions',
    icon: Utensils,
    eyebrow: 'Restricciones',
    title: 'Martina agregó un menú vegetariano.',
    detail: 'La novedad ya está asociada a su confirmación y lista para compartir con el salón.',
    action: 'Revisar cambio',
    resolveAction: 'Marcar restricción revisada',
  },
] as const

type AttentionId = (typeof attentionItems)[number]['id']

const preparationFactors = [
  { id: 'confirmations', label: 'Confirmaciones', detail: '163 confirmados', base: 23, max: 25 },
  { id: 'payments', label: 'Pagos', detail: '2 pendientes', base: 18, max: 20 },
  { id: 'groups', label: 'Grupos', detail: '3 incompletos', base: 13, max: 15 },
  { id: 'restrictions', label: 'Restricciones', detail: '1 cambio nuevo', base: 8, max: 10 },
  { id: 'qr', label: 'Invitaciones y QR', detail: 'Generados', base: 10, max: 10 },
  { id: 'mercadopago', label: 'Mercado Pago', detail: 'Conectado', base: 10, max: 10 },
  { id: 'reception', label: 'Recepción', detail: 'Preparada', base: 10, max: 10 },
] as const

const operationalItems = [
  {
    id: 'mercadopago',
    icon: WalletCards,
    label: 'Mercado Pago',
    action: 'Ver conexión',
    detail: 'Cuenta conectada. Los cobros se acreditan directamente en la cuenta del organizador.',
  },
  {
    id: 'qr',
    icon: QrCode,
    label: 'QR generados',
    action: 'Ver accesos',
    detail: 'Cada grupo confirmado ya tiene un acceso único y trazable para la recepción.',
  },
  {
    id: 'reception',
    icon: DoorOpen,
    label: 'Recepción',
    action: 'Ver preparación',
    detail: 'Equipo asignado, dispositivos listos y listado descargado para contingencias.',
  },
] as const

type OperationalId = (typeof operationalItems)[number]['id']

export function PreparationCenterDemo() {
  const [selectedAttentionId, setSelectedAttentionId] = useState<AttentionId>('confirmations')
  const [resolvedAttentionIds, setResolvedAttentionIds] = useState<AttentionId[]>([])
  const [selectedOperationalId, setSelectedOperationalId] = useState<OperationalId>(
    operationalItems[0].id
  )

  const selectedAttention =
    attentionItems.find((item) => item.id === selectedAttentionId) ?? attentionItems[0]
  const selectedOperational =
    operationalItems.find((item) => item.id === selectedOperationalId) ?? operationalItems[0]
  const selectedAttentionResolved = resolvedAttentionIds.includes(selectedAttention.id)
  const preparationScore = preparationFactors.reduce(
    (total, factor) =>
      total +
      factor.base +
      (resolvedAttentionIds.includes(factor.id as AttentionId) ? factor.max - factor.base : 0),
    0
  )

  function resolveAttentionItem(id: AttentionId) {
    if (resolvedAttentionIds.includes(id)) return

    trackMarketingEvent('preparation_item_resolved', {
      item: id,
      resolved_count: (resolvedAttentionIds.length + 1) as 1 | 2 | 3 | 4,
    })
    setResolvedAttentionIds((current) => [...current, id])
  }

  function selectAttentionItem(id: AttentionId) {
    setSelectedAttentionId(id)
    trackMarketingEvent('preparation_item_viewed', { item: id })
  }

  function resetDemo() {
    setSelectedAttentionId('confirmations')
    setResolvedAttentionIds([])
    setSelectedOperationalId('mercadopago')
  }

  return (
    <div className="overflow-hidden rounded-[2.5rem] bg-[#f0eee8] text-[#171714] shadow-[0_35px_90px_rgba(0,0,0,0.2)]">
      <div className="grid gap-8 border-b border-black/10 p-6 sm:p-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:p-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-black/60">
            <span className="size-2 rounded-full bg-[#d75437]" aria-hidden="true" />
            Escenario demo · no son métricas de Dharma
          </div>
          <p className="marketing-display mt-5 text-7xl font-black leading-none tracking-[-0.02em] sm:text-8xl">
            <span aria-live="polite">{preparationScore}%</span>
          </p>
          <p className="mt-2 text-sm font-bold">Preparación del evento</p>
        </div>

        <div>
          <div
            className="h-3 overflow-hidden rounded-full bg-black/10"
            role="progressbar"
            aria-label="Nivel de preparación del escenario demo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={preparationScore}
          >
            <div
              className="h-full rounded-full bg-[#d75437] transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${preparationScore}%` }}
            />
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-black/65">
            El porcentaje suma siete factores visibles. Revisá los pendientes para ver cómo cambia, sin
            puntajes ocultos ni gamificación.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border-b border-black/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10" aria-labelledby="attention-title">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9d3524]">Inbox operativo</p>
              <h3 id="attention-title" className="marketing-display mt-2 text-4xl font-black tracking-[-0.015em]">
                Necesita tu atención
              </h3>
            </div>
            {resolvedAttentionIds.length > 0 ? (
              <button
                type="button"
                onClick={resetDemo}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-black/15 text-black/55 transition hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                aria-label="Reiniciar escenario demo"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="mt-7 space-y-2">
            {attentionItems.map((item) => {
              const Icon = item.icon
              const selected = item.id === selectedAttentionId
              const resolved = resolvedAttentionIds.includes(item.id)

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectAttentionItem(item.id)}
                  aria-pressed={selected}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                    selected ? 'border-black bg-white' : 'border-black/10 bg-white/35 hover:border-black/25'
                  }`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-xl ${
                      resolved ? 'bg-[#173b36] text-white' : 'bg-[#ffcfbf] text-[#8c2f1f]'
                    }`}
                  >
                    {resolved ? (
                      <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <Icon className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-black/60">
                      {item.eyebrow}
                    </span>
                    <span className="mt-1 block text-sm font-bold leading-5">{item.title}</span>
                  </span>
                  <ChevronRight className="size-4 text-black/30" aria-hidden="true" />
                </button>
              )
            })}
          </div>

          <div className="mt-4 rounded-3xl bg-[#171714] p-5 text-white" aria-live="polite">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
              {selectedAttentionResolved ? (
                <CheckCircle2 className="size-4 text-[#d9ee73]" aria-hidden="true" />
              ) : (
                <CircleAlert className="size-4 text-[#ff8b70]" aria-hidden="true" />
              )}
              {selectedAttentionResolved ? 'Revisado en esta demo' : selectedAttention.action}
            </div>
            <p className="mt-3 text-sm leading-6 text-white/68">{selectedAttention.detail}</p>
            <button
              type="button"
              disabled={selectedAttentionResolved}
              onClick={() => resolveAttentionItem(selectedAttention.id)}
              className="mt-5 flex min-h-11 w-full items-center justify-between rounded-full bg-[#d9ee73] px-5 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171714] disabled:cursor-default disabled:bg-white/12 disabled:text-white/45"
            >
              {selectedAttentionResolved ? 'Acción registrada' : selectedAttention.resolveAction}
              {selectedAttentionResolved ? (
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              ) : (
                <ChevronRight className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10" aria-labelledby="factors-title">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Cálculo transparente</p>
          <h3 id="factors-title" className="marketing-display mt-2 text-4xl font-black tracking-[-0.015em]">
            Los siete factores
          </h3>

          <dl className="mt-7 divide-y divide-black/10 border-y border-black/10">
            {preparationFactors.map((factor) => {
              const resolved = resolvedAttentionIds.includes(factor.id as AttentionId)
              const current = resolved ? factor.max : factor.base

              return (
                <div key={factor.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5">
                  <dt>
                    <span className="block text-sm font-bold">{factor.label}</span>
                    <span className="mt-0.5 block text-xs text-black/60">{factor.detail}</span>
                  </dt>
                  <dd className="m-0 text-right">
                    <span className="marketing-display text-xl font-black">
                      {current}/{factor.max}
                    </span>
                    <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-black/10" aria-hidden="true">
                      <div
                        className={`h-full rounded-full ${current === factor.max ? 'bg-[#173b36]' : 'bg-[#d75437]'}`}
                        style={{ width: `${(current / factor.max) * 100}%` }}
                      />
                    </div>
                  </dd>
                </div>
              )
            })}
          </dl>

          <div className="mt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Operación preparada</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {operationalItems.map((item) => {
                const Icon = item.icon
                const selected = item.id === selectedOperationalId

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedOperationalId(item.id)}
                    aria-pressed={selected}
                    className={`rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                      selected ? 'border-[#173b36] bg-[#dfe8d5]' : 'border-black/10 bg-white/45 hover:border-black/25'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="grid size-8 place-items-center rounded-full bg-[#173b36] text-white">
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <Check className="size-3.5 text-[#173b36]" strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span className="mt-3 block text-xs font-black">{item.label}</span>
                    <span className="mt-1 block text-[10px] font-bold text-black/60">{item.action}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-3 rounded-2xl border border-black/10 bg-white/55 p-4 text-xs leading-5 text-black/65" aria-live="polite">
              <span className="font-black text-black">{selectedOperational.label}:</span>{' '}
              {selectedOperational.detail}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

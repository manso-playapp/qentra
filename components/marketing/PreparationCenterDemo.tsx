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
    detail: 'En la revisión acordamos a quién consultar. Madre e hija escriben a sus contactos desde su propio WhatsApp.',
    action: 'Ver grupos',
    resolveAction: 'Revisar este ejemplo',
  },
  {
    id: 'payments',
    icon: CreditCard,
    eyebrow: 'Pagos',
    title: '2 pagos siguen pendientes.',
    detail: 'Revisamos el estado asociado a cada invitación. Una captura de transferencia reenviada no reemplaza un pago confirmado.',
    action: 'Revisar pagos',
    resolveAction: 'Revisar este ejemplo',
  },
  {
    id: 'groups',
    icon: Users,
    eyebrow: 'Grupos',
    title: 'Falta el nombre de un acompañante.',
    detail: 'Acordamos quién pide el dato. El importe de una invitación paga contempla los lugares completados con nombre.',
    action: 'Revisar acompañantes',
    resolveAction: 'Revisar este ejemplo',
  },
  {
    id: 'restrictions',
    icon: Utensils,
    eyebrow: 'Restricciones',
    title: 'Hay un menú vegetariano para informar.',
    detail: 'Revisamos la información recibida y acordamos quién la comunica al salón antes de la fiesta.',
    action: 'Revisar información',
    resolveAction: 'Revisar este ejemplo',
  },
] as const

type AttentionId = (typeof attentionItems)[number]['id']

const preparationFactors = [
  { id: 'confirmations', label: 'Confirmaciones', detail: 'Definir quién consulta a quienes faltan' },
  { id: 'payments', label: 'Pagos', detail: 'Revisar estados cuando hay entradas pagas' },
  { id: 'groups', label: 'Acompañantes', detail: 'Completar nombres y revisar cantidades' },
  { id: 'restrictions', label: 'Necesidades alimentarias', detail: 'Comunicar lo necesario al salón' },
] as const

const operationalItems = [
  {
    id: 'mercadopago',
    icon: WalletCards,
    label: 'Mercado Pago',
    action: 'Ver conexión',
    detail: 'En fiestas con entrada paga, la responsable conecta su cuenta receptora. La disponibilidad del dinero depende de Mercado Pago.',
  },
  {
    id: 'qr',
    icon: QrCode,
    label: 'Invitaciones y QR',
    action: 'Qué revisamos',
    detail: 'Probamos los enlaces, los horarios y un ingreso de grupo completo. Confirmar asistencia y registrar el ingreso son pasos distintos.',
  },
  {
    id: 'reception',
    icon: DoorOpen,
    label: 'Recepción',
    action: 'Ver preparación',
    detail: 'Acordamos un referente de la organización y ensayamos con celulares asignados, cargadores y conexión. El recibidor es opcional y va después del control.',
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
  const reviewedCount = resolvedAttentionIds.length

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
            Ejemplos ficticios de una revisión acompañada
          </div>
          <p className="marketing-display mt-5 text-7xl font-black leading-none tracking-[-0.02em] sm:text-8xl">
            <span aria-live="polite">{reviewedCount}/4</span>
          </p>
          <p className="mt-2 text-sm font-bold">Ejemplos recorridos</p>
        </div>

        <div>
          <div
            className="h-3 overflow-hidden rounded-full bg-black/10"
            role="progressbar"
            aria-label="Ejemplos de revisión recorridos"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={reviewedCount}
          >
            <div
              className="h-full rounded-full bg-[#d75437] transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(reviewedCount / 4) * 100}%` }}
            />
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-black/65">
            Así trabajamos sobre los pendientes en los encuentros acordados. Recorrer estos ejemplos no confirma invitados, acredita pagos ni mide la preparación de una fiesta real.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border-b border-black/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10" aria-labelledby="attention-title">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9d3524]">Revisión con Alista</p>
              <h3 id="attention-title" className="marketing-display mt-2 text-4xl font-black tracking-[-0.015em]">
                Qué revisamos juntos
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
              {selectedAttentionResolved ? 'Ejemplo revisado' : selectedAttention.resolveAction}
              {selectedAttentionResolved ? (
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              ) : (
                <ChevronRight className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10" aria-labelledby="factors-title">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Seguimiento acordado</p>
          <h3 id="factors-title" className="marketing-display mt-2 text-4xl font-black tracking-[-0.015em]">
            Cada pendiente, una acción
          </h3>

          <dl className="mt-7 divide-y divide-black/10 border-y border-black/10">
            {preparationFactors.map((factor) => {
              const resolved = resolvedAttentionIds.includes(factor.id as AttentionId)

              return (
                <div key={factor.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3.5">
                  <dt>
                    <span className="block text-sm font-bold">{factor.label}</span>
                    <span className="mt-0.5 block text-xs text-black/60">{factor.detail}</span>
                  </dt>
                  <dd className="m-0 text-right">
                    <span className="text-xs font-bold">
                      {resolved ? 'Visto' : 'Por ver'}
                    </span>
                    <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-black/10" aria-hidden="true">
                      <div
                        className={`h-full rounded-full ${resolved ? 'bg-[#173b36]' : 'bg-[#d75437]'}`}
                        style={{ width: resolved ? '100%' : '0%' }}
                      />
                    </div>
                  </dd>
                </div>
              )
            })}
          </dl>

          <div className="mt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">También preparamos</p>
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

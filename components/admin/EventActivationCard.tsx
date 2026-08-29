'use client'

import { useState } from 'react'
import { BadgeCheck, Gift, LoaderCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/errors'
import { formatAlistaServicePrice, type ActivationPaymentStatus } from '@/lib/alista-service-payment'
import { buildActivationRequestHref, type ActivationSource, type ActivationState } from '@/lib/event-activation'
import { formatArgentinaDateTime } from '@/lib/event-date'

type EventActivationCardProps = {
  event: { id: string; name: string; event_date?: string | null }
  state: ActivationState
  activatedAt?: string | null
  note?: string | null
  /** Otorgar y dar de baja es solo del equipo de Alista. */
  canGrant: boolean
  /** Solo la dueña puede pagar la activación del evento. */
  canPay: boolean
  paymentStatus?: ActivationPaymentStatus | null
}

function formatDate(value?: string | null) {
  if (!value) return null
  return formatArgentinaDateTime(value, { dateStyle: 'medium', timeStyle: 'short' })
}

const SOURCE_LABEL: Record<ActivationSource, string> = {
  payment: 'Pago confirmado',
  cortesia: 'Cortesía',
  manual: 'Activación manual',
}

const BLOCKED_LABEL: Record<'never_activated' | 'revoked' | 'expired', string> = {
  never_activated: 'Sin activar',
  revoked: 'Activación dada de baja',
  expired: 'Activación vencida',
}

export default function EventActivationCard({
  event,
  state: initialState,
  activatedAt,
  note,
  canGrant,
  canPay,
  paymentStatus = null,
}: EventActivationCardProps) {
  const [state, setState] = useState(initialState)
  const [busy, setBusy] = useState<ActivationSource | 'revoke' | 'payment' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [changedAt, setChangedAt] = useState<string | null>(activatedAt ?? null)

  const startPayment = async () => {
    setBusy('payment')
    setError(null)

    try {
      const response = await fetch(`/api/events/${event.id}/activation/payment`, { method: 'POST' })
      const payload = (await response.json().catch(() => null)) as {
        data?: { checkoutUrl?: string }
        error?: string
      } | null
      const checkoutUrl = payload?.data?.checkoutUrl
      if (!response.ok || !checkoutUrl) {
        throw new Error(payload?.error ?? 'No se pudo iniciar el pago de activación.')
      }
      window.location.assign(checkoutUrl)
    } catch (caught) {
      setError(getErrorMessage(caught))
      setBusy(null)
    }
  }

  const run = async (action: 'grant' | 'revoke', source?: ActivationSource) => {
    setBusy(action === 'revoke' ? 'revoke' : (source ?? 'manual'))
    setError(null)

    try {
      const response = await fetch(`/api/events/${event.id}/activation`, {
        method: action === 'revoke' ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'revoke' ? undefined : JSON.stringify({ source }),
      })

      const payload = (await response.json()) as {
        data?: { state: ActivationState; activation: { activated_at?: string | null } }
        error?: string
      }

      if (!response.ok) throw new Error(payload.error ?? 'No se pudo actualizar la activación.')
      if (payload.data) {
        setState(payload.data.state)
        setChangedAt(payload.data.activation.activated_at ?? null)
      }
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setBusy(null)
    }
  }

  const formattedDate = formatDate(changedAt)

  if (state.activated) {
    return (
      <section className="border-y border-admin-border/80 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-8 flex-none place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <BadgeCheck className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Servicio Alista activo</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Las invitaciones se pueden emitir con normalidad.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <details className="group mt-2 pl-11">
          <summary className="w-fit cursor-pointer list-none text-xs font-semibold text-muted-foreground transition hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Ver detalles</span>
            <span className="hidden group-open:inline">Ocultar detalles</span>
          </summary>
          <div className="mt-3 border-l border-admin-border pl-4">
            <dl className="grid gap-1.5 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <dt className="text-muted-foreground">Origen:</dt>
                <dd className="font-medium text-foreground">{SOURCE_LABEL[state.source]}</dd>
              </div>
              {formattedDate && (
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <dt className="text-muted-foreground">Desde:</dt>
                  <dd className="font-medium text-foreground">{formattedDate}</dd>
                </div>
              )}
              {note && (
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <dt className="text-muted-foreground">Nota:</dt>
                  <dd className="text-foreground">{note}</dd>
                </div>
              )}
            </dl>

            {canGrant && (
              <div className="mt-4 border-t border-admin-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => void run('revoke')}
                >
                  {busy === 'revoke' ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Dar de baja
                </Button>
              </div>
            )}
          </div>
        </details>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="grid size-8 flex-none place-items-center rounded-full bg-amber-100 text-amber-700">
          <Lock className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">{BLOCKED_LABEL[state.reason]}</p>
          <p className="mt-0.5 text-sm leading-5 text-amber-900/80">
            Podés configurar el evento y cargar invitados. Para emitir sus links de invitación,
            primero hay que activar el servicio.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-4 pl-11">
        {!canGrant && canPay && (
          <div>
            <p className="mb-3 text-sm text-amber-950/75">
              Activá el evento por {formatAlistaServicePrice()} para empezar a emitir las invitaciones.
            </p>
            <Button type="button" onClick={() => void startPayment()} disabled={busy !== null}>
              {busy === 'payment' ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {paymentStatus === 'pending'
                ? 'Continuar con el pago'
                : `Activar por ${formatAlistaServicePrice()}`}
            </Button>
          </div>
        )}

        {!canGrant && !canPay && (
          <div>
            <p className="text-sm text-amber-950/75">
              La responsable del evento debe completar la activación para empezar a emitir invitaciones.
            </p>
            <a
              href={buildActivationRequestHref(event)}
              className="mt-3 inline-flex items-center rounded-full border border-amber-300 bg-white/60 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-white"
            >
              Consultar con Alista
            </a>
          </div>
        )}

        {canGrant && (
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy !== null} onClick={() => void run('grant', 'manual')}>
              {busy === 'manual' ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Activar
            </Button>
            <Button
              variant="outline"
              disabled={busy !== null}
              onClick={() => void run('grant', 'cortesia')}
              className="bg-white/60"
            >
              {busy === 'cortesia' ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Gift className="size-4" />
              )}
              Marcar como cortesía
            </Button>
          </div>
        )}

        {(formattedDate || note || state.reason !== 'never_activated') && (
          <details className="group mt-4">
            <summary className="w-fit cursor-pointer list-none text-xs font-semibold text-amber-900/70 transition hover:text-amber-950 [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Ver detalles</span>
              <span className="hidden group-open:inline">Ocultar detalles</span>
            </summary>
            <dl className="mt-3 grid gap-1.5 border-l border-amber-300 pl-4 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <dt className="text-amber-900/70">Estado:</dt>
                <dd className="font-medium text-amber-950">{BLOCKED_LABEL[state.reason]}</dd>
              </div>
              {formattedDate && (
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <dt className="text-amber-900/70">Último cambio:</dt>
                  <dd className="font-medium text-amber-950">{formattedDate}</dd>
                </div>
              )}
              {note && (
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <dt className="text-amber-900/70">Nota:</dt>
                  <dd className="text-amber-950">{note}</dd>
                </div>
              )}
            </dl>
          </details>
        )}
      </div>
    </section>
  )
}

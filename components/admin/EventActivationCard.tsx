'use client'

import { useState } from 'react'
import { BadgeCheck, Gift, LoaderCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getErrorMessage } from '@/lib/errors'
import { formatAlistaServicePrice, type ActivationPaymentStatus } from '@/lib/alista-service-payment'
import { buildActivationRequestHref, type ActivationSource, type ActivationState } from '@/lib/event-activation'

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
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  )
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

  return (
    <Card className="bg-admin-panel">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <span
            className={
              state.activated
                ? 'grid size-12 flex-none place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                : 'grid size-12 flex-none place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100'
            }
          >
            {state.activated ? (
              <BadgeCheck className="size-6" strokeWidth={1.75} />
            ) : (
              <Lock className="size-6" strokeWidth={1.75} />
            )}
          </span>

          <div className="min-w-0">
            <h3 className="admin-heading text-2xl text-foreground">
              {state.activated ? 'Evento activado' : BLOCKED_LABEL[state.reason]}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {state.activated
                ? 'Las invitaciones se pueden emitir con normalidad.'
                : 'Se puede configurar el evento y cargar invitados, pero todavía no se emiten los links de invitación.'}
            </p>
          </div>
        </div>

        <dl className="grid gap-1 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-muted-foreground">Origen:</dt>
            <dd className="font-medium text-foreground">
              {state.activated ? SOURCE_LABEL[state.source] : '—'}
            </dd>
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

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {!canGrant && !state.activated && canPay && (
          <div className="mt-auto">
            <p className="mb-3 text-sm text-muted-foreground">
              Activá el evento por {formatAlistaServicePrice()} para empezar a emitir las invitaciones.
            </p>
            <Button type="button" onClick={() => void startPayment()} disabled={busy !== null}>
              {busy === 'payment' ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {paymentStatus === 'pending' ? 'Continuar con el pago' : `Activar por ${formatAlistaServicePrice()}`}
            </Button>
          </div>
        )}

        {!canGrant && !state.activated && !canPay && (
          <div className="mt-auto">
            <p className="text-sm text-muted-foreground">
              La responsable del evento debe completar la activación para empezar a emitir invitaciones.
            </p>
            <a
              href={buildActivationRequestHref(event)}
              className="mt-3 inline-flex items-center rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
            >
              Consultar con Alista
            </a>
          </div>
        )}

        {canGrant && (
          <div className="mt-auto flex flex-wrap gap-2">
            {state.activated ? (
              <Button variant="outline" disabled={busy !== null} onClick={() => void run('revoke')}>
                {busy === 'revoke' ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Dar de baja
              </Button>
            ) : (
              <>
                <Button disabled={busy !== null} onClick={() => void run('grant', 'manual')}>
                  {busy === 'manual' ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Activar
                </Button>
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => void run('grant', 'cortesia')}
                >
                  {busy === 'cortesia' ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Gift className="size-4" />
                  )}
                  Marcar como cortesía
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

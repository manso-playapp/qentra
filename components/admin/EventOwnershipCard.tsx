'use client'

import { useState } from 'react'
import {
  ArrowRightLeft,
  CreditCard,
  Link2,
  LoaderCircle,
  ShieldCheck,
  Unlink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/errors'
import { formatArgentinaDateTime } from '@/lib/event-date'

type EventOwnershipCardProps = {
  event: { id: string; name: string }
  currentOwnerEmail?: string | null
  canTransferOwnership: boolean
  paymentAccount: {
    connected: boolean
    configured: boolean
    updatedAt?: string | null
  }
}

type TransferResponse = {
  data?: {
    newOwner?: { email?: string | null }
  }
  error?: string
}

export default function EventOwnershipCard({
  event,
  currentOwnerEmail,
  canTransferOwnership,
  paymentAccount,
}: EventOwnershipCardProps) {
  const [email, setEmail] = useState('')
  const [ownerEmail, setOwnerEmail] = useState(currentOwnerEmail ?? 'Cuenta responsable asignada')
  const [connected, setConnected] = useState(paymentAccount.connected)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [paymentBusy, setPaymentBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const formattedUpdatedAt = paymentAccount.updatedAt
    ? formatArgentinaDateTime(paymentAccount.updatedAt, { dateStyle: 'medium', timeStyle: 'short' })
    : null

  const submitTransfer = async () => {
    setBusy(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/events/${event.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json().catch(() => null)) as TransferResponse | null

      if (!response.ok) throw new Error(payload?.error ?? 'No se pudo transferir el evento.')

      const newOwnerEmail = payload?.data?.newOwner?.email ?? email.trim().toLowerCase()
      setOwnerEmail(newOwnerEmail)
      setSuccess(`La responsabilidad del evento se transfirió a ${newOwnerEmail}.`)
      setEmail('')
      setConfirming(false)
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const connectAccount = async () => {
    setPaymentBusy(true)
    setPaymentError(null)

    try {
      const response = await fetch(`/api/events/${event.id}/payment-account/connect`, { method: 'POST' })
      const payload = (await response.json().catch(() => null)) as { data?: { authorizationUrl?: string }; error?: string } | null
      const authorizationUrl = payload?.data?.authorizationUrl
      if (!response.ok || !authorizationUrl) {
        throw new Error(payload?.error || 'No se pudo iniciar la conexión con Mercado Pago.')
      }

      window.location.assign(authorizationUrl)
    } catch (caught) {
      setPaymentError(getErrorMessage(caught))
      setPaymentBusy(false)
    }
  }

  const disconnectAccount = async () => {
    if (!window.confirm('¿Desvincular la cuenta? Los pagos nuevos de invitados quedarán pausados.')) return

    setPaymentBusy(true)
    setPaymentError(null)
    try {
      const response = await fetch(`/api/events/${event.id}/payment-account/connect`, { method: 'DELETE' })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || 'No se pudo desvincular la cuenta.')
      setConnected(false)
    } catch (caught) {
      setPaymentError(getErrorMessage(caught))
    } finally {
      setPaymentBusy(false)
    }
  }

  return (
    <Card className="bg-admin-panel">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-12 flex-none place-items-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <ShieldCheck className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Responsabilidad y cobros</p>
            <h3 className="admin-heading mt-1 text-2xl text-foreground">Cuenta responsable del evento</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Esta cuenta administra los datos y los invitados del evento. Si la fiesta cobra entradas, también puede vincular la cuenta Mercado Pago correspondiente.
            </p>
          </div>
        </div>

        <dl className="grid gap-1 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-muted-foreground">Cuenta responsable actual:</dt>
            <dd className="font-medium text-foreground">{ownerEmail}</dd>
          </div>
        </dl>

        {canTransferOwnership && (
          <>
            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
                {success}
              </p>
            )}

            {!confirming ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                  Email de la nueva cuenta responsable
                  <Input
                    className="mt-2"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="madre@gmail.com"
                    autoComplete="email"
                    disabled={busy}
                  />
                </label>
                <Button
                  type="button"
                  className="sm:mb-0.5"
                  disabled={busy || email.trim().length === 0}
                  onClick={() => {
                    setError(null)
                    setSuccess(null)
                    setConfirming(true)
                  }}
                >
                  <ArrowRightLeft className="size-4" />
                  Transferir responsabilidad
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-6 text-amber-950">
                  Vas a transferir la responsabilidad de <strong>{event.name}</strong> a <strong>{email.trim().toLowerCase()}</strong>. El cambio se aplica ahora: la cuenta no tiene que aceptarlo. Los invitados, la configuración, los colaboradores y la cuenta de Mercado Pago no se modifican.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirming(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => void submitTransfer()}>
                    {busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRightLeft className="size-4" />}
                    Confirmar transferencia inmediata
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="border-t border-border/60 pt-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 flex-none place-items-center rounded-xl bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
              <CreditCard className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cobros de invitados</p>
              <h4 className="mt-1 text-lg font-semibold text-foreground">Cuenta Mercado Pago del evento</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {connected
                  ? 'La cuenta Mercado Pago de la responsable está vinculada. Los pagos de invitados se acreditan allí; el servicio de Alista se cobra por separado.'
                  : 'Cuando el evento cobre entradas, la responsable puede vincular su cuenta Mercado Pago. El servicio de Alista se cobra por separado.'}
              </p>
            </div>
          </div>

          {connected ? (
            <>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-semibold">Cuenta Mercado Pago vinculada</p>
                <p className="mt-1">Los nuevos pagos de invitados se crearán para esta cuenta.</p>
                {formattedUpdatedAt ? <p className="mt-1 text-xs text-emerald-800">Vinculada o renovada: {formattedUpdatedAt}</p> : null}
              </div>
              {!paymentAccount.configured && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  La cuenta está vinculada y puede recibir nuevos pagos. Para modificar la vinculación o renovarla, contactá al equipo de Alista.
                </p>
              )}
            </>
          ) : !paymentAccount.configured ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              La vinculación está temporalmente no disponible. Si el evento cobra entradas, contactá al equipo de Alista para habilitarla.
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Antes de asignar importes a invitados, pedile a la responsable que vincule su cuenta Mercado Pago.
            </p>
          )}

          {paymentError && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{paymentError}</p>}

          <div className="mt-4 flex flex-wrap gap-3">
            {!connected && paymentAccount.configured && (
              <Button type="button" onClick={() => void connectAccount()} disabled={paymentBusy}>
                {paymentBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                Vincular Mercado Pago
              </Button>
            )}
            {connected && (
              <Button type="button" variant="outline" onClick={() => void disconnectAccount()} disabled={paymentBusy}>
                {paymentBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Unlink className="size-4" />}
                Desvincular cuenta
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

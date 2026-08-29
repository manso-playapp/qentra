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
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/errors'
import { formatArgentinaDateTime } from '@/lib/event-date'

type EventOwnershipCardProps = {
  event: { id: string; name: string }
  currentOwnerEmail?: string | null
  canTransferOwnership: boolean
  showPaymentAccount: boolean
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
  showPaymentAccount,
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

  const paymentStatus = connected
    ? 'Vinculada'
    : paymentAccount.configured
      ? 'Sin vincular'
      : 'No disponible'

  const canManage = canTransferOwnership || showPaymentAccount

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
    <section className="rounded-2xl border border-border/70 bg-transparent px-4 py-3 sm:px-5" aria-labelledby="event-owner-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 flex-none place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <ShieldCheck className="size-4.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 id="event-owner-heading" className="text-sm font-semibold text-foreground">Cuenta responsable del evento</h3>
            <p className="truncate text-sm text-muted-foreground">{ownerEmail}</p>
          </div>
        </div>

        {showPaymentAccount && (
          <div className="flex items-center gap-2 text-sm sm:ml-auto">
            <CreditCard className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">Mercado Pago</span>
            <span
              className={connected
                ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                : 'rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground ring-1 ring-border'}
            >
              {paymentStatus}
            </span>
          </div>
        )}
      </div>

      {canManage && (
        <details className="group mt-3 border-t border-border/60 pt-2">
          <summary className="ml-auto flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            Gestionar
            <span className="text-xs transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
          </summary>

          <div className="space-y-5 pb-2 pt-4">
            {canTransferOwnership && (
              <div>
                <h4 className="text-sm font-semibold text-foreground">Transferir responsabilidad</h4>

                {error && (
                  <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
                    {success}
                  </p>
                )}

                {!confirming ? (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
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
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm leading-6 text-amber-950">
                      Vas a transferir la responsabilidad de <strong>{event.name}</strong> a <strong>{email.trim().toLowerCase()}</strong>. El cambio se aplica ahora: la cuenta no tiene que aceptarlo. Los invitados, la configuración y los colaboradores no se modifican.{showPaymentAccount ? ' La cuenta de Mercado Pago tampoco se modifica.' : ''}
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
              </div>
            )}

            {showPaymentAccount && (
              <div className={canTransferOwnership ? 'border-t border-border/60 pt-5' : ''}>
                <h4 className="text-sm font-semibold text-foreground">Cuenta Mercado Pago</h4>

                {connected ? (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p>Los pagos nuevos de invitados se acreditarán en esta cuenta.</p>
                    {formattedUpdatedAt ? <p className="mt-1 text-xs">Vinculada o renovada: {formattedUpdatedAt}</p> : null}
                    {!paymentAccount.configured && (
                      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                        Para modificar la vinculación o renovar sus credenciales, contactá al equipo de Alista.
                      </p>
                    )}
                  </div>
                ) : !paymentAccount.configured ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    La vinculación está temporalmente no disponible. Contactá al equipo de Alista para habilitarla.
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Vinculá la cuenta que recibirá los pagos de invitados.
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
            )}
          </div>
        </details>
      )}
    </section>
  )
}

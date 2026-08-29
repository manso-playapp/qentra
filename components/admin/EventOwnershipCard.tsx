'use client'

import { useState } from 'react'
import { ArrowRightLeft, CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/errors'

type EventOwnershipCardProps = {
  event: { id: string; name: string }
  currentOwnerEmail?: string | null
}

type TransferResponse = {
  data?: {
    newOwner?: { email?: string | null }
  }
  error?: string
}

export default function EventOwnershipCard({ event, currentOwnerEmail }: EventOwnershipCardProps) {
  const [email, setEmail] = useState('')
  const [ownerEmail, setOwnerEmail] = useState(currentOwnerEmail ?? 'Cuenta interna de Alista')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  return (
    <Card className="bg-admin-panel">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-12 flex-none place-items-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <ShieldCheck className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sólo Superadmin</p>
            <h3 className="admin-heading mt-1 text-2xl text-foreground">Cuenta responsable del evento</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              La cuenta responsable administra los datos y los invitados del evento y, cuando corresponde, conecta la cuenta de Mercado Pago de la fiesta.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">Ya está resuelto</p>
          <ul className="mt-3 grid gap-2 text-sm text-sky-950 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 flex-none text-sky-600" />
              El evento tiene una cuenta responsable asignada.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 flex-none text-sky-600" />
              La cuenta puede administrarlo y trabajar con colaboradores operativos.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 flex-none text-sky-600" />
              La responsabilidad se puede transferir sin perder datos.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 flex-none text-sky-600" />
              La cuenta de Mercado Pago del evento no cambia al transferir.
            </li>
          </ul>
        </div>

        <dl className="grid gap-1 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="text-muted-foreground">Cuenta responsable actual:</dt>
            <dd className="font-medium text-foreground">{ownerEmail}</dd>
          </div>
        </dl>

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
          <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-end">
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
              Transferir evento
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
      </CardContent>
    </Card>
  )
}

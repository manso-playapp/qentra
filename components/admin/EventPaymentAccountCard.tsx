'use client'

import { useState } from 'react'
import { CreditCard, Link2, LoaderCircle, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type EventPaymentAccountCardProps = {
  eventId: string
  connected: boolean
  configured: boolean
  updatedAt?: string | null
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function EventPaymentAccountCard({
  eventId,
  connected: initialConnected,
  configured,
  updatedAt,
}: EventPaymentAccountCardProps) {
  const [connected, setConnected] = useState(initialConnected)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formattedUpdatedAt = formatUpdatedAt(updatedAt)

  const connectAccount = async () => {
    setBusy(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/payment-account/connect`, { method: 'POST' })
      const payload = (await response.json().catch(() => null)) as { data?: { authorizationUrl?: string }; error?: string } | null
      const authorizationUrl = payload?.data?.authorizationUrl
      if (!response.ok || !authorizationUrl) {
        setError(payload?.error || 'No se pudo iniciar la conexión con Mercado Pago.')
        setBusy(false)
        return
      }

      window.location.assign(authorizationUrl)
    } catch {
      setError('No se pudo iniciar la conexión con Mercado Pago.')
      setBusy(false)
    }
  }

  const disconnectAccount = async () => {
    if (!window.confirm('¿Desvincular la cuenta? Los pagos nuevos de invitados quedarán pausados.')) return

    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/events/${eventId}/payment-account/connect`, { method: 'DELETE' })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        setError(payload?.error || 'No se pudo desvincular la cuenta.')
        return
      }
      setConnected(false)
    } catch {
      setError('No se pudo desvincular la cuenta.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="bg-admin-panel">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-12 flex-none place-items-center rounded-2xl bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
            <CreditCard className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cobros de invitados</p>
            <h3 className="admin-heading mt-1 text-2xl text-foreground">Cuenta receptora</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Los aportes y entradas se acreditan en la cuenta Mercado Pago de la responsable del evento. El servicio de Alista se cobra por separado.
            </p>
          </div>
        </div>

        {!configured ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Falta configurar OAuth y el cifrado de credenciales en el entorno antes de vincular una cuenta.
          </p>
        ) : connected ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <p className="font-semibold">Cuenta Mercado Pago vinculada</p>
            <p className="mt-1">Los nuevos pagos de invitados se crearán para esta cuenta.</p>
            {formattedUpdatedAt ? <p className="mt-1 text-xs text-emerald-800">Vinculada o renovada: {formattedUpdatedAt}</p> : null}
          </div>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Antes de asignar importes a invitados, pedile a la responsable que vincule su cuenta Mercado Pago.
          </p>
        )}

        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <div className="mt-auto flex flex-wrap gap-3">
          {!connected && configured && (
            <Button type="button" onClick={() => void connectAccount()} disabled={busy}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Vincular Mercado Pago
            </Button>
          )}
          {connected && (
            <Button type="button" variant="outline" onClick={() => void disconnectAccount()} disabled={busy}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Unlink className="size-4" />}
              Desvincular cuenta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

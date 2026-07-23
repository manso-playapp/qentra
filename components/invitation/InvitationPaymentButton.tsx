'use client'

import { useState } from 'react'

export default function InvitationPaymentButton({ token, amountCents }: { token: string; amountCents: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const amount = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amountCents / 100)

  const startPayment = async () => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/invitacion/${token}/payment`, { method: 'POST' })
      const payload = (await response.json().catch(() => null)) as { data?: { checkoutUrl?: string }; error?: string } | null
      if (!response.ok || !payload?.data?.checkoutUrl) throw new Error(payload?.error || 'No se pudo iniciar el pago.')
      window.location.assign(payload.data.checkoutUrl)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar el pago.')
      setLoading(false)
    }
  }

  return <div className="mt-5"><button type="button" onClick={() => void startPayment()} disabled={loading} className="w-full rounded-full bg-[#009ee3] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#008fd0] disabled:opacity-60">{loading ? 'Abriendo Mercado Pago...' : `Pagar ${amount} con Mercado Pago`}</button>{error && <p className="mt-3 text-sm text-rose-700">{error}</p>}</div>
}

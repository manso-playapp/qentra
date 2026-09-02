'use client'

import { useState } from 'react'
import { calculateGuestPaymentAmountCents, formatGuestPaymentAmount } from '@/lib/guest-payment'

export default function InvitationPaymentButton({ token, amountCents, companionCount }: { token: string; amountCents: number; companionCount: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const totalAmountCents = calculateGuestPaymentAmountCents(amountCents, companionCount)
  const peopleCount = 1 + companionCount

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

  return (
    <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-950">
      <p className="text-sm font-semibold">El pago se calcula por persona</p>
      <p className="mt-1 text-xs leading-5 text-sky-900/75">
        {formatGuestPaymentAmount(amountCents)} por persona · {peopleCount} {peopleCount === 1 ? 'persona' : 'personas'} en total
      </p>
      <p className="mt-2 text-xs leading-5 text-sky-900/75">
        Si modificás los acompañantes, el total se actualiza antes de pagar.
      </p>
      <button type="button" onClick={() => void startPayment()} disabled={loading} className="mt-4 w-full rounded-full bg-[#009ee3] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#008fd0] disabled:opacity-60">
        {loading ? 'Abriendo Mercado Pago...' : `Pagar ${formatGuestPaymentAmount(totalAmountCents)} con Mercado Pago`}
      </button>
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
    </div>
  )
}

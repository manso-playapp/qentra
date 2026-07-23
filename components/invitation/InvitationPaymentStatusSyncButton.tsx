'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InvitationPaymentStatusSyncButton({ token }: { token: string }) {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function syncPayment() {
    setIsSyncing(true)
    setError(null)

    try {
      const response = await fetch(`/api/invitacion/${encodeURIComponent(token)}/payment/sync`, {
        method: 'POST',
      })
      const result = (await response.json().catch(() => null)) as { error?: string; status?: string } | null
      if (!response.ok) throw new Error(result?.error || 'No se pudo verificar el pago.')

      router.refresh()
      if (result?.status !== 'approved') {
        setError('El pago todavía figura pendiente en Mercado Pago. Intentá nuevamente en unos instantes.')
      }
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'No se pudo verificar el pago.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={syncPayment}
        disabled={isSyncing}
        className="w-full rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white/45 disabled:cursor-wait disabled:opacity-65"
      >
        {isSyncing ? 'Verificando pago…' : 'Ya pagué · Verificar pago'}
      </button>
      {error && <p className="mt-2 text-center text-xs font-medium text-amber-800">{error}</p>}
    </div>
  )
}

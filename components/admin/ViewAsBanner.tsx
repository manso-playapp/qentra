'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, LoaderCircle } from 'lucide-react'

type ViewAsBannerProps = {
  targetEmail: string | null
  realEmail: string | null
}

/**
 * Mirar el panel con los ojos de otra cuenta no puede ser un estado silencioso:
 * la barra queda fija arriba de todo mientras dure.
 */
export default function ViewAsBanner({ targetEmail, realEmail }: ViewAsBannerProps) {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  const leave = async () => {
    setLeaving(true)
    await fetch('/api/admin/view-as', { method: 'DELETE' }).catch(() => null)
    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-sm text-amber-950">
      <Eye className="size-4" strokeWidth={2} />
      <span>
        Estás viendo Alista como <strong>{targetEmail ?? 'otra cuenta'}</strong>
        {realEmail ? <span className="text-amber-900/70"> · tu sesión es {realEmail}</span> : null}
      </span>
      <button
        type="button"
        onClick={() => void leave()}
        disabled={leaving}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {leaving ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
        Volver a mi cuenta
      </button>
    </div>
  )
}

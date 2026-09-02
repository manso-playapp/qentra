'use client'

import { useEffect } from 'react'

/**
 * Señal técnica de visita. No afirma entrega ni lectura y no captura IP,
 * dispositivo ni datos de identidad. El endpoint es idempotente por token.
 */
export default function InvitationVisitTracker({ token }: { token: string }) {
  useEffect(() => {
    void fetch(`/api/invitacion/${encodeURIComponent(token)}/view`, {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {
      // El seguimiento es auxiliar: nunca debe interrumpir la invitación.
    })
  }, [token])

  return null
}

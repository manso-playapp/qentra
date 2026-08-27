'use client'

import { useEffect, useState } from 'react'
import { getEventStartInstant } from '@/lib/event-date'

type InvitationCountdownProps = {
  eventDate: string
  startTime?: string | null
}

type Remaining = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getRemaining(targetMs: number): Remaining | null {
  const diff = targetMs - Date.now()
  if (diff <= 0) return null

  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

// Se calcula solo en el cliente: el instante objetivo se compara contra el
// reloj del invitado, y renderizarlo en el server produciria un mismatch de
// hidratacion (el server y el cliente casi nunca comparten el mismo segundo).
export default function InvitationCountdown({ eventDate, startTime }: InvitationCountdownProps) {
  const [remaining, setRemaining] = useState<Remaining | null | undefined>(undefined)
  const targetMs = getEventStartInstant(eventDate, startTime)

  useEffect(() => {
    if (targetMs === null) {
      return
    }

    // Defer the first browser-only tick so hydration stays deterministic.
    const firstTick = window.setTimeout(() => setRemaining(getRemaining(targetMs)), 0)
    const interval = setInterval(() => setRemaining(getRemaining(targetMs)), 1000)
    return () => {
      window.clearTimeout(firstTick)
      clearInterval(interval)
    }
  }, [targetMs])

  // undefined = todavia no hidrato en el cliente; null = fecha invalida o el
  // evento ya empezo. En ambos casos no mostramos el widget.
  if (targetMs === null || !remaining) return null

  const units: Array<[number, string]> = [
    [remaining.days, 'días'],
    [remaining.hours, 'hs'],
    [remaining.minutes, 'min'],
  ]

  return (
    <div className="flex items-start justify-center gap-0" aria-label="Cuenta regresiva para el evento">
      {units.map(([value, label]) => (
        <div key={label} className="invitation-countdown-unit relative flex flex-col items-center px-6 sm:px-10">
          <span className="invitation-countdown-value text-5xl font-extralight tabular-nums text-(--invitation-accent) sm:text-6xl">{String(value).padStart(2, '0')}</span>
          <span className="invitation-subtitle mt-4">{label}</span>
        </div>
      ))}
    </div>
  )
}

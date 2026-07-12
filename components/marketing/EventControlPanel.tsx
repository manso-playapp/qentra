import { CheckCircle2, Clock, Users } from 'lucide-react'

/**
 * Visual del hero: no vendemos "el viaje del invitado", sino la gestion seria de
 * la apertura. Este panel muestra lo que ve el organizador: cupo en tiempo real,
 * pago vinculado a cada persona y acceso habilitado, con la puerta resolviendo.
 */
export function EventControlPanel() {
  const cupoTomado = 184
  const cupoTotal = 220
  const porcentaje = Math.round((cupoTomado / cupoTotal) * 100)

  const guests = [
    {
      initials: 'SG',
      name: 'Sofía Giménez',
      detail: '+1 acompañante',
      state: 'Pago confirmado',
      tone: 'ok' as const,
    },
    {
      initials: 'ML',
      name: 'Mateo Ledesma',
      detail: 'Invitado nominado',
      state: 'Pendiente de revisión',
      tone: 'wait' as const,
    },
  ]

  return (
    <div className="relative rounded-[2rem] border border-border/70 bg-card p-6 shadow-[0_28px_80px_rgba(22,33,90,0.14)] sm:p-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Cupo en tiempo real
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
          En vivo
        </span>
      </div>

      {/* Cupo: el numero que el organizador mira toda la noche. */}
      <div className="mt-5 rounded-2xl bg-secondary/50 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-3xl font-semibold text-foreground">
              {cupoTomado}
              <span className="text-lg text-muted-foreground"> / {cupoTotal}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Confirmados con pago vinculado</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border/70">
            <Users className="size-3.5 text-primary" strokeWidth={2} />
            {cupoTotal - cupoTomado} de cupo
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-brand-cyan"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {/* Persona + pago + acceso: la relacion que Alista mantiene verificable. */}
      <ul className="mt-4 space-y-3">
        {guests.map((guest) => (
          <li
            key={guest.name}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-event-surface text-xs font-semibold text-primary ring-1 ring-primary/15">
              {guest.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{guest.name}</p>
              <p className="truncate text-xs text-muted-foreground">{guest.detail}</p>
            </div>
            <span
              className={
                guest.tone === 'ok'
                  ? 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800'
                  : 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800'
              }
            >
              {guest.tone === 'ok' ? (
                <CheckCircle2 className="size-3.5" strokeWidth={2} />
              ) : (
                <Clock className="size-3.5" strokeWidth={2} />
              )}
              {guest.state}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-admin-navy px-4 py-3 text-white">
        <span className="text-sm font-medium">Acceso válido · cuenta en el cupo</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
          En la puerta
        </span>
      </div>
    </div>
  )
}

import { Mail, CircleCheck, ClipboardCheck, DoorOpen } from 'lucide-react'

const STEPS = [
  {
    icon: Mail,
    label: 'Invitación',
    note: 'Se reconoce quién invita.',
  },
  {
    icon: CircleCheck,
    label: 'Confirmación',
    note: 'Confirma y aporta lo justo.',
  },
  {
    icon: ClipboardCheck,
    label: 'Preparación',
    note: 'El equipo llega con todo listo.',
  },
  {
    icon: DoorOpen,
    label: 'Llegada',
    note: 'Ingresa sin fricción.',
  },
]

/**
 * Visual del hero: la secuencia conectada que el brief pide mostrar
 * (Invitación → Confirmación → Preparación → Llegada), en lugar de un
 * dashboard genérico sin significado.
 */
export function ArrivalSequence() {
  return (
    <div className="relative rounded-[2rem] border border-border/70 bg-card p-6 shadow-[0_28px_80px_rgba(22,33,90,0.14)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        El recorrido de cada invitado
      </p>

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isLast = index === STEPS.length - 1
          return (
            <li key={step.label} className="relative flex gap-4">
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-[1.375rem] top-12 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-primary/40 to-primary/10"
                />
              )}
              <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-2xl bg-event-surface text-primary ring-1 ring-primary/15">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="flex flex-1 items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
                <div>
                  <p className="font-medium leading-tight text-foreground">{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.note}</p>
                </div>
                <span className="font-display text-sm text-muted-foreground/70">
                  0{index + 1}
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-admin-navy px-4 py-3 text-white">
        <span className="text-sm font-medium">Todo preparado antes de que lleguen</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
          Sin improvisar
        </span>
      </div>
    </div>
  )
}

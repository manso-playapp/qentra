import { CalendarDays, Check, ChevronRight, Layers3, Users } from 'lucide-react'

const events = [
  {
    name: 'Emilia',
    day: '14',
    month: 'SEP',
    state: 'Preparando invitados',
    tone: 'bg-[#ffcfbf] text-[#7d2f20]',
  },
  {
    name: 'Juana',
    day: '05',
    month: 'OCT',
    state: 'Personalizando invitación',
    tone: 'bg-[#d9ee73] text-[#173b36]',
  },
  {
    name: 'Martina',
    day: '19',
    month: 'OCT',
    state: 'Recepción lista',
    tone: 'bg-[#dce5ff] text-[#213480]',
  },
] as const

const roles = ['Coordinación', 'Invitaciones', 'Recepción'] as const

export function ProfessionalWorkspacePreview() {
  return (
    <div className="overflow-hidden rounded-[2.5rem] bg-[#f0eee8] text-[#171714] shadow-[0_35px_90px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/42">Espacio profesional · escenario demo</p>
          <p className="marketing-display mt-2 text-3xl font-black tracking-[-0.01em]">Temporada de 15</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#173b36] px-4 py-2 text-xs font-bold text-white">
          <CalendarDays className="size-4" aria-hidden="true" />
          Próximos eventos
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border-b border-black/10 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-black/42">Tus eventos</p>
            <span className="text-xs font-bold text-black/40">Una sola vista</span>
          </div>
          <div className="mt-5 space-y-2">
            {events.map((event) => (
              <div key={event.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-black/10 bg-white/65 p-3 sm:p-4">
                <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#213480] text-center text-white">
                  <span className="marketing-display text-xl font-black leading-none tracking-[-0.01em]">{event.day}</span>
                  <span className="mt-1 text-[9px] font-black leading-none tracking-[0.14em] text-white/65">{event.month}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">15 de {event.name}</span>
                  <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${event.tone}`}>
                    {event.state}
                  </span>
                </span>
                <ChevronRight className="size-4 text-black/28" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-7">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-black/42">
            <Layers3 className="size-4 text-[#c65035]" aria-hidden="true" />
            Base reutilizable
          </p>
          <div className="mt-5 rounded-2xl bg-[#171714] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Plantilla del evento</p>
            <p className="marketing-display mt-2 text-3xl font-black tracking-[-0.01em]">Cena + trasnoche</p>
            <ul className="mt-5 space-y-3">
              {['Invitación y confirmación', 'Tipos de acceso', 'Equipo de recepción'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-xs font-bold text-white/65">
                  <span className="grid size-5 place-items-center rounded-full bg-[#d9ee73] text-[#171714]">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-black/10 bg-white/55 p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-black/40">
              <Users className="size-4 text-[#213480]" aria-hidden="true" />
              Equipo
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span key={role} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[10px] font-bold">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

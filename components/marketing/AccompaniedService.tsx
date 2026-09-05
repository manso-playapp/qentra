import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const DELIVERABLES = [
  ['Su estilo', 'Definimos la identidad de la invitación con ustedes. Presentamos una propuesta visual y acordamos las revisiones antes de compartirla.'],
  ['La lista preparada', 'Configuramos accesos, acompañantes y, si hay entrada paga, la cuenta receptora de la responsable. Revisamos los pendientes con la familia.'],
  ['Cada una invita', 'Madre e hija comparten las invitaciones desde sus propios WhatsApp. Cada una conserva sus contactos y las respuestas se reúnen en el evento.'],
  ['Recepción ensayada', 'Capacitamos al equipo de la organización con los celulares que va a usar. Dejamos acordados el referente, las excepciones y la ventana de soporte.'],
] as const

export function AccompaniedService() {
  return (
    <section id="acompanamiento" className="scroll-mt-16 bg-[#213480] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-14">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9ee73]">Personalización y acompañamiento</p>
          <div>
            <h2 className="marketing-display text-[clamp(3rem,5.5vw,5.5rem)] font-black leading-[0.9] tracking-[-0.01em]">Ella imagina su fiesta. Ustedes deciden. Alista prepara.</h2>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/75">Cuando sus amigos piden llevar acompañantes al trasnoche, cambian la bebida, la mesa dulce y los lugares disponibles. Acordamos quién puede venir y preparamos invitaciones, nombres y pagos para que esas decisiones no queden para la puerta.</p>
          </div>
        </div>
        <ol className="mt-14 grid gap-5 sm:grid-cols-2">
          {DELIVERABLES.map(([title, detail], index) => (
            <li key={title} className="rounded-[2rem] border border-white/20 p-6 sm:p-8">
              <p className="text-xs font-black text-[#d9ee73]">0{index + 1}</p>
              <h3 className="marketing-display mt-5 text-3xl font-black">{title}</h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">{detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col justify-between gap-6 border-t border-white/20 pt-8 lg:flex-row lg:items-center">
          <p className="max-w-2xl text-sm leading-6 text-white/75">Presupuesto por evento, con entregas y horarios acordados. La responsable conserva su cuenta y su evento. El personal de recepción lo aporta la organización; el recibidor digital y el alquiler de equipos se cotizan como adicionales.</p>
          <Link href="/demo" className="inline-flex min-h-13 shrink-0 items-center justify-center gap-4 rounded-full bg-[#d9ee73] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Consultar para mi fecha <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  )
}

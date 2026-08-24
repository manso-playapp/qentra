import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ClosingCta, PageHero } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Cómo contratar Alista',
  description:
    'Conocé cómo armamos una propuesta para tu fiesta de 15, salón, productora o equipo de planificación.',
  path: '/precios',
})

const PATHS = [
  {
    eyebrow: 'Para una familia',
    title: 'Alista en tus 15.',
    body: 'Primero vemos cómo sería el recorrido de tu fiesta: invitación, confirmaciones, grupos, preparación y llegada. La demo no crea un evento ni inicia un pago.',
    detail: 'La propuesta se conversa después de entender la fecha, el lugar y el alcance.',
    href: '/demo',
    cta: 'Pedir una demo para mis 15',
    tone: 'bg-[#d9ee73] text-[#171714]',
  },
  {
    eyebrow: 'Para profesionales',
    title: 'Alista en tu servicio.',
    body: 'Para planners, salones y productoras que organizan varios eventos y necesitan una operación repetible, un equipo coordinado y una experiencia con identidad.',
    detail: 'Las condiciones se definen según el volumen y la forma de trabajo del equipo.',
    href: '/profesionales#contacto-profesional',
    cta: 'Conversar sobre mi operación',
    tone: 'bg-[#213480] text-white',
  },
]

const VARIABLES = [
  ['01', 'Tipo de operación', 'Una familia y un equipo que abre eventos todas las semanas necesitan recorridos distintos.'],
  ['02', 'Volumen de eventos', 'La cantidad y frecuencia permiten definir acompañamiento, configuración y continuidad.'],
  ['03', 'Alcance del servicio', 'Revisamos qué momentos del recorrido necesita resolver cada fiesta o profesional.'],
  ['04', 'Puesta en marcha', 'Acordamos cómo preparar al equipo y llegar al primer evento con criterios claros.'],
]

export default function PreciosPage() {
  return (
    <>
      <PageHero
        eyebrow="Cómo contratar Alista"
        title="Primero entendemos la fiesta."
        highlight="Después armamos la propuesta."
        description="Alista está en una etapa de implementación acompañada. Por eso no publicamos importes ni paquetes genéricos que todavía no representan una oferta comercial cerrada."
        primaryCta={{ href: '/demo', label: 'Quiero verlo para mis 15' }}
        secondaryCta={{ href: '/profesionales', label: 'Trabajo con eventos' }}
      />

      <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-5 lg:grid-cols-2">
            {PATHS.map((path) => (
              <article key={path.title} className={`flex min-h-[420px] flex-col justify-between rounded-[2.25rem] p-7 sm:p-10 ${path.tone}`}>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] opacity-55">{path.eyebrow}</p>
                  <h2 className="marketing-display mt-6 max-w-lg text-[clamp(2.5rem,4vw,4rem)] font-black leading-[0.92] tracking-[-0.005em]">
                    {path.title}
                  </h2>
                  <p className="mt-7 max-w-xl text-base leading-7 opacity-65">{path.body}</p>
                </div>
                <div className="mt-12 border-t border-current/15 pt-6">
                  <p className="max-w-lg text-sm font-bold leading-6 opacity-70">{path.detail}</p>
                  <Link
                    href={path.href}
                    className="mt-6 inline-flex min-h-12 items-center gap-4 rounded-full border border-current/25 px-5 text-sm font-black transition hover:bg-white hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                  >
                    {path.cta}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#162c29] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9ee73]">Una propuesta con contexto</p>
            <h2 className="marketing-display mt-5 text-[clamp(2.6rem,4.25vw,4.25rem)] font-black leading-[0.92] tracking-[-0.005em]">
              Qué necesitamos entender.
            </h2>
          </div>
          <ol className="divide-y divide-white/14 border-y border-white/14">
            {VARIABLES.map(([number, title, body]) => (
              <li key={number} className="grid gap-4 py-6 sm:grid-cols-[3rem_0.65fr_1.35fr] sm:items-start">
                <span className="marketing-display text-2xl font-black text-[#d9ee73]">{number}</span>
                <h3 className="text-sm font-black">{title}</h3>
                <p className="text-sm leading-6 text-white/58">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ClosingCta
        title="La conversación empieza por tu fiesta."
        description="Te mostramos el recorrido, entendemos qué necesitás y recién entonces definimos una propuesta clara."
        primary={{ href: '/demo', label: 'Pedir una demo' }}
        secondary={{ href: '/contacto', label: 'Hacer una consulta' }}
      />
    </>
  )
}

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { FaqSection } from '@/components/marketing/FaqSection'
import { ClosingCta, PageHero } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Cómo funciona Alista para una fiesta de 15',
  description:
    'Recorré cómo Alista conecta invitación, confirmaciones, grupos, preparación, aportes y llegada.',
  path: '/como-funciona',
})

const STEPS = [
  {
    number: '01',
    name: 'Invitá',
    title: 'Una invitación que se reconoce.',
    body: 'Alista prepara el link personal y el mensaje. La invitación sale desde el WhatsApp de alguien conocido, sin pedir que el invitado instale una app.',
  },
  {
    number: '02',
    name: 'Confirmá',
    title: 'Cada respuesta conserva su contexto.',
    body: 'La persona confirma, suma acompañantes y completa lo necesario en pocos pasos. El grupo queda unido desde el comienzo.',
  },
  {
    number: '03',
    name: 'Conocé',
    title: 'Preparar también es conocer.',
    body: 'Restricciones, necesidades y respuestas llegan organizadas para que la fiesta pueda anticiparse sin preguntar lo mismo varias veces.',
  },
  {
    number: '04',
    name: 'Prepará',
    title: 'Los pendientes se vuelven acciones.',
    body: 'La familia y el equipo pueden ver qué falta, qué cambió y qué necesita atención antes de que la recepción tenga que resolverlo.',
  },
  {
    number: '05',
    name: 'Cobrá',
    title: 'El aporte no queda separado de la persona.',
    body: 'Cuando la fiesta incluye un aporte, Alista está diseñado para conservar ese vínculo. Durante los pilotos, la conciliación es acompañada.',
  },
  {
    number: '06',
    name: 'Recibí',
    title: 'La llegada ya tiene una historia.',
    body: 'Recepción busca, valida y entiende el grupo con información preparada. Llegan juntos y pueden entrar juntos.',
  },
]

export default function ComoFuncionaPage() {
  return (
    <>
      <PageHero
        eyebrow="Cómo funciona"
        title="Todo lo que pasa antes,"
        highlight="conectado."
        description="Alista convierte una serie de mensajes, respuestas y decisiones sueltas en un recorrido que llega preparado hasta la puerta."
        primaryCta={{ href: '/demo', label: 'Ver una demo' }}
        secondaryCta={{ href: '/producto', label: 'Conocer el producto' }}
      />

      <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <ol className="mx-auto max-w-[1180px] border-t border-black/15">
          {STEPS.map((step, index) => (
            <li
              key={step.number}
              className="grid gap-5 border-b border-black/15 py-9 sm:grid-cols-[4rem_0.5fr_1fr] sm:items-start lg:grid-cols-[5rem_0.55fr_0.9fr_1.2fr]"
            >
              <span className="marketing-display text-3xl font-black text-[#9c3926]">{step.number}</span>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-black/60">{step.name}</p>
              <h2 className="marketing-display text-3xl font-black leading-[0.96] tracking-[-0.005em] text-[#171714] sm:text-4xl">
                {step.title}
              </h2>
              <p className="text-sm leading-6 text-black/58 sm:col-start-3 lg:col-start-auto">{step.body}</p>
              {index < STEPS.length - 1 ? null : (
                <span className="sr-only">Fin del recorrido</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[#d9ee73] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-black/60">Dos formas de empezar</p>
            <h2 className="marketing-display mt-5 max-w-3xl text-[clamp(2.7rem,4.5vw,4.5rem)] font-black leading-[0.92] tracking-[-0.005em]">
              La experiencia cambia. La base se mantiene.
            </h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/demo"
              className="flex min-h-16 items-center justify-between gap-5 rounded-full border border-black/20 px-6 text-sm font-black transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Estoy organizando mis 15
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/profesionales"
              className="flex min-h-16 items-center justify-between gap-5 rounded-full bg-[#171714] px-6 text-sm font-black text-white transition hover:bg-[#213480] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Organizo fiestas profesionalmente
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <FaqSection />

      <ClosingCta
        title="La puerta se prepara mucho antes."
        description="Mostranos cómo organizás hoy tu fiesta y te enseñamos dónde Alista puede ordenar el recorrido."
      />
    </>
  )
}

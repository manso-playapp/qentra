import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { FaqSection } from '@/components/marketing/FaqSection'
import { ClosingCta, PageHero } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Cómo funciona Alista para una fiesta de 15',
  description:
    'Así preparamos tus 15: propuesta, diseño, invitaciones personales, revisión de invitados y pagos, y ensayo con recepción.',
  path: '/como-funciona',
})

const STEPS = [
  {
    number: '01',
    name: 'Conversemos',
    title: 'Empezamos por su fiesta.',
    body: 'Nos cuentan la fecha, el lugar, cuántas personas esperan y cómo imaginan los 15. Si habrá trasnoche con entrada paga, vemos qué acompañantes podrán sumarse y qué necesita delegar la responsable.',
  },
  {
    number: '02',
    name: 'Acordemos',
    title: 'Una propuesta que se puede revisar.',
    body: 'Confirmamos disponibilidad y presentamos el alcance: diseño, configuración, encuentros de seguimiento, capacitación y ventana de soporte. Revisiones, equipos y adicionales quedan definidos antes de contratar.',
  },
  {
    number: '03',
    name: 'Diseñemos',
    title: 'La invitación empieza a parecerse a ella.',
    body: 'Trabajamos una propuesta visual a partir de sus ideas y la identidad de la fiesta. La revisan en el celular y acordamos los ajustes incluidos hasta dejarla lista para compartir.',
  },
  {
    number: '04',
    name: 'Inviten',
    title: 'Cada una, desde sus contactos.',
    body: 'Madre e hija comparten las invitaciones desde sus propios WhatsApp. Alista prepara el mensaje y el link personal; cada una confirma el envío. Las respuestas quedan reunidas en la lista del evento.',
  },
  {
    number: '05',
    name: 'Revisemos',
    title: 'El trasnoche también se prepara.',
    body: 'Revisamos confirmaciones, nombres de acompañantes y pagos pendientes. La familia define a quién invita y cuántos lugares habilita. En accesos pagos, el importe corresponde al titular y a cada acompañante completado con nombre; el cobro va a la cuenta de Mercado Pago de la responsable.',
  },
  {
    number: '06',
    name: 'Ensayemos',
    title: 'La recepción prueba antes de abrir.',
    body: 'La organización aporta el personal y designa un referente. Probamos búsqueda y escaneo con los celulares asignados, revisamos la conexión y acordamos cómo resolver consultas. El soporte de Alista queda disponible en la ventana contratada.',
  },
]

export default function ComoFuncionaPage() {
  return (
    <>
      <PageHero
        eyebrow="Cómo los acompañamos"
        title="Una fiesta propia."
        highlight="Un paso a la vez."
        description="Desde la primera conversación hasta el ensayo de recepción, cada etapa deja algo preparado. Ustedes saben qué decidir, qué vamos a resolver y cuándo volvemos a revisarlo juntos."
        primaryCta={{ href: '/demo', label: 'Consultar disponibilidad' }}
        secondaryCta={{ href: '/producto', label: 'Qué incluye el acompañamiento' }}
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
            <p className="text-xs font-black uppercase tracking-[0.22em] text-black/60">Antes de esa noche</p>
            <h2 className="marketing-display mt-5 max-w-3xl text-[clamp(2.7rem,4.5vw,4.5rem)] font-black leading-[0.92] tracking-[-0.005em]">
              Que cada tarea tenga a alguien a cargo.
            </h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/demo"
              className="flex min-h-16 items-center justify-between gap-5 rounded-full bg-[#171714] px-6 text-sm font-black text-white transition hover:bg-[#213480] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Consultar diseño y acompañamiento
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/autogestion"
              className="flex min-h-16 items-center justify-between gap-5 rounded-full border border-black/20 px-6 text-sm font-black transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Conocer la opción autogestiva
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <FaqSection />

      <ClosingCta
        title="Empecemos por la fecha de sus 15."
        description="Contanos dónde será la fiesta y qué quieren delegar. Revisamos disponibilidad y les mostramos una propuesta con tareas, tiempos y responsabilidades."
        primary={{ href: '/demo', label: 'Consultar disponibilidad' }}
        secondary={{ href: '/precios', label: 'Cómo contratar' }}
      />
    </>
  )
}

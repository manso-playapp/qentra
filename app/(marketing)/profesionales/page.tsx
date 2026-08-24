import Link from 'next/link'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  Check,
  Layers3,
  Palette,
  RefreshCcw,
  Users,
} from 'lucide-react'
import { ContactForm } from '@/components/marketing/ContactForm'
import { PreparationCenterDemo } from '@/components/marketing/PreparationCenterDemo'
import { ProfessionalWorkspacePreview } from '@/components/marketing/ProfessionalWorkspacePreview'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Alista para planners, salones y productoras',
  description:
    'Gestioná invitados, confirmaciones, entradas y accesos de todos tus 15 desde una misma plataforma.',
  path: '/profesionales',
})

const capabilities = [
  {
    icon: CalendarRange,
    title: 'Múltiples eventos',
    detail: 'Una vista para saber qué se está preparando, qué necesita atención y qué ya está listo.',
    tone: 'bg-[#213480] text-white',
  },
  {
    icon: Layers3,
    title: 'Plantillas que vuelven a servir',
    detail: 'Reutilizá tipos de acceso, recorridos y configuraciones sin empezar cada fiesta desde cero.',
    tone: 'bg-[#ffcfbf] text-[#171714]',
  },
  {
    icon: Users,
    title: 'Un equipo, distintas tareas',
    detail: 'Coordinación, invitaciones y recepción ven lo que necesitan para hacer bien su parte.',
    tone: 'bg-[#d9ee73] text-[#171714]',
  },
  {
    icon: Palette,
    title: 'Cada 15 conserva su identidad',
    detail: 'El sistema se repite. La invitación, el contenido y la atmósfera cambian con cada cliente.',
    tone: 'bg-[#c65035] text-white',
  },
] as const

export default function ProfessionalsPage() {
  return (
    <div className="overflow-clip bg-[#f0eee8] text-[#171714]">
      <section className="relative overflow-hidden bg-[#213480] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-14 lg:py-32">
        <div className="absolute -right-28 -top-36 size-[30rem] rounded-full bg-[#ff8b70]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-48 left-1/4 size-[32rem] rounded-full bg-[#009cdd]/20 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9ee73]">Alista para profesionales</p>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/68">
                Para planners, salones y productoras que quieren sumar una experiencia mejor preparada a su propio servicio.
              </p>
            </div>
            <div>
              <h1 className="marketing-display text-[clamp(3.1rem,6.4vw,6.4rem)] font-black leading-[0.88] tracking-[-0.01em]">
                Hacé que cada fiesta llegue mejor preparada.
              </h1>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#contacto-profesional"
                  className="inline-flex min-h-13 items-center justify-between gap-6 rounded-full bg-[#d9ee73] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Quiero ofrecer Alista
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="#como-se-incorpora"
                  className="inline-flex min-h-13 items-center justify-between gap-6 rounded-full border border-white/22 px-6 text-sm font-black text-white transition hover:bg-white hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Ver cómo funciona
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16 lg:mt-20">
            <ProfessionalWorkspacePreview />
          </div>
        </div>
      </section>

      <section id="como-se-incorpora" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/42">Un sistema que se reutiliza</p>
            <h2 className="marketing-display text-[clamp(3rem,5.25vw,5.6rem)] font-black leading-[0.9] tracking-[-0.01em]">
              Tu proceso mejora. Cada fiesta sigue siendo única.
            </h2>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon

              return (
                <article key={capability.title} className={`${capability.tone} min-h-80 rounded-[2.25rem] p-6 sm:p-8`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-2xl bg-current/10 ring-1 ring-current/15">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="marketing-display text-2xl font-black opacity-35">0{index + 1}</span>
                  </div>
                  <h3 className="marketing-display mt-16 text-3xl font-black leading-[1.02] tracking-[-0.01em]">{capability.title}</h3>
                  <p className="mt-5 max-w-md text-sm leading-6 opacity-65">{capability.detail}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#ff8b70] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/45">Una promesa para tus clientes</p>
            <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6vw,6.4rem)] font-black leading-[0.88] tracking-[-0.01em]">
              “Todos nuestros 15 incluyen Alista.”
            </h2>
          </div>
          <div>
            <p className="text-base font-bold leading-7 text-black/72">
              No es una licencia aislada: es una forma de elevar tu servicio desde la invitación hasta la recepción.
            </p>
            <ul className="mt-7 space-y-3">
              {['Tu marca acompaña la experiencia.', 'Tu equipo trabaja con un mismo criterio.', 'La familia entiende qué sigue.'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-bold">
                  <span className="grid size-6 place-items-center rounded-full bg-[#171714] text-white">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#162c29] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9ee73]">Producto en acción</p>
              <h2 className="marketing-display mt-5 text-[clamp(3rem,5.25vw,5.6rem)] font-black leading-[0.9] tracking-[-0.01em]">
                Lo que falta se vuelve trabajo concreto.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              El Centro de Preparación ayuda a tu equipo a priorizar confirmaciones, pagos, grupos, restricciones y recepción en cada evento.
            </p>
          </div>
          <div className="mt-14">
            <PreparationCenterDemo />
          </div>
        </div>
      </section>

      <section id="contacto-profesional" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c65035]">Conversemos</p>
            <h2 className="marketing-display mt-5 text-[clamp(3rem,4.5vw,4.9rem)] font-black leading-[0.92] tracking-[-0.01em]">
              Veamos cómo sumarlo a tu servicio.
            </h2>
            <p className="mt-7 max-w-md text-base leading-7 text-black/55">
              Contanos cuántos eventos organizás y cómo trabaja hoy tu equipo. La conversación empieza por tu operación, no por un plan genérico.
            </p>
            <p className="mt-8 flex items-center gap-3 text-sm font-bold text-[#213480]">
              <RefreshCcw className="size-4" aria-hidden="true" />
              Condiciones comerciales por volumen, a conversar.
            </p>
          </div>
          <ContactForm
            subject="Consulta profesional — Alista"
            cta="Preparar consulta profesional"
            source="profesionales-page"
            audience="professional"
          />
        </div>
      </section>

      <section className="bg-[#213480] px-5 py-20 text-white sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="marketing-display max-w-2xl text-4xl font-black leading-none tracking-[-0.01em] sm:text-5xl">
            Cada fiesta con identidad. Todas mejor preparadas.
          </p>
          <Link
            href="/#dharma"
            className="inline-flex min-h-12 items-center justify-between gap-5 rounded-full border border-white/22 px-5 text-sm font-black transition hover:bg-white hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Ver el caso Dharma
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}

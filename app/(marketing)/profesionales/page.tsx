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
import { TrackedLink } from '@/components/marketing/TrackedLink'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Alista junto a planners, salones y productoras',
  description:
    'Recomendá diseño y acompañamiento para los 15 de tus clientes. La familia contrata Alista y tu equipo colabora en la preparación y la recepción.',
  path: '/profesionales',
})

const capabilities = [
  {
    icon: CalendarRange,
    title: 'Una recomendación con contexto',
    detail: 'Presentanos a las familias que quieren delegar diseño y organización de invitados, especialmente cuando el trasnoche suma acompañantes y pagos.',
    tone: 'bg-[#213480] text-white',
  },
  {
    icon: Layers3,
    title: 'Reglas acordadas con la familia',
    detail: 'Quiénes están invitados, cuántos acompañantes pueden llevar, qué acceso tiene cada grupo y quién decide una excepción: lo trabajamos antes de abrir la puerta.',
    tone: 'bg-[#ffcfbf] text-[#171714]',
  },
  {
    icon: Users,
    title: 'Recepción con un referente',
    detail: 'La familia, el salón o la productora aporta el personal. Acordamos el referente, los celulares y la conexión; Alista configura y capacita según la propuesta.',
    tone: 'bg-[#d9ee73] text-[#171714]',
  },
  {
    icon: Palette,
    title: 'Diseño pensado para sus 15',
    detail: 'Trabajamos la invitación con la identidad de la fiesta y la mirada de la quinceañera. La propuesta y sus revisiones quedan acordadas con la familia.',
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
                Hay familias que quieren delegar la invitación, la lista y los pendientes del trasnoche. Podés acercarles Alista y colaborar en una preparación que también ayude a tu equipo.
              </p>
            </div>
            <div>
              <h1 className="marketing-display text-[clamp(3.1rem,6.4vw,6.4rem)] font-black leading-[0.88] tracking-[-0.01em]">
                Preparemos juntos los 15 de tus clientes.
              </h1>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="#contacto-profesional"
                  analytics={{
                    name: 'cta_clicked',
                    properties: { placement: 'professionals_hero', audience: 'professional', destination: 'page_section' },
                  }}
                  className="inline-flex min-h-13 items-center justify-between gap-6 rounded-full bg-[#d9ee73] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Conversar sobre una colaboración
                  <ArrowDown className="size-4" aria-hidden="true" />
                </TrackedLink>
                <TrackedLink
                  href="#como-se-incorpora"
                  analytics={{
                    name: 'cta_clicked',
                    properties: { placement: 'professionals_hero', audience: 'professional', destination: 'page_section' },
                  }}
                  className="inline-flex min-h-13 items-center justify-between gap-6 rounded-full border border-white/22 px-6 text-sm font-black text-white transition hover:bg-white hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Conocer nuestra forma de trabajo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </TrackedLink>
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
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/60">Tu lugar en la preparación</p>
            <h2 className="marketing-display text-[clamp(3rem,5.25vw,5.6rem)] font-black leading-[0.9] tracking-[-0.01em]">
              Vos conocés la fiesta. Acordemos cómo acompañarla.
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
                    <span className="marketing-display text-2xl font-black">0{index + 1}</span>
                  </div>
                  <h3 className="marketing-display mt-16 text-3xl font-black leading-[1.02] tracking-[-0.01em]">{capability.title}</h3>
                  <p className="mt-5 max-w-md text-sm leading-6">{capability.detail}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#ff8b70] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#171714]">Quién contrata y quién colabora</p>
            <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6vw,6.4rem)] font-black leading-[0.88] tracking-[-0.01em]">
              La responsable decide. El equipo trabaja con ella.
            </h2>
          </div>
          <div>
            <p className="text-base font-bold leading-7 text-black/72">
              La responsable contrata Alista y conserva la propiedad de su evento. Puede incorporar al planner como colaborador. Si hay entradas pagas, los cobros se reciben en su cuenta de Mercado Pago, con las condiciones de esa cuenta.
            </p>
            <ul className="mt-7 space-y-3">
              {['Alcance y soporte definidos por evento.', 'Personal de recepción de la organización.', 'Equipos y recibidor cotizados por separado.'].map((item) => (
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
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9ee73]">Una conversación sobre pendientes</p>
              <h2 className="marketing-display mt-5 text-[clamp(3rem,5.25vw,5.6rem)] font-black leading-[0.9] tracking-[-0.01em]">
                Saber qué falta. Saber quién lo resuelve.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60">
              Las revisiones con la familia ponen nombre a lo pendiente: confirmaciones, acompañantes, pagos y necesidades para el salón. Este ejemplo ilustra la información que usamos para preparar esas conversaciones.
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
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9c3926]">Conversemos</p>
            <h2 className="marketing-display mt-5 text-[clamp(3rem,4.5vw,4.9rem)] font-black leading-[0.92] tracking-[-0.01em]">
              Contanos cómo recibís a tus familias.
            </h2>
            <p className="mt-7 max-w-md text-base leading-7 text-black/65">
              Nos sirve conocer tu ciudad, el tipo de fiestas de 15 que acompañás y cómo se arma el equipo de recepción. Podemos conversar sobre una familia interesada sin compartir datos de la quinceañera ni de sus invitados.
            </p>
            <p className="mt-8 flex items-center gap-3 text-sm font-bold text-[#213480]">
              <RefreshCcw className="size-4" aria-hidden="true" />
              Una propuesta para cada fiesta, acordada con su responsable.
            </p>
          </div>
          <ContactForm
            subject="Colaboración para fiestas de 15 — Alista"
            cta="Preparar consulta profesional"
            source="profesionales-page"
            audience="professional"
          />
        </div>
      </section>

      <section className="bg-[#213480] px-5 py-20 text-white sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="marketing-display max-w-2xl text-4xl font-black leading-none tracking-[-0.01em] sm:text-5xl">
            Una invitación propia. Una recepción preparada.
          </p>
          <Link
            href="/producto"
            className="inline-flex min-h-12 items-center justify-between gap-5 rounded-full border border-white/22 px-5 text-sm font-black transition hover:bg-white hover:text-[#171714] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Conocer el acompañamiento
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}

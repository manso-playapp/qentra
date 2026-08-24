import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'
import { DharmaCaseStudy } from '@/components/marketing/DharmaCaseStudy'
import { FamilyClosingJourney } from '@/components/marketing/FamilyClosingJourney'
import { GroupCheckInDemo } from '@/components/marketing/GroupCheckInDemo'
import { InvitationStoryDemo } from '@/components/marketing/InvitationStoryDemo'
import { JourneyScenes } from '@/components/marketing/JourneyScenes'
import { PersonaPreview } from '@/components/marketing/PersonaPreview'
import { PreparationCenterDemo } from '@/components/marketing/PreparationCenterDemo'
import { WhatsAppStoryDemo } from '@/components/marketing/WhatsAppStoryDemo'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Tus 15 empiezan mucho antes de esa noche',
  description:
    'Invitaciones, confirmaciones, grupos, entradas y accesos. Todo preparado en un solo lugar para que vivas tus 15.',
  path: '/',
})

const timeline = [
  { moment: '30 días antes', title: 'La invitación ya tiene identidad.', detail: 'Cada grupo recibe su link personal.' },
  { moment: '20 días antes', title: 'Las confirmaciones empiezan a llegar.', detail: 'Sin planillas separadas ni mensajes perdidos.' },
  { moment: '12 días antes', title: 'Las necesidades ya aparecen.', detail: 'Menús, acompañantes e información para preparar.' },
  { moment: '7 días antes', title: 'Los grupos están completos.', detail: 'Familias, colegio, amigas/os y accesos ordenados.' },
  { moment: '2 días antes', title: 'Pagos y llegada, resueltos.', detail: 'Lo pendiente aparece antes de convertirse en problema.' },
]

export default function HomePage() {
  return (
    <div className="marketing-editorial overflow-clip bg-[#f0eee8] text-[#171714]">
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-[#11110f] text-white">
        <video
          className="absolute inset-0 size-full object-cover object-center opacity-70 motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-hidden="true"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,13,11,0.94)_0%,rgba(13,13,11,0.65)_48%,rgba(13,13,11,0.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#11110f] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1440px] flex-col justify-between px-5 py-7 sm:px-8 sm:py-10 lg:px-14">
          <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.26em] text-white/60">
            <span>Alista · Cumpleaños de 15</span>
            <span className="hidden sm:block">Preparar también es parte de la fiesta</span>
          </div>

          <div className="max-w-5xl py-16 sm:py-24">
            <p className="hero-reveal text-xs font-bold uppercase tracking-[0.24em] text-[#ff8b70]">
              La fiesta dura una noche
            </p>
            <h1 className="marketing-display hero-reveal mt-5 text-[clamp(3.2rem,9vw,7.9rem)] font-black leading-[0.84] tracking-[-0.01em] [animation-delay:100ms]">
              Tus 15
              <br />
              empiezan
              <br />
              <span className="text-[#ff8b70]">mucho antes.</span>
            </h1>
            <p className="hero-reveal mt-8 max-w-xl text-base leading-7 text-white/72 [animation-delay:180ms] sm:text-lg">
              Invitaciones, confirmaciones, grupos, entradas y accesos. Todo preparado en un solo lugar.
            </p>
            <div className="hero-reveal mt-9 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex min-h-13 items-center justify-between gap-5 rounded-full bg-[#ff8b70] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Quiero Alista en mis 15
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/profesionales"
                className="inline-flex min-h-13 items-center justify-between gap-5 rounded-full border border-white/30 bg-black/15 px-6 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Soy planner o salón
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="flex items-end justify-between gap-6 text-xs text-white/55">
            <p className="max-w-xs leading-5">Una noche que se disfruta porque todo lo anterior ya está listo.</p>
            <a href="#antes" className="grid size-12 place-items-center rounded-full border border-white/25 transition hover:bg-white hover:text-black" aria-label="Seguir recorriendo">
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section id="antes" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/42">Pero esto no empezó acá</p>
            <h2 className="marketing-display max-w-5xl text-[clamp(2.9rem,6vw,6rem)] font-black leading-[0.86] tracking-[-0.01em]">
              Esa noche se prepara durante semanas.
            </h2>
          </div>

          <ol className="mt-20 border-t border-black/20">
            {timeline.map((item, index) => (
              <li key={item.moment} className="group grid gap-4 border-b border-black/20 py-7 sm:grid-cols-[100px_1fr_0.8fr] sm:items-center sm:gap-8">
                <span className="text-xs font-black tabular-nums text-[#d75437]">0{index + 1}</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/42">{item.moment}</p>
                  <h3 className="marketing-display mt-2 text-3xl font-black tracking-[-0.015em] sm:text-4xl">{item.title}</h3>
                </div>
                <p className="max-w-sm text-sm leading-6 text-black/52 sm:justify-self-end">{item.detail}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 flex flex-col justify-between gap-6 border-b border-black pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d75437]">Esa noche</p>
              <p className="marketing-display mt-2 text-5xl font-black tracking-[-0.01em] sm:text-6xl">Todo listo.</p>
            </div>
            <p className="max-w-sm text-sm leading-6 text-black/55">La preparación deja de ocupar la cabeza. La fiesta puede ocupar su lugar.</p>
          </div>
        </div>
      </section>

      <section id="probar" className="bg-[#171714] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff8b70]">Probá Alista</p>
            <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6vw,6.4rem)] font-black leading-[0.86] tracking-[-0.01em]">
              Una invitación prepara mucho más que una respuesta.
            </h2>
            <p className="mt-8 max-w-lg text-base leading-7 text-white/60">
              Confirmá una familia. Después mirá cómo esa respuesta se convierte en información útil para organizar la llegada.
            </p>
          </div>
          <InvitationStoryDemo />
        </div>
      </section>

      <section id="whatsapp" className="bg-[#d9ee73] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/45">Una ventaja humana</p>
              <h2 className="marketing-display mt-5 max-w-4xl text-[clamp(3.1rem,6vw,6rem)] font-black leading-[0.86] tracking-[-0.01em]">
                La invitación sale de quien tiene que salir.
              </h2>
              <p className="mt-8 max-w-xl text-base leading-7 text-black/60">
                Alista prepara el mensaje y el link personal. Dharma lo manda desde su propio WhatsApp, a un contacto que Martina reconoce.
              </p>
            </div>

            <WhatsAppStoryDemo />
          </div>
        </div>
      </section>

      <section id="recorrido" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/42">El recorrido</p>
          <h2 className="marketing-display mt-5 max-w-6xl text-[clamp(3.1rem,6.75vw,6.75rem)] font-black leading-[0.86] tracking-[-0.01em]">
            Todo lo que pasa antes, conectado.
          </h2>
          <JourneyScenes />
        </div>
      </section>

      <section id="personalizacion" className="bg-[#e7ded0] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/42">Tus 15. Tu Alista.</p>
            <h2 className="marketing-display text-[clamp(3.1rem,6vw,6rem)] font-black leading-[0.86] tracking-[-0.01em]">
              La misma fiesta no se vive igual para todos.
            </h2>
          </div>
          <div className="mt-16">
            <PersonaPreview />
          </div>
        </div>
      </section>

      <section id="preparacion" className="bg-[#162c29] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9ee73]">Centro de Preparación</p>
              <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6vw,6rem)] font-black leading-[0.88] tracking-[-0.01em]">¿Está todo listo?</h2>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-xl text-base leading-7 text-white/62">Alista transforma incertidumbre en tareas concretas antes de que se conviertan en problemas.</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-white/35">Abrí un pendiente y resolvelo en la demo</p>
            </div>
          </div>
          <div className="mt-14">
            <PreparationCenterDemo />
          </div>
        </div>
      </section>

      <section id="llegada" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d75437]">La llegada</p>
            <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6.75vw,6.75rem)] font-black leading-[0.86] tracking-[-0.01em]">Llegan juntos. Entran juntos.</h2>
            <p className="mt-8 max-w-xl text-base leading-7 text-black/55">Una familia no debería mostrar tres QR para entrar junta.</p>
          </div>

          <GroupCheckInDemo />
        </div>
      </section>

      <DharmaCaseStudy />

      <section id="profesionales" className="relative overflow-hidden bg-[#213480] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-14">
        <div className="absolute -right-28 -top-32 size-[28rem] rounded-full bg-[#ff8b70]/20 blur-3xl" aria-hidden="true" />
        <div className="mx-auto max-w-[1320px]">
          <div className="relative grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9ee73]">Para planners, salones y productoras</p>
              <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6.75vw,6.75rem)] font-black leading-[0.88] tracking-[-0.01em]">Todos nuestros 15 incluyen Alista.</h2>
            </div>
            <div>
              <p className="text-base leading-7 text-white/60">Gestioná invitados, confirmaciones, entradas y accesos de todos tus 15 desde una misma plataforma. Tu servicio se eleva. Tu operación se ordena.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {['Múltiples eventos', 'Plantillas', 'Equipo', 'Identidad propia'].map((item) => (
                  <span key={item} className="rounded-full border border-white/16 bg-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/58">
                    {item}
                  </span>
                ))}
              </div>
              <Link href="/profesionales" className="mt-8 inline-flex min-h-13 items-center gap-5 rounded-full bg-[#d9ee73] px-6 text-sm font-black text-black transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Conocer Alista para profesionales
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FamilyClosingJourney />

      <section className="bg-[#d9ee73] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px] text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/45">La fiesta dura una noche</p>
          <h2 className="marketing-display mx-auto mt-5 max-w-6xl text-[clamp(3.4rem,8.25vw,8.25rem)] font-black leading-[0.86] tracking-[-0.01em]">Alistá tus 15.</h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-7 text-black/58">Primero te mostramos cómo funcionaría para tu fiesta. No pagás ni creás un evento para pedir la demo.</p>
          <Link href="/demo" className="mt-12 inline-flex min-h-14 items-center gap-5 rounded-full bg-[#171714] px-7 text-sm font-black text-white transition hover:bg-[#c65035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#d9ee73]">
            Quiero Alista en mis 15
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}

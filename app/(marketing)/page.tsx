import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'
import { AccompaniedService } from '@/components/marketing/AccompaniedService'
import { DharmaCaseStudy } from '@/components/marketing/DharmaCaseStudy'
import { FamilyClosingJourney } from '@/components/marketing/FamilyClosingJourney'
import { GroupCheckInDemo } from '@/components/marketing/GroupCheckInDemo'
import { InvitationStoryDemo } from '@/components/marketing/InvitationStoryDemo'
import { JourneyScenes } from '@/components/marketing/JourneyScenes'
import { MarketingBackgroundVideo } from '@/components/marketing/MarketingBackgroundVideo'
import { PersonaPreview } from '@/components/marketing/PersonaPreview'
import { PreparationCenterDemo } from '@/components/marketing/PreparationCenterDemo'
import { TrackedLink } from '@/components/marketing/TrackedLink'
import { WhatsAppStoryDemo } from '@/components/marketing/WhatsAppStoryDemo'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Invitaciones con su estilo y preparación acompañada para sus 15',
  description:
    'Diseñamos la invitación y acompañamos la preparación de invitados, acompañantes, pagos y recepción. Contanos cómo imaginan sus 15.',
  path: '/',
})

const timeline = [
  { moment: 'La primera conversación', title: 'Escuchamos a las dos.', detail: 'Qué imagina la quinceañera, qué necesita la responsable y qué preparación quieren delegar.' },
  { moment: 'La propuesta visual', title: 'La invitación toma su estilo.', detail: 'Presentamos diseño, textos y recorrido. Acordamos las revisiones y ustedes aprueban la versión final.' },
  { moment: 'La configuración', title: 'Cada invitación tiene sus condiciones.', detail: 'Cena o trasnoche, acompañantes autorizados y pago cuando corresponde. La lista se prepara con esas decisiones.' },
  { moment: 'El seguimiento', title: 'Revisamos lo que falta.', detail: 'Confirmaciones, nombres y pagos pendientes. Compartimos las acciones que debe completar cada persona.' },
  { moment: 'Antes de abrir', title: 'Ensayamos la recepción.', detail: 'Probamos los celulares asignados, repasamos los casos de ingreso y dejamos acordado quién resuelve las excepciones.' },
]

export default function HomePage() {
  return (
    <div className="marketing-editorial overflow-clip bg-[#f0eee8] text-[#171714]">
      <section data-marketing-section="hero" className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-[#11110f] text-white">
        <MarketingBackgroundVideo
          className="absolute inset-0 size-full object-cover object-center opacity-70"
          eager
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,13,11,0.94)_0%,rgba(13,13,11,0.65)_48%,rgba(13,13,11,0.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#11110f] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1440px] flex-col justify-between px-5 py-7 sm:px-8 sm:py-10 lg:px-14">
          <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.26em] text-white/60">
            <span>Alista · Cumpleaños de 15</span>
            <span className="hidden sm:block">Personalización y acompañamiento</span>
          </div>

          <div className="max-w-5xl py-16 sm:py-24">
            <p className="hero-reveal text-xs font-bold uppercase tracking-[0.24em] text-[#ff8b70]">
              Para que puedas estar presente
            </p>
            <h1 className="marketing-display hero-reveal mt-5 text-[clamp(3.2rem,9vw,7.9rem)] font-black leading-[0.84] tracking-[-0.01em] [animation-delay:100ms]">
              Sus 15.
              <br />
              Su estilo.
              <br />
              <span className="text-[#ff8b70]">Vos, presente.</span>
            </h1>
            <p className="hero-reveal mt-8 max-w-xl text-base leading-7 text-white/72 [animation-delay:180ms] sm:text-lg">
              Diseñamos una invitación que la represente y acompañamos la preparación de invitados, pagos y recepción. Las decisiones, con ustedes. El trabajo de dejarlas listas, con Alista.
            </p>
            <div className="hero-reveal mt-9 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row">
              <TrackedLink
                href="/demo"
                analytics={{
                  name: 'cta_clicked',
                  properties: { placement: 'home_hero', audience: 'family', destination: 'demo' },
                }}
                className="inline-flex min-h-13 items-center justify-between gap-5 rounded-full bg-[#ff8b70] px-6 text-sm font-black text-[#171714] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Consultar para mi fecha
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </TrackedLink>
              <TrackedLink
                href="#acompanamiento"
                analytics={{
                  name: 'cta_clicked',
                  properties: { placement: 'home_hero', audience: 'family', destination: 'page_section' },
                }}
                className="inline-flex min-h-13 items-center justify-between gap-5 rounded-full border border-white/30 bg-black/15 px-6 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Conocer el acompañamiento
                <ArrowRight className="size-4" aria-hidden="true" />
              </TrackedLink>
            </div>
          </div>

          <div className="flex items-end justify-between gap-6 text-xs text-white/55">
            <p className="max-w-xs leading-5">Cada fiesta tiene su propuesta, sus entregas y sus horarios de acompañamiento acordados.</p>
            <a href="#antes" className="grid size-12 place-items-center rounded-full border border-white/25 transition hover:bg-white hover:text-black" aria-label="Seguir recorriendo">
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <AccompaniedService />

      <section id="antes" data-marketing-section="before" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/60">Lo que preparamos con ustedes</p>
            <h2 className="marketing-display max-w-5xl text-[clamp(2.9rem,6vw,6rem)] font-black leading-[0.86] tracking-[-0.01em]">
              Cada encuentro deja algo resuelto.
            </h2>
          </div>

          <ol className="mt-20 border-t border-black/20">
            {timeline.map((item, index) => (
              <li key={item.moment} className="group grid gap-4 border-b border-black/20 py-7 sm:grid-cols-[100px_1fr_0.8fr] sm:items-center sm:gap-8">
                <span className="text-xs font-black tabular-nums text-[#9d3524]">0{index + 1}</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/60">{item.moment}</p>
                  <h3 className="marketing-display mt-2 text-3xl font-black tracking-[-0.015em] sm:text-4xl">{item.title}</h3>
                </div>
                <p className="max-w-sm text-sm leading-6 text-black/65 sm:justify-self-end">{item.detail}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 flex flex-col justify-between gap-6 border-b border-black pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9d3524]">Esa noche</p>
              <p className="marketing-display mt-2 text-5xl font-black tracking-[-0.01em] sm:text-6xl">Listos para recibir.</p>
            </div>
            <p className="max-w-sm text-sm leading-6 text-black/65">El equipo de recepción llega con una lista revisada, celulares probados y una persona a quien consultar.</p>
          </div>
        </div>
      </section>

      <section id="probar" data-marketing-section="invitation_demo" className="bg-[#171714] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff8b70]">Una muestra del recorrido</p>
            <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6vw,6.4rem)] font-black leading-[0.86] tracking-[-0.01em]">
              Su estilo también puede ayudar a organizar.
            </h2>
            <p className="mt-8 max-w-lg text-base leading-7 text-white/60">
              Elegimos el diseño con ustedes y lo llevamos a una invitación fácil de usar. Este ejemplo muestra cómo una respuesta reúne los nombres y la información que necesita la organización.
            </p>
          </div>
          <InvitationStoryDemo />
        </div>
      </section>

      <section id="whatsapp" data-marketing-section="whatsapp" className="bg-[#d9ee73] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/60">Madre e hija, cada una con sus contactos</p>
              <h2 className="marketing-display mt-5 max-w-4xl text-[clamp(3.1rem,6vw,6rem)] font-black leading-[0.86] tracking-[-0.01em]">
                Cada una invita a los suyos.
              </h2>
              <p className="mt-8 max-w-xl text-base leading-7 text-black/60">
                Madre e hija invitan desde sus propios WhatsApp, sin agendar los contactos de la otra. Alista prepara el mensaje y el link; cada una decide cuándo enviarlo.
              </p>
            </div>

            <WhatsAppStoryDemo />
          </div>
        </div>
      </section>

      <section id="recorrido" data-marketing-section="journey" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/60">De la invitación a la recepción</p>
          <h2 className="marketing-display mt-5 max-w-6xl text-[clamp(3.1rem,6.75vw,6.75rem)] font-black leading-[0.86] tracking-[-0.01em]">
            Lo que responde el invitado ayuda a preparar su llegada.
          </h2>
          <JourneyScenes />
        </div>
      </section>

      <section id="personalizacion" data-marketing-section="personalization" className="bg-[#e7ded0] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/60">Diseño y contenido para cada invitación</p>
            <h2 className="marketing-display text-[clamp(3.1rem,6vw,6rem)] font-black leading-[0.86] tracking-[-0.01em]">
              Una identidad propia. La información que cada invitado necesita.
            </h2>
          </div>
          <div className="mt-16">
            <PersonaPreview />
          </div>
        </div>
      </section>

      <section id="preparacion" data-marketing-section="preparation" className="bg-[#162c29] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9ee73]">Seguimiento con la familia</p>
              <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6vw,6rem)] font-black leading-[0.88] tracking-[-0.01em]">¿Qué queda por resolver?</h2>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-xl text-base leading-7 text-white/62">Revisamos confirmaciones, acompañantes y pagos con ustedes. Cada pendiente queda asociado a una acción y a alguien que pueda resolverlo antes de abrir la recepción.</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-white/65">Explorá un ejemplo de revisión de pendientes</p>
            </div>
          </div>
          <div className="mt-14">
            <PreparationCenterDemo />
          </div>
        </div>
      </section>

      <section id="llegada" data-marketing-section="arrival" className="px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9d3524]">Un equipo preparado para recibir</p>
            <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6.75vw,6.75rem)] font-black leading-[0.86] tracking-[-0.01em]">La llegada empieza a prepararse antes de esa noche.</h2>
            <p className="mt-8 max-w-xl text-base leading-7 text-black/65">El equipo de la organización consulta la invitación y registra al grupo desde el celular. Ensayamos ese recorrido con los equipos asignados. El recibidor digital, si lo eligen, da la bienvenida después del control.</p>
          </div>

          <GroupCheckInDemo />
        </div>
      </section>

      <DharmaCaseStudy />

      <section id="profesionales" data-marketing-section="professionals" className="relative overflow-hidden bg-[#213480] px-5 py-24 text-white sm:px-8 sm:py-32 lg:px-14">
        <div className="absolute -right-28 -top-32 size-[28rem] rounded-full bg-[#ff8b70]/20 blur-3xl" aria-hidden="true" />
        <div className="mx-auto max-w-[1320px]">
          <div className="relative grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d9ee73]">Para planners, salones y productoras</p>
              <h2 className="marketing-display mt-5 text-[clamp(3.1rem,6.75vw,6.75rem)] font-black leading-[0.88] tracking-[-0.01em]">Sumá preparación al trabajo que hacés con la familia.</h2>
            </div>
            <div>
              <p className="text-base leading-7 text-white/60">Si sos planner o trabajás en un salón, coordinamos con vos el diseño, la lista y el ensayo de recepción. La familia contrata Alista y te incorpora para colaborar en su fiesta.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {['Familia responsable', 'Colaboración', 'Recepción preparada'].map((item) => (
                  <span key={item} className="rounded-full border border-white/16 bg-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">
                    {item}
                  </span>
                ))}
              </div>
              <TrackedLink
                href="#acompanamiento"
                analytics={{
                  name: 'cta_clicked',
                  properties: { placement: 'home_professionals', audience: 'professional', destination: 'professionals' },
                }}
                className="mt-8 inline-flex min-h-13 items-center gap-5 rounded-full bg-[#d9ee73] px-6 text-sm font-black text-black transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Conversemos sobre cómo colaborar
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <FamilyClosingJourney />

      <section data-marketing-section="closing" className="bg-[#d9ee73] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
        <div className="mx-auto max-w-[1320px] text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-black/60">Para que puedas estar presente</p>
          <h2 className="marketing-display mx-auto mt-5 max-w-6xl text-[clamp(3.4rem,8.25vw,8.25rem)] font-black leading-[0.86] tracking-[-0.01em]">Contanos cómo imaginan sus 15.</h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-7 text-black/58">Partimos de la fecha, el lugar y lo que quieren delegar. Les mostramos cómo sería el recorrido y acordamos una propuesta con precio total y entregas claras.</p>
          <TrackedLink
            href="/demo"
            analytics={{
              name: 'cta_clicked',
              properties: { placement: 'home_closing', audience: 'family', destination: 'demo' },
            }}
            className="mt-12 inline-flex min-h-14 items-center gap-5 rounded-full bg-[#171714] px-7 text-sm font-black text-white transition hover:bg-[#c65035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#d9ee73]"
          >
            Consultar para mi fecha
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </TrackedLink>
          <p className="mt-6 text-sm text-black/70">¿Preferís prepararlo por tu cuenta? <a href="/autogestion" className="font-bold underline underline-offset-4">Conocé la opción autogestiva</a>.</p>
        </div>
      </section>
    </div>
  )
}

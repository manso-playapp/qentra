import { ContactForm } from '@/components/marketing/ContactForm'
import { TrackedLink } from '@/components/marketing/TrackedLink'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Consultá disponibilidad para tus 15',
  description:
    'Contanos la fecha, el lugar y qué quieren delegar en sus 15. Revisamos disponibilidad para diseño, preparación y acompañamiento de recepción.',
  path: '/contacto',
})

export default function ContactoPage() {
  return (
    <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Conversemos sobre sus 15</p>
          <h1 className="marketing-display mt-6 max-w-xl text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.91] tracking-[-0.005em] text-[#171714]">
            ¿Cuándo es la fiesta que están imaginando?
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-black/58">
            Contanos la fecha, la ciudad, el salón y cuántas personas esperan. Nos interesa saber qué estilo imaginan, si habrá trasnoche con entrada paga y qué tareas quieren delegar. Con eso revisamos disponibilidad y conversamos sobre una propuesta.
          </p>

          <div className="mt-12 border-y border-black/15">
            <TrackedLink
              href="mailto:hola@alista.com.ar"
              analytics={{
                name: 'contact_email_opened',
                properties: { source: 'contacto-page', audience: 'general' },
              }}
              className="grid gap-1 border-b border-black/15 py-5 transition hover:pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#213480] focus-visible:ring-inset"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">Email</span>
              <span className="text-sm font-black text-[#213480]">hola@alista.com.ar</span>
            </TrackedLink>
            <div className="grid gap-1 py-5">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">Qué sigue</span>
              <span className="text-sm font-black text-[#171714]">Revisamos la fecha y acordamos qué necesitan.</span>
            </div>
          </div>
          <p className="mt-6 text-sm leading-6 text-black/65">Antes de contratar recibirán el alcance, las revisiones y los horarios de soporte propuestos. Esta consulta no reserva la fecha.</p>
        </div>

        <ContactForm subject="Disponibilidad y acompañamiento para mis 15 — Alista" cta="Preparar consulta de disponibilidad" source="contacto-page" audience="family" />
      </div>
    </section>
  )
}

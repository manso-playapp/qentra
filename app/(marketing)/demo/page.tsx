import { Check, Eye, Mail } from 'lucide-react'
import { ContactForm } from '@/components/marketing/ContactForm'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Conversemos sobre tus 15',
  description:
    'Consultá disponibilidad para tus 15. Te mostramos cómo trabajamos el diseño, los invitados, el trasnoche y la preparación de recepción.',
  path: '/demo',
})

const EXPECT = [
  'Una muestra del diseño y de cómo se adapta a la identidad de la fiesta.',
  'Cómo reunimos invitados, acompañantes autorizados y pagos en la preparación.',
  'Qué tareas pueden delegar y cómo se acuerdan revisiones, ensayo y soporte.',
]

export default function DemoPage() {
  return (
    <section className="bg-[#213480] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full border border-white/18 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/65">
            Diseño y acompañamiento para sus 15
          </span>
          <h1 className="marketing-display mt-7 max-w-xl text-[clamp(3rem,5.25vw,5.25rem)] font-black leading-[0.9] tracking-[-0.005em] text-white">
            Veamos cómo preparar la fiesta que quieren.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/65">
            Contanos cuándo y dónde serán los 15, cuántos invitados esperan y qué les gustaría delegar. Revisamos disponibilidad y les mostramos nuestra forma de trabajar antes de armar un presupuesto.
          </p>

          <div className="mt-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d9ee73]">
              Qué vamos a conversar
            </p>
            <ul className="mt-4 space-y-3">
              {EXPECT.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/68">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#d9ee73] text-[#171714]">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4 text-white">
              <Eye className="size-4 text-[#ff8b70]" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold">Propuesta antes de contratar</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4 text-white">
              <Mail className="size-4 text-[#ff8b70]" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold">Consulta por correo, sin reserva</p>
            </div>
          </div>
        </div>

        <ContactForm
          subject="Disponibilidad y acompañamiento para mis 15 — Alista"
          cta="Preparar consulta de disponibilidad"
          source="familia-demo"
          audience="family"
        />
      </div>
    </section>
  )
}

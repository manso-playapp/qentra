import { Check, Eye, Mail } from 'lucide-react'
import { ContactForm } from '@/components/marketing/ContactForm'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const legacyMetadata = {
  title: 'Solicitar demo',
  description:
    'Contanos qué fiesta estás organizando y te mostramos cómo vincular invitación, pago y acceso con Alista.',
}

export const metadata = createMarketingMetadata({
  title: 'Solicita una demo de Alista',
  description: 'Conoce Alista para organizar invitaciones, pagos, acceso QR y cupo en tu proximo evento.',
  path: '/demo',
})

const EXPECT = [
  'Cómo se verían la invitación y el recorrido de tus 15.',
  'Cómo se ordenan confirmaciones, grupos, pagos y restricciones.',
  'Qué llega preparado a la recepción esa noche.',
]

export default function DemoPage() {
  return (
    <section className="bg-[#213480] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full border border-white/18 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/65">
            Demo para tu familia
          </span>
          <h1 className="marketing-display mt-7 max-w-xl text-[clamp(3rem,5.25vw,5.25rem)] font-black leading-[0.9] tracking-[-0.005em] text-white">
            Primero entendelo. Después decidí.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/65">
            Te mostramos cómo Alista puede acompañar tus 15 desde la invitación hasta la llegada. Esta solicitud no crea un evento ni inicia un pago.
          </p>

          <div className="mt-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d9ee73]">
              Qué vas a ver
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
              <p className="mt-3 text-xs font-bold">Sin compromiso de compra</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4 text-white">
              <Mail className="size-4 text-[#ff8b70]" aria-hidden="true" />
              <p className="mt-3 text-xs font-bold">Vos confirmás el envío</p>
            </div>
          </div>
        </div>

        <ContactForm
          subject="Quiero Alista en mis 15"
          cta="Preparar solicitud de demo"
          source="familia-demo"
          audience="family"
        />
      </div>
    </section>
  )
}

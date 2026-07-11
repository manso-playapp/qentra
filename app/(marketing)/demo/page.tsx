import { ContactForm } from '@/components/marketing/ContactForm'

export const metadata = {
  title: 'Solicitar demo',
  description:
    'Contanos qué evento estás organizando y te mostramos cómo preparar cada llegada con Alista.',
}

const EXPECT = [
  'Una recorrida por el producto según tu tipo de evento.',
  'Cómo se ordenan invitaciones, confirmaciones y accesos.',
  'Qué necesitás para empezar a preparar tu próximo evento.',
]

export default function DemoPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Solicitar demo
          </span>
          <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl">
            Preparemos tu próximo evento
            <span className="text-brand-cyan"> juntos.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Dejanos tus datos y te mostramos cómo Alista convierte la información de tus invitados
            en una recepción más clara, fluida y personal.
          </p>

          <div className="mt-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Qué vas a ver
            </p>
            <ul className="mt-4 space-y-3">
              {EXPECT.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-cyan" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ContactForm subject="Solicitud de demo — Alista" cta="Solicitar demo" />
      </div>
    </section>
  )
}

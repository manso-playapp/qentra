import Link from 'next/link'
import { ArrowRight, DoorOpen, Link2, Users, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventControlPanel } from '@/components/marketing/EventControlPanel'
import { FestiveBackdrop } from '@/components/marketing/FestiveBackdrop'
import { ProductSurfaces } from '@/components/marketing/ProductSurfaces'
import { FaqSection } from '@/components/marketing/FaqSection'

export const metadata = {
  title: { absolute: 'Alista · Abrí la fiesta sin abrir un problema.' },
  description:
    'Alista vincula invitación, pago y acceso en fiestas privadas con cupo limitado. Para salones, productores y organizadores que abren fiestas de 15, egresados y celebraciones juveniles con entrada o aporte.',
}

const PROBLEMS = [
  'El alias que circula',
  'Comprobantes reenviados',
  'Invitados no contemplados',
  'Sobrecupo en la puerta',
  'Puerta sin criterio',
]

const CAPABILITIES = [
  {
    icon: Link2,
    title: 'Identidad vinculada',
    body: 'Cada invitación, pago y acceso corresponde a una persona o grupo definido. Nadie entra sin estar contemplado.',
  },
  {
    icon: Wallet,
    title: 'Pago verificable',
    body: 'Diseñado para distinguir un pago confirmado de una captura o un comprobante reenviado.',
  },
  {
    icon: Users,
    title: 'Cupo visible',
    body: 'El organizador conoce invitados, pagos, confirmaciones e ingresos, sin planillas separadas.',
  },
  {
    icon: DoorOpen,
    title: 'Puerta resolutiva',
    body: 'El equipo valida y resuelve excepciones en la puerta, sin depender de la familia.',
  },
]

const FLOW = [
  { step: 'Invitá', note: 'Enviás una invitación que se reconoce.' },
  { step: 'Identificá', note: 'La persona confirma y suma a sus acompañantes.' },
  { step: 'Vinculá el pago', note: 'Cada aporte queda asociado a un invitado.' },
  { step: 'Emití el acceso', note: 'Un QR único cuando el acceso queda habilitado.' },
  { step: 'Validá', note: 'En la puerta, el equipo valida en segundos.' },
  { step: 'Registrá', note: 'Cada ingreso cuenta dentro del cupo.' },
]

const RESULTS = [
  'Cada pago vinculado a una persona real.',
  'Cupo e ingresos visibles antes y durante la fiesta.',
  'Menos reclamos y excepciones en la puerta.',
  'El equipo resuelve sin llamar al organizador.',
  'La familia celebra, no opera la recepción.',
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <FestiveBackdrop />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-16 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Invitación, pago y acceso. Vinculados.
            </span>
            <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-6xl">
              Abrí la fiesta
              <br />
              <span className="text-brand-cyan">sin abrir un problema.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Alista vincula cada invitado con su pago y su acceso, para que en la puerta el equipo
              sepa quién puede entrar y cuánto cupo queda. Pensado para fiestas privadas con entrada
              o aporte y cupo limitado.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/demo">
                  Solicitar una demostración
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/como-funciona">Ver cómo funciona</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Fiestas de 15, egresados y celebraciones juveniles. La invitación se abre desde
              WhatsApp, sin instalar nada.
            </p>
          </div>

          <EventControlPanel />
        </div>
      </section>

      {/* Problema */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <h2 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              El problema no empieza en la puerta.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              En muchas fiestas privadas se cobra una entrada o un aporte por transferencia. El alias
              y los comprobantes circulan fuera de la lista original, y en la puerta aparecen más
              personas que las previstas reclamando el ingreso. Una captura demuestra que alguien
              transfirió, no quién va a entrar ni si queda lugar.
            </p>
          </div>

          <ul className="mt-10 flex flex-wrap gap-3">
            {PROBLEMS.map((problem) => (
              <li
                key={problem}
                className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                {problem}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Propuesta de valor */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            La propuesta
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Cada pago, una persona. Cada persona, un acceso.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon
            return (
              <div
                key={cap.title}
                className="rounded-3xl border border-border/70 bg-card p-6 shadow-[0_18px_50px_rgba(22,33,90,0.08)]"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-event-surface text-primary ring-1 ring-primary/15">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{cap.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Las tres superficies: invitación, panel/puerta y totem. */}
      <ProductSurfaces />

      {/* Mecanismo / Flujo */}
      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              El recorrido
            </p>
            <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              De la invitación a la puerta, todo conectado.
            </h2>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FLOW.map((item, index) => (
              <li
                key={item.step}
                className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card/70 p-5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-admin-navy font-display text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{item.step}</p>
                  <p className="text-sm text-muted-foreground">{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Resultado */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              El resultado
            </p>
            <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Lo que cambia cuando la apertura está preparada.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Un equipo que resuelve en la puerta y una familia que puede estar en la fiesta, sin
              gestionar comprobantes durante la celebración.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {RESULTS.map((result) => (
              <li
                key={result}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-5"
              >
                <span
                  aria-hidden
                  className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" strokeWidth={3}>
                    <path
                      d="M20 6 9 17l-5-5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="text-sm leading-6 text-foreground">{result}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Preguntas frecuentes: objeciones reales del comprador. */}
      <FaqSection />

      {/* Cierre humano */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="overflow-hidden rounded-[2.5rem] bg-admin-navy px-8 py-16 text-center text-white sm:px-16">
          <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Delegá la puerta. Viví la fiesta.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-white/70">
            Alista mantiene cada pago, cada persona y cada acceso bajo control. La familia celebra y
            el equipo sabe a quién recibir.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/demo">Solicitar una demostración</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/como-funciona">Ver cómo funciona</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

import Link from 'next/link'
import { ArrowRight, Bell, ClipboardList, Layers, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrivalSequence } from '@/components/marketing/ArrivalSequence'

export const metadata = {
  title: { absolute: 'Alista · Llegá al evento con todo preparado.' },
  description:
    'Gestioná invitaciones, confirmaciones y accesos desde un solo lugar. Detectá pendientes antes, coordiná a tu equipo y recibí sin depender de planillas, mensajes ni decisiones de último momento.',
}

const PROBLEMS = [
  'Datos incompletos',
  'Acompañantes sin registrar',
  'Accesos sin definir',
  'Necesidades no contempladas',
  'Equipo sin contexto',
]

const CAPABILITIES = [
  {
    icon: ClipboardList,
    title: 'Conocer',
    body: 'Obtené confirmaciones, acompañantes, necesidades y condiciones de acceso desde el primer contacto.',
  },
  {
    icon: Layers,
    title: 'Organizar',
    body: 'Convertí esa información en listas, grupos, roles, sectores y credenciales claras.',
  },
  {
    icon: Bell,
    title: 'Anticipar',
    body: 'Detectá datos incompletos, duplicados y accesos incompatibles antes de que lleguen.',
  },
  {
    icon: Users,
    title: 'Coordinar',
    body: 'Dale a cada persona del equipo lo que necesita para actuar sin depender del anfitrión.',
  },
]

const FLOW = [
  { step: 'Invitá', note: 'Enviá una invitación que se reconoce.' },
  { step: 'Confirmá', note: 'La persona confirma en pocos pasos.' },
  { step: 'Conocé', note: 'Sumás solo la información pertinente.' },
  { step: 'Prepará', note: 'El equipo llega con criterios claros.' },
  { step: 'Recibí', note: 'El ingreso es fluido y sin consultas.' },
  { step: 'Aprendé', note: 'Cada evento mejora el siguiente.' },
]

const RESULTS = [
  'Información centralizada en un solo lugar.',
  'Pendientes visibles antes del evento.',
  'Roles y criterios claros para el equipo.',
  'Accesos y excepciones preparados de antemano.',
  'Visibilidad sin convertir al anfitrión en operador.',
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Plataforma de experiencia de invitados
            </span>
            <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-6xl">
              Llegá al evento
              <br />
              <span className="text-brand-cyan">con todo preparado.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Gestioná invitaciones, confirmaciones y accesos desde un solo lugar. Detectá
              pendientes antes, coordiná a tu equipo y recibí sin depender de planillas, mensajes ni
              decisiones de último momento.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/admin">
                  Preparar un evento
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/como-funciona">Ver cómo funciona</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Para eventos sociales y corporativos. Sin instalar nada para tus invitados.
            </p>
          </div>

          <ArrivalSequence />
        </div>
      </section>

      {/* Problema */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              El problema no empieza en la puerta.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              La información suele estar repartida entre planillas, formularios, mensajes y
              personas. Cuando no se transforma en preparación, las excepciones aparecen en el peor
              momento: cuando los invitados ya están llegando.
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
            Propuesta de valor
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Conocé antes. Prepará mejor. Recibí con claridad.
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

      {/* Mecanismo / Flujo */}
      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              El recorrido
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Cada interacción mejora la siguiente.
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
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Lo que cambia cuando preparás antes.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Un equipo preparado y una recepción clara, sin decisiones improvisadas ni consultas de
              último momento.
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

      {/* Cierre humano */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="overflow-hidden rounded-[2.5rem] bg-admin-navy px-8 py-16 text-center text-white sm:px-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Recibir mejor empieza mucho antes de la llegada.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Todo listo para que el anfitrión pueda estar presente.
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
              <Link href="/admin">Preparar mi próximo evento</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

import { PageHero, Section, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Cómo funciona',
  description:
    'Invitar, identificar, vincular el pago, emitir el acceso y validar en la puerta. Un recorrido claro donde cada persona queda vinculada con su pago y su acceso.',
}

const STEPS = [
  {
    step: 'Invitá',
    body: 'Enviás una invitación que se reconoce, desde el mismo lugar donde vas a operar toda la fiesta.',
  },
  {
    step: 'Identificá',
    body: 'El invitado confirma en pocos pasos y suma a sus acompañantes, sin instalar una app ni crear una cuenta.',
  },
  {
    step: 'Vinculá el pago',
    body: 'Cada aporte queda asociado a una persona. Diseñado para distinguir un pago confirmado de una captura reenviada.',
  },
  {
    step: 'Emití el acceso',
    body: 'Cuando el acceso queda habilitado, Alista genera un QR único por invitado, que cuenta dentro del cupo.',
  },
  {
    step: 'Validá',
    body: 'En la puerta, el equipo valida en segundos, detecta duplicados y resuelve excepciones con autorización.',
  },
]

const AUDIENCES = [
  {
    title: 'Para el salón o productor',
    body: 'Una operación repetible que reduce reclamos y profesionaliza la apertura. Preparás con anticipación, das autonomía al equipo y mantenés el cupo bajo control, evento tras evento.',
    points: ['Configuración reutilizable', 'Cupo y pagos a la vista', 'Menos consultas a la familia'],
  },
  {
    title: 'Para el equipo de puerta',
    body: 'Información inmediata, estados claros y un camino simple para resolver excepciones. Buscar, validar y decidir en pocos pasos, sin interpretar comprobantes.',
    points: ['Buscar y encontrar', 'Validar el acceso', 'Resolver excepciones'],
  },
]

export default function ComoFuncionaPage() {
  return (
    <>
      <PageHero
        eyebrow="El recorrido"
        title="De la invitación a la puerta,"
        highlight="todo vinculado."
        description="El problema de la puerta no empieza en la puerta: empieza cuando el pago y la lista viven en lugares distintos. Alista ordena ese recorrido en cinco momentos, de la invitación a la validación."
        primaryCta={{ href: '/demo', label: 'Solicitar demo' }}
      />

      <Section muted>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((item, index) => (
            <li
              key={item.step}
              className="flex flex-col rounded-2xl border border-border/60 bg-card p-5"
            >
              <span className="grid size-9 place-items-center rounded-full bg-admin-navy font-display text-sm font-semibold text-white">
                {index + 1}
              </span>
              <p className="mt-4 text-balance font-display text-lg font-semibold text-foreground">{item.step}</p>
              <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Dos miradas, una misma base"
        title="Preparar la apertura sirve al salón y a la puerta."
      >
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {AUDIENCES.map((aud) => (
            <div key={aud.title} className="rounded-3xl border border-border/70 bg-card p-8">
              <h3 className="text-balance font-display text-xl font-semibold text-foreground">{aud.title}</h3>
              <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">{aud.body}</p>
              <ul className="mt-5 space-y-2">
                {aud.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="size-1.5 rounded-full bg-brand-cyan" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <ClosingCta
        title="Cada pago, una persona. Cada persona, un acceso."
        description="Conservá el carácter personal de la fiesta mientras profesionalizás su apertura."
      />
    </>
  )
}

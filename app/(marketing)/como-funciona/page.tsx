import { PageHero, Section, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Cómo funciona',
  description:
    'Invitar, confirmar, preparar, recibir y aprender. Un recorrido claro donde cada interacción mejora la siguiente.',
}

const STEPS = [
  {
    step: 'Invitá',
    body: 'Enviás una invitación que se reconoce, desde el mismo lugar donde vas a operar todo el evento.',
  },
  {
    step: 'Confirmá',
    body: 'La persona confirma en pocos pasos y aporta solo la información pertinente para su llegada.',
  },
  {
    step: 'Prepará',
    body: 'Alista detecta pendientes, datos incompletos y accesos sin definir, y los convierte en tareas claras antes del evento.',
  },
  {
    step: 'Recibí',
    body: 'El equipo llega con criterios compartidos y el ingreso es fluido, sin consultas de último momento.',
  },
  {
    step: 'Aprendé',
    body: 'Cada evento deja incidencias, asistencia y aprendizajes que preparan mejor el próximo.',
  },
]

const AUDIENCES = [
  {
    title: 'Para organizadores',
    body: 'Una operación confiable, repetible y delegable. Preparás con anticipación, das autonomía al equipo y mantenés visibilidad sin convertirte en operador.',
    points: ['Preparación anticipada', 'Autonomía del equipo', 'Visibilidad sin fricción'],
  },
  {
    title: 'Para equipos de recepción',
    body: 'Información inmediata, estados claros y un camino simple para resolver excepciones. Encontrar, validar y resolver en pocos pasos.',
    points: ['Buscar y encontrar', 'Validar el acceso', 'Resolver excepciones'],
  },
]

export default function ComoFuncionaPage() {
  return (
    <>
      <PageHero
        eyebrow="El recorrido"
        title="Cada interacción"
        highlight="mejora la siguiente."
        description="El problema de la puerta no empieza en la puerta: empieza cuando la información llega tarde. Alista ordena ese recorrido en cinco momentos, de la invitación al aprendizaje."
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
              <p className="mt-4 font-display text-lg font-semibold text-foreground">{item.step}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Dos miradas, una misma base"
        title="Preparar sirve a quien organiza y a quien recibe."
      >
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {AUDIENCES.map((aud) => (
            <div key={aud.title} className="rounded-3xl border border-border/70 bg-card p-8">
              <h3 className="font-display text-xl font-semibold text-foreground">{aud.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{aud.body}</p>
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
        title="Preparar cada llegada es cuidar la experiencia."
        description="Todo listo para que el anfitrión pueda estar presente."
      />
    </>
  )
}

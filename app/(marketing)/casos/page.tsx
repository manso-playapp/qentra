import { PageHero, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Casos de uso',
  description:
    'Fiestas de 15, egresados y recepciones, y salones o productores recurrentes. La misma base para vincular invitación, pago y acceso según cada fiesta.',
}

const CASES = [
  {
    id: 'fiestas-15',
    eyebrow: 'Fiestas de 15',
    title: 'Que la familia disfrute, no que opere la puerta.',
    body: 'La fiesta se cobra por transferencia, el alias circula y en la puerta aparece gente de más. Alista vincula cada aporte con un invitado y prepara acompañantes y accesos, para que la familia esté en la fiesta y no resolviendo comprobantes.',
    points: [
      'Cada pago vinculado a una persona antes de la fiesta.',
      'Acompañantes y necesidades contemplados desde la invitación.',
      'Ingreso ordenado, sin sobrecupo ni consultas de último momento.',
    ],
  },
  {
    id: 'egresados',
    eyebrow: 'Egresados y recepciones',
    title: 'Grupos grandes, cobro previo y cupo que hay que respetar.',
    body: 'Promociones, egresados y recepciones donde el cobro es previo y el aforo importa. Alista ordena la lista, distingue quién pagó y da al equipo criterios claros para abrir sin discusiones.',
    points: [
      'Lista y pagos en un solo lugar, no en planillas separadas.',
      'Cupo e ingresos visibles en tiempo real.',
      'Excepciones resueltas con autorización, no bajo presión.',
    ],
  },
  {
    id: 'salones',
    eyebrow: 'Salones y productores',
    title: 'Una apertura repetible en cada fiesta del año.',
    body: 'Salones, productores y planners que abren decenas de fiestas por temporada y arriesgan su reputación en la puerta. La misma configuración reutilizable evento tras evento, con la lógica sensible resuelta en el backend.',
    points: [
      'Una base repetible y delegable, fiesta tras fiesta.',
      'Estados, validación y excepciones resueltos del lado del servidor.',
      'Un servicio diferencial para incorporar al paquete comercial.',
    ],
  },
]

export default function CasosPage() {
  return (
    <>
      <PageHero
        eyebrow="Casos de uso"
        title="Un mismo criterio,"
        highlight="cada tipo de fiesta."
        description="Sea una fiesta de 15, una recepción de egresados o un salón que abre todos los fines de semana, la idea es la misma: vincular invitación, pago y acceso antes de que la puerta se vuelva un problema."
        primaryCta={{ href: '/demo', label: 'Solicitar demo' }}
      />

      {CASES.map((item, index) => (
        <section
          key={item.id}
          id={item.id}
          className={index % 2 === 1 ? 'border-y border-border/60 bg-secondary/30' : ''}
        >
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {item.eyebrow}
              </p>
              <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {item.title}
              </h2>
              <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
            <ul className="grid gap-4">
              {item.points.map((point) => (
                <li
                  key={point}
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
                  <p className="text-pretty text-sm leading-6 text-foreground">{point}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <ClosingCta
        title="Abrí la fiesta sin abrir un problema."
        description="La misma base para vincular invitación, pago y acceso, sea cual sea la celebración."
      />
    </>
  )
}

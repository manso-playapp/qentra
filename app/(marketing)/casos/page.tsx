import { PageHero, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Casos de uso',
  description:
    'Eventos sociales, corporativos y de escala. La misma base para preparar cada llegada según el tipo de evento.',
}

const CASES = [
  {
    id: 'sociales',
    eyebrow: 'Eventos sociales',
    title: 'Que la familia disfrute, no que opere la puerta.',
    body: 'Casamientos, cumpleaños y celebraciones donde el anfitrión debería estar con su gente, no resolviendo listas. Alista prepara confirmaciones, acompañantes y necesidades particulares para que la recepción fluya sola.',
    points: [
      'Confirmaciones y acompañantes ordenados desde la invitación.',
      'Necesidades particulares contempladas antes de la llegada.',
      'Ingreso sereno, sin planillas ni consultas de último momento.',
    ],
  },
  {
    id: 'corporativos',
    eyebrow: 'Eventos corporativos',
    title: 'Información clara y coordinación en tiempo real.',
    body: 'Lanzamientos, conferencias y activaciones donde la acreditación tiene que ser prolija y el equipo tiene que estar alineado. Accesos preparados de antemano y criterios compartidos para toda la operación.',
    points: [
      'Accesos y credenciales definidos antes del evento.',
      'Roles y permisos por responsabilidad para el equipo.',
      'Coordinación en tiempo real durante la recepción.',
    ],
  },
  {
    id: 'escala',
    eyebrow: 'Eventos de escala',
    title: 'Preparación que sostiene el volumen.',
    body: 'Instituciones, productoras y salones que reciben personas de manera recurrente. La misma base reutilizable, con la lógica sensible resuelta en el backend para operar con confianza a mayor volumen.',
    points: [
      'Una base repetible y delegable evento tras evento.',
      'Estados, validación y excepciones resueltos del lado del servidor.',
      'Aprendizajes que preparan mejor cada nueva edición.',
    ],
  },
]

export default function CasosPage() {
  return (
    <>
      <PageHero
        eyebrow="Casos de uso"
        title="Un mismo criterio,"
        highlight="cada tipo de evento."
        description="Sea una celebración familiar, un evento corporativo o una operación a escala, la idea es la misma: preparar cada llegada antes de que se convierta en un problema en la puerta."
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
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {item.title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{item.body}</p>
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
                  <p className="text-sm leading-6 text-foreground">{point}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <ClosingCta
        title="Todo listo para que puedas estar presente."
        description="Preparar cada llegada es cuidar la experiencia, sea cual sea el evento."
      />
    </>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHero, Section, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Precios',
  description:
    'Planes que se adaptan al tipo y la escala de tu evento. Escribinos y armamos una propuesta a medida.',
}

const PLANS = [
  {
    name: 'Social',
    forWho: 'Celebraciones y eventos familiares.',
    features: [
      'Invitaciones y confirmaciones',
      'Invitados y acompañantes',
      'Preparación de pendientes',
      'Ingreso con check-in',
    ],
    featured: false,
  },
  {
    name: 'Profesional',
    forWho: 'Organizadores, productoras y eventos corporativos.',
    features: [
      'Todo lo de Social',
      'Roles y permisos para el equipo',
      'Accesos y excepciones preparados',
      'Reportes de asistencia e incidencias',
    ],
    featured: true,
  },
  {
    name: 'Escala',
    forWho: 'Instituciones y operaciones recurrentes.',
    features: [
      'Todo lo de Profesional',
      'Base reutilizable entre eventos',
      'Acompañamiento en la puesta en marcha',
      'Criterios de privacidad a medida',
    ],
    featured: false,
  },
]

export default function PreciosPage() {
  return (
    <>
      <PageHero
        eyebrow="Precios"
        title="Un plan para cada"
        highlight="tipo de evento."
        description="Cada operación es distinta, así que la propuesta se adapta al tipo y la escala de tu evento. Contanos qué necesitás y armamos algo a medida, sin sorpresas."
      />

      <Section muted>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? 'rounded-3xl border-2 border-primary bg-card p-8 shadow-[0_18px_50px_rgba(22,33,90,0.1)]'
                  : 'rounded-3xl border border-border/70 bg-card p-8'
              }
            >
              {plan.featured && (
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Más elegido
                </span>
              )}
              <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.forWho}</p>
              <p className="mt-6 font-display text-lg font-semibold text-foreground">A medida</p>
              <p className="text-sm text-muted-foreground">según tipo y escala del evento</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-cyan" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={plan.featured ? 'default' : 'outline'}>
                <Link href="/demo">Consultar</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿No sabés qué plan necesitás?{' '}
          <Link href="/contacto" className="font-medium text-primary hover:underline">
            Escribinos
          </Link>{' '}
          y lo vemos juntos.
        </p>
      </Section>

      <ClosingCta
        title="Empecemos por tu próximo evento."
        description="Contanos qué estás organizando y te mostramos cómo prepararlo con Alista."
        primary={{ href: '/demo', label: 'Solicitar demo' }}
        secondary={{ href: '/contacto', label: 'Hablar con el equipo' }}
      />
    </>
  )
}

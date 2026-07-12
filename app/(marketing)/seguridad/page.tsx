import { Lock, EyeOff, ServerCog, UserCheck } from 'lucide-react'
import { PageHero, Section, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Seguridad y privacidad',
  description:
    'Datos tratados con proporcionalidad, consentimiento y cuidado, incluidos los de menores. La lógica sensible vive en el backend, no en la puerta.',
}

const PRINCIPLES = [
  {
    icon: UserCheck,
    title: 'Datos con un uso claro',
    body: 'Se pide solo la información necesaria para vincular a una persona con su pago y su acceso. Nada de acumular datos para aparentar sofisticación.',
  },
  {
    icon: EyeOff,
    title: 'Sin lógica de vigilancia',
    body: 'La información sirve para ordenar la apertura, no para vigilar. Nadie es tratado como sospechoso: distinguir un pago de una captura no es señalar a una persona.',
  },
  {
    icon: ServerCog,
    title: 'Lógica sensible en el backend',
    body: 'Estados, validación de acceso, duplicados, horarios y cupo se resuelven del lado del servidor, no en el frontend.',
  },
  {
    icon: Lock,
    title: 'Consentimiento y cuidado',
    body: 'Privacidad, consentimiento y control de datos, con especial cuidado cuando hay menores, y permisos diseñados por responsabilidad.',
  },
]

export default function SeguridadPage() {
  return (
    <>
      <PageHero
        eyebrow="Seguridad y privacidad"
        title="Cuidar la fiesta también es"
        highlight="cuidar los datos."
        description="Alista trata la información con proporcionalidad: pide lo necesario para vincular pago, persona y acceso, y mantiene la lógica sensible protegida. La tecnología debe desaparecer en la experiencia, no volverse un mecanismo de control sobre adolescentes y familias."
      />

      <Section muted>
        <div className="grid gap-5 sm:grid-cols-2">
          {PRINCIPLES.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.title} className="rounded-3xl border border-border/70 bg-card p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-event-surface text-primary ring-1 ring-primary/15">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-balance font-display text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">{p.body}</p>
              </div>
            )
          })}
        </div>
      </Section>

      <Section
        eyebrow="Nuestros límites"
        title="Lo que Alista no hace."
        description="Definir qué no hacemos es parte de cómo cuidamos la relación con cada familia, invitado y equipo."
      >
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            'No prometer validación automática de pagos si la integración real no puede demostrarla.',
            'No tratar una captura como equivalente automático de un pago confirmado.',
            'No convertir el control en el centro emocional de la marca.',
            'No recopilar datos sin un uso claro para la persona o la operación.',
          ].map((limit) => (
            <li
              key={limit}
              className="rounded-2xl border border-border/70 bg-card px-5 py-4 text-pretty text-sm leading-6 text-foreground"
            >
              {limit}
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
          El tratamiento de datos personales se rige por la normativa aplicable en Argentina,
          incluida la Ley 25.326 de Protección de Datos Personales. Ver la{' '}
          <a href="/privacidad" className="font-medium text-primary hover:underline">
            política de privacidad
          </a>
          .
        </p>
      </Section>

      <ClosingCta
        title="Ordenar la apertura, sin vigilar a nadie."
        description="Todo vinculado para que el equipo resuelva en la puerta y cada invitado se sienta esperado."
      />
    </>
  )
}

import { Lock, EyeOff, ServerCog, UserCheck } from 'lucide-react'
import { PageHero, Section, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Seguridad y privacidad',
  description:
    'Datos tratados con proporcionalidad, consentimiento y control. La lógica sensible vive en el backend, no en la puerta.',
}

const PRINCIPLES = [
  {
    icon: UserCheck,
    title: 'Datos con un uso claro',
    body: 'Se pide solo la información pertinente para preparar una llegada. Nada de acumular datos para aparentar sofisticación.',
  },
  {
    icon: EyeOff,
    title: 'Sin lógica de vigilancia',
    body: 'La información sirve para contemplar y recibir mejor, no para vigilar. Las personas no son unidades de procesamiento.',
  },
  {
    icon: ServerCog,
    title: 'Lógica sensible en el backend',
    body: 'Estados, validación de acceso, duplicados, horarios y aforo se resuelven del lado del servidor, no en el frontend.',
  },
  {
    icon: Lock,
    title: 'Control y consentimiento',
    body: 'Privacidad, consentimiento y control de datos visibles cuando corresponde, con permisos y accesos diseñados por responsabilidad.',
  },
]

export default function SeguridadPage() {
  return (
    <>
      <PageHero
        eyebrow="Seguridad y privacidad"
        title="Cuidar a las personas también es"
        highlight="cuidar sus datos."
        description="Alista trata la información con proporcionalidad: pide lo necesario, lo usa para preparar mejor una recepción y mantiene la lógica sensible protegida. La tecnología debe desaparecer en la experiencia, no volverse un mecanismo de control."
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
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.body}</p>
              </div>
            )
          })}
        </div>
      </Section>

      <Section
        eyebrow="Nuestros límites"
        title="Lo que Alista no hace."
        description="Definir qué no hacemos es parte de cómo cuidamos la relación con cada persona."
      >
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            'No recopilar información sin una mejora concreta para la persona o la operación.',
            'No convertir el control en el centro emocional de la marca.',
            'No reemplazar el criterio humano en situaciones sensibles.',
            'No confundir personalización con acumular datos.',
          ].map((limit) => (
            <li
              key={limit}
              className="rounded-2xl border border-border/70 bg-card px-5 py-4 text-sm leading-6 text-foreground"
            >
              {limit}
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-sm leading-6 text-muted-foreground">
          El tratamiento de datos personales se rige por la normativa aplicable en Argentina,
          incluida la Ley 25.326 de Protección de Datos Personales. Ver la{' '}
          <a href="/privacidad" className="font-medium text-primary hover:underline">
            política de privacidad
          </a>
          .
        </p>
      </Section>

      <ClosingCta
        title="Preparar con cuidado, sin vigilar."
        description="Todo listo para que el anfitrión pueda estar presente y cada invitado se sienta esperado."
      />
    </>
  )
}

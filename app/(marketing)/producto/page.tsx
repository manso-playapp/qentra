import { CalendarCheck, ClipboardList, Mail, ScanLine, Users, BarChart3, ShieldCheck } from 'lucide-react'
import { PageHero, Section, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Producto',
  description:
    'Invitaciones, confirmaciones, invitados, accesos, equipo y reportes en un solo lugar. Convertí la información previa en preparación concreta.',
}

const MODULES = [
  {
    icon: CalendarCheck,
    title: 'Eventos',
    body: 'Creá, editá y administrá cada evento con su fecha, lugar, cupo y canal de comunicación.',
  },
  {
    icon: Users,
    title: 'Invitados',
    body: 'Alta manual o importada, categorías, estados y acompañantes. Cada persona con el contexto que hace falta.',
  },
  {
    icon: Mail,
    title: 'Invitaciones',
    body: 'Enlaces seguros, RSVP y captura de la información pertinente, sin planillas sueltas ni mensajes cruzados.',
  },
  {
    icon: ClipboardList,
    title: 'Preparación',
    body: 'Pendientes, inconsistencias y necesidades particulares convertidos en estados accionables antes del evento.',
  },
  {
    icon: ScanLine,
    title: 'Accesos',
    body: 'Validación de ingreso, check-in y manejo de excepciones, con la lógica sensible resuelta en el backend.',
  },
  {
    icon: Users,
    title: 'Equipo',
    body: 'Roles, permisos y vistas según responsabilidad, para que cada persona actúe sin depender del anfitrión.',
  },
  {
    icon: BarChart3,
    title: 'Reportes',
    body: 'Asistencia, estado de confirmaciones, incidencias y aprendizajes básicos para que cada evento mejore el siguiente.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidad',
    body: 'Se pide solo la información con un uso claro, con consentimiento y control de datos visibles cuando corresponde.',
  },
]

export default function ProductoPage() {
  return (
    <>
      <PageHero
        eyebrow="Plataforma de experiencia de invitados"
        title="Todo lo que necesitás para preparar cada llegada,"
        highlight="en un solo lugar."
        description="Alista reúne invitaciones, confirmaciones, invitados, accesos, equipo y reportes. En lugar de acumular datos, los convierte en preparación concreta para recibir con claridad."
        primaryCta={{ href: '/demo', label: 'Solicitar demo' }}
        secondaryCta={{ href: '/como-funciona', label: 'Ver cómo funciona' }}
      />

      <Section
        eyebrow="Módulos"
        title="Una base que acompaña todo el recorrido del invitado."
        muted
      >
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon
            return (
              <div
                key={mod.title}
                className="rounded-3xl border border-border/70 bg-card p-6 shadow-[0_18px_50px_rgba(22,33,90,0.08)]"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-event-surface text-primary ring-1 ring-primary/15">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{mod.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{mod.body}</p>
              </div>
            )
          })}
        </div>
      </Section>

      <Section
        eyebrow="Cómo pensamos el producto"
        title="Pedir solo lo que tenga un uso claro."
        description="Cada dato que se solicita debe convertirse en una acción o una alerta comprensible. Priorizamos pendientes y decisiones reales por sobre paneles decorativos, y mantenemos un lenguaje respetuoso: una persona no es un registro a procesar."
      />

      <ClosingCta
        title="Recibir mejor empieza mucho antes de la llegada."
        description="Todo listo para que el anfitrión pueda estar presente."
      />
    </>
  )
}

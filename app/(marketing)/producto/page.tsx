import { CalendarCheck, Users, Mail, Wallet, ScanLine, Gauge, ShieldCheck, Sparkles } from 'lucide-react'
import { PageHero, Section, ClosingCta } from '@/components/marketing/sections'

export const metadata = {
  title: 'Producto',
  description:
    'Eventos, invitados, invitaciones, pago vinculado, acceso, cupo, equipo y experiencia. La plataforma que vincula invitación, pago y acceso en fiestas privadas con cupo.',
}

const MODULES = [
  {
    icon: CalendarCheck,
    title: 'Eventos',
    body: 'Creá y administrá cada fiesta con su fecha, lugar, cupo y tipos de acceso.',
  },
  {
    icon: Users,
    title: 'Invitados y acompañantes',
    body: 'Invitados nominados y sus acompañantes, con categorías, estados y contexto de acceso.',
  },
  {
    icon: Mail,
    title: 'Invitaciones',
    body: 'Un enlace seguro que se abre desde WhatsApp, sin instalar nada ni crear una cuenta.',
  },
  {
    icon: Wallet,
    title: 'Pago vinculado',
    body: 'Diseñado para asociar cada aporte a una persona y distinguirlo de una captura reenviada.',
  },
  {
    icon: ScanLine,
    title: 'Acceso y puerta',
    body: 'QR único por invitado, check-in móvil, búsqueda manual y excepciones con autorización.',
  },
  {
    icon: Gauge,
    title: 'Cupo en tiempo real',
    body: 'Aforo, confirmaciones e ingresos a la vista, con la lógica sensible resuelta en el backend.',
  },
  {
    icon: Sparkles,
    title: 'Experiencia',
    body: 'Trivia, música, saludos y personalización opcionales, para que la invitación se sienta propia.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacidad',
    body: 'Se pide solo la información con un uso claro, con consentimiento y cuidado de datos de menores.',
  },
]

export default function ProductoPage() {
  return (
    <>
      <PageHero
        eyebrow="El producto"
        title="Invitación, pago y acceso,"
        highlight="en una sola plataforma."
        description="Alista reúne el recorrido completo de una fiesta privada con cupo: invitar, identificar, vincular el pago, emitir el acceso y validar en la puerta. La capa de experiencia mantiene el tono personal de la celebración."
        primaryCta={{ href: '/demo', label: 'Solicitar demo' }}
        secondaryCta={{ href: '/como-funciona', label: 'Ver cómo funciona' }}
      />

      <Section
        eyebrow="Módulos"
        title="Una base que conecta persona, pago, acceso y cupo."
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
        title="Cada función refuerza una relación."
        description="Toda función nueva debe fortalecer al menos una de estas relaciones: invitado e identidad, identidad y pago, pago y acceso, acceso y cupo, o invitación y experiencia. Si no fortalece ninguna, no pertenece al núcleo. No construimos un editor libre ni sumamos plantillas por cantidad: preferimos una operación confiable a un panel decorativo."
      />

      <ClosingCta
        title="Abrí la fiesta sin abrir un problema."
        description="Conservá el carácter personal de la celebración mientras profesionalizás su apertura."
      />
    </>
  )
}

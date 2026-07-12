import { DoorOpen, PartyPopper, Sparkles } from 'lucide-react'

/**
 * Las tres superficies de Alista, cada una con su promesa emocional:
 * - Invitacion: la experiencia personal del invitado.
 * - Panel / puerta: delegar el estres de controlar el acceso.
 * - Totem: la bienvenida calida que recibe con la foto del invitado.
 *
 * Cada tarjeta lleva un mini-mockup construido con estilos, no una captura, para
 * sugerir la pantalla sin prometer de mas.
 */

function InvitationMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="relative h-20 bg-gradient-to-br from-brand-cyan via-primary to-admin-navy">
        <span className="absolute left-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Estás invitada
        </span>
      </div>
      <div className="-mt-6 px-4 pb-4">
        <span className="grid size-12 place-items-center rounded-full border-4 border-card bg-event-surface font-display text-sm font-semibold text-primary">
          SG
        </span>
        <p className="mt-2 font-display text-sm font-semibold text-foreground">Sofía cumple 15</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Trivia
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Tu canción
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Saludo
          </span>
        </div>
        <div className="mt-3 rounded-lg bg-primary py-1.5 text-center text-[11px] font-semibold text-primary-foreground">
          Confirmar asistencia
        </div>
      </div>
    </div>
  )
}

function DoorMock() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Acceso válido
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">Cupo 184/220</span>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-full bg-event-surface text-[11px] font-semibold text-primary">
          ML
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">Mateo Ledesma</p>
          <p className="truncate text-[10px] text-muted-foreground">Pago confirmado · +1</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <span className="rounded-md bg-emerald-50 py-1 text-center text-[9px] font-semibold text-emerald-700">
          Habilitar
        </span>
        <span className="rounded-md bg-secondary py-1 text-center text-[9px] font-semibold text-muted-foreground">
          Buscar
        </span>
        <span className="rounded-md bg-amber-50 py-1 text-center text-[9px] font-semibold text-amber-700">
          Excepción
        </span>
      </div>
    </div>
  )
}

function TotemMock() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-admin-navy to-primary p-4 text-center text-white">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
        Bienvenida
      </p>
      <span className="mx-auto mt-3 grid size-14 place-items-center rounded-full border-4 border-white/20 bg-white/10 font-display text-lg font-semibold">
        SG
      </span>
      <p className="mt-2 font-display text-base font-semibold">¡Bienvenida, Sofía!</p>
      <p className="text-[10px] text-white/70">Nos alegra que estés acá</p>
    </div>
  )
}

const SURFACES = [
  {
    icon: Sparkles,
    eyebrow: 'La invitación',
    title: 'Una experiencia, no un formulario.',
    body: 'El invitado abre una invitación personal desde WhatsApp: confirma, juega la trivia, deja su saludo y elige su canción. Se siente esperado antes de llegar.',
    mock: <InvitationMock />,
  },
  {
    icon: DoorOpen,
    eyebrow: 'El panel y la puerta',
    title: 'Delegá el estrés de la puerta.',
    body: 'El equipo valida en segundos, reconoce duplicados y resuelve excepciones sin llamarte. Vos ves el cupo y los pagos en tiempo real, sin tocar la puerta.',
    mock: <DoorMock />,
  },
  {
    icon: PartyPopper,
    eyebrow: 'El totem',
    title: 'Una bienvenida que emociona.',
    body: 'Al entrar, una pantalla recibe a cada invitado con su nombre y su foto. La acreditación deja de ser un trámite y se vuelve parte de la fiesta.',
    mock: <TotemMock />,
  },
]

export function ProductSurfaces() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Una plataforma, tres momentos
        </p>
        <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Cuida la experiencia de punta a punta.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {SURFACES.map((surface) => {
          const Icon = surface.icon
          return (
            <div
              key={surface.title}
              className="flex flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-[0_18px_50px_rgba(22,33,90,0.08)]"
            >
              {surface.mock}
              <div className="mt-6">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <Icon className="size-4" strokeWidth={2} />
                  {surface.eyebrow}
                </p>
                <h3 className="mt-3 text-balance font-display text-xl font-semibold text-foreground">
                  {surface.title}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
                  {surface.body}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

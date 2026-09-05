import {
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  MessageCircle,
  QrCode,
  ReceiptText,
  Users,
} from 'lucide-react'

function InviteScene() {
  return (
    <div className="overflow-hidden rounded-[2.5rem_2.5rem_0.75rem_2.5rem] bg-[#171714] p-5 text-white shadow-[0_28px_70px_rgba(23,23,20,0.16)] sm:p-8">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <span className="grid size-10 place-items-center rounded-full bg-[#ff8b70] text-sm font-black text-black">E</span>
        <div>
          <p className="text-sm font-bold">Emilia</p>
          <p className="text-xs text-white/65">para Martina · Colegio</p>
        </div>
        <MessageCircle className="ml-auto size-4 text-[#d9ee73]" aria-hidden="true" />
      </div>
      <div className="ml-auto mt-7 max-w-[90%] rounded-[1.5rem_1.5rem_0.35rem_1.5rem] bg-[#d9ee73] p-4 text-[#171714]">
        <p className="text-sm font-semibold leading-6">Martu, te invito a mis 15 ✨</p>
        <div className="mt-3 rounded-2xl bg-[#f0eee8] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/65">Invitación personal</p>
          <p className="marketing-display mt-2 text-2xl font-black tracking-[-0.01em]">Emilia te invita.</p>
        </div>
      </div>
    </div>
  )
}

function ConfirmScene() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_150px] sm:items-stretch">
      <div className="rounded-[2.25rem] border border-black/10 bg-white/65 p-5 sm:p-7">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/65">Familia Pérez · Cena</p>
        <div className="mt-5 divide-y divide-black/10">
          {['María Pérez', 'Tomás Pérez', 'Juana Pérez'].map((name) => (
            <div key={name} className="flex items-center justify-between py-3.5 text-sm font-bold">
              {name}
              <span className="grid size-6 place-items-center rounded-full bg-[#173b36] text-white">
                <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-[#ffcfbf] px-4 py-3 text-xs font-bold">Juana · menú vegetariano</p>
      </div>
      <div className="flex min-h-40 flex-col justify-between rounded-[2.25rem_0.75rem_2.25rem_2.25rem] bg-[#c65035] p-5 text-white">
        <Users className="size-5" aria-hidden="true" />
        <div>
          <p className="marketing-display text-6xl font-black tracking-[-0.02em]">3</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white">confirmados</p>
        </div>
      </div>
    </div>
  )
}

function KnowScene() {
  const accessGroups = [
    { label: 'Cena', value: '86', color: 'bg-[#173b36] text-white' },
    { label: 'Trasnoche', value: '54', color: 'bg-[#d9ee73] text-[#171714]' },
    { label: 'Trasnoche con entrada', value: '23', color: 'bg-[#ff8b70] text-[#171714]' },
  ]

  return (
    <div className="overflow-hidden rounded-[0.75rem_2.5rem_2.5rem_2.5rem] border border-black/10 bg-[#e7ded0]">
      <div className="flex items-center justify-between gap-4 border-b border-black/10 px-5 py-4 sm:px-7">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/65">Escenario demo · quién viene</p>
        <span className="text-xs font-bold text-black/65">163 personas</span>
      </div>
      <div className="grid sm:grid-cols-3">
        {accessGroups.map((group) => (
          <div key={group.label} className={`${group.color} flex min-h-44 flex-col justify-between p-5 sm:p-6`}>
            <p className="max-w-32 text-xs font-black uppercase tracking-[0.14em]">{group.label}</p>
            <p className="marketing-display text-6xl font-black tracking-[-0.02em]">{group.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PrepareScene() {
  return (
    <div className="rounded-[2.5rem] bg-[#162c29] p-5 text-white shadow-[0_28px_70px_rgba(22,44,41,0.18)] sm:p-8">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d9ee73]">Necesita tu atención</p>
          <p className="marketing-display mt-3 text-4xl font-black tracking-[-0.015em]">Todavía estás a tiempo.</p>
        </div>
        <CircleAlert className="size-6 shrink-0 text-[#ff8b70]" aria-hidden="true" />
      </div>
      <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
        {[
          ['2 pagos pendientes', 'Revisar estado del pago'],
          ['3 nombres por completar', 'Consultar a los grupos'],
          ['1 restricción nueva', 'Avisar al salón'],
        ].map(([issue, action]) => (
          <div key={issue} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm font-bold">{issue}</p>
            <span className="inline-flex items-center gap-2 text-xs font-black text-[#d9ee73]">
              {action}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChargeScene() {
  const paymentFlow = [
    { icon: ReceiptText, label: 'Importe según acompañantes', detail: 'Tomás + Ana · 2 lugares con nombre' },
    { icon: Users, label: 'Pago confirmado para el grupo', detail: 'Cuenta receptora de la responsable' },
    { icon: QrCode, label: 'Acceso listo', detail: 'El estado del pago queda asociado' },
  ]

  return (
    <div className="rounded-[2.5rem_0.75rem_2.5rem_2.5rem] bg-[#d9ee73] p-5 text-[#171714] sm:p-8">
      <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/65">Escenario demo · pago revisado</p>
        <span className="rounded-full bg-[#171714] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">Resuelto</span>
      </div>
      <ol className="mt-7 grid gap-3">
        {paymentFlow.map((step, index) => {
          const Icon = step.icon

          return (
            <li key={step.label} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl bg-white/55 p-3.5">
              <span className="grid size-10 place-items-center rounded-xl bg-[#171714] text-white">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-black/65">{step.detail}</p>
              </div>
              <span className="text-xs font-black text-black/65">0{index + 1}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ReceiveScene() {
  return (
    <div className="grid overflow-hidden rounded-[0.75rem_2.5rem_2.5rem_2.5rem] bg-[#171714] text-white sm:grid-cols-[0.72fr_1.28fr]">
      <div className="flex min-h-52 flex-col justify-between bg-[#c65035] p-5 sm:p-7">
        <Clock3 className="size-5" aria-hidden="true" />
        <div>
          <p className="marketing-display text-5xl font-black tracking-[-0.02em]">00:34</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-white">Llegada · Familia Pérez</p>
        </div>
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm font-black">3 personas · Cena</p>
            <p className="mt-1 text-xs text-white/65">Un grupo, un acceso</p>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-[#d9ee73] text-black">
            <Check className="size-4" strokeWidth={3} aria-hidden="true" />
          </span>
        </div>
        <ul className="mt-3 divide-y divide-white/10">
          {['María', 'Tomás', 'Juana'].map((name) => (
            <li key={name} className="flex items-center justify-between py-3 text-sm font-bold">
              {name} Pérez
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#d9ee73]">Ingresa</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const journeyStages = [
  {
    number: '01',
    title: 'Diseñamos',
    detail: 'Definimos el estilo con ustedes y revisamos la invitación antes de compartirla. Madre e hija envían desde sus propios WhatsApp.',
    scene: InviteScene,
    reverse: false,
  },
  {
    number: '02',
    title: 'Configuramos',
    detail: 'Preparamos los grupos, acompañantes y datos que necesitan pedir. Las respuestas llegan a una misma lista para organizar la fiesta.',
    scene: ConfirmScene,
    reverse: true,
  },
  {
    number: '03',
    title: 'Ordenamos',
    detail: 'Acordamos a quién invitar a la cena o al trasnoche, quién puede llevar acompañantes y qué invitados deben pagar.',
    scene: KnowScene,
    reverse: false,
  },
  {
    number: '04',
    title: 'Revisamos',
    detail: 'En los encuentros acordados revisamos lo que falta y definimos quién lo resuelve. El acompañamiento también está en esos detalles.',
    scene: PrepareScene,
    reverse: true,
  },
  {
    number: '05',
    title: 'Vinculamos',
    detail: 'Si hay entradas pagas, ayudamos a configurar Mercado Pago a nombre de la responsable. El importe contempla los lugares completados con nombre; la disponibilidad del dinero depende de Mercado Pago.',
    scene: ChargeScene,
    reverse: false,
  },
  {
    number: '06',
    title: 'Ensayamos',
    detail: 'Capacitamos a recepción con sus celulares asignados. El grupo completo se registra desde el teléfono; el recibidor opcional acompaña después del control.',
    scene: ReceiveScene,
    reverse: true,
  },
] as const

export function JourneyScenes() {
  return (
    <ol className="mt-20 space-y-24 sm:space-y-32">
      {journeyStages.map((stage) => {
        const Scene = stage.scene

        return (
          <li key={stage.number} className="grid gap-8 border-t border-black/20 pt-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-16">
            <div className={stage.reverse ? 'lg:order-2' : undefined}>
              <p className="text-xs font-black text-[#9d3524]">{stage.number}</p>
              <h3 className="marketing-display mt-5 text-5xl font-black tracking-[-0.01em] sm:text-6xl">{stage.title}</h3>
              <p className="mt-5 max-w-md text-sm leading-6 text-black/55">{stage.detail}</p>
            </div>
            <div className={stage.reverse ? 'lg:order-1' : undefined}>
              <Scene />
              <p className="mt-4 text-xs leading-5 text-black/60">Escena ilustrativa con datos ficticios.</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

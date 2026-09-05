import { Check, HeartHandshake, IdCard, QrCode, Sparkles, Users } from 'lucide-react'

const familyMoments = [
  {
    number: '01',
    icon: Sparkles,
    title: 'Tiene identidad',
    detail: 'Definimos el estilo con ustedes y revisamos el diseño antes de compartirlo.',
    tone: 'bg-[#213480] text-white',
  },
  {
    number: '02',
    icon: Users,
    title: 'Sabemos quién confirmó',
    detail: 'Madre e hija invitan desde sus teléfonos. Las respuestas quedan en la misma lista.',
    tone: 'bg-[#ffcfbf] text-[#171714]',
  },
  {
    number: '03',
    icon: HeartHandshake,
    title: 'Vemos qué falta',
    detail: 'Revisamos confirmaciones, nombres y pagos pendientes en los encuentros acordados.',
    tone: 'bg-[#162c29] text-white',
  },
  {
    number: '04',
    icon: IdCard,
    title: 'El acceso está listo',
    detail: 'Preparamos horarios y tipos de invitado; vinculamos los pagos cuando corresponde.',
    tone: 'bg-[#d9ee73] text-[#171714]',
  },
  {
    number: '05',
    icon: QrCode,
    title: 'Ensayamos la llegada',
    detail: 'Capacitamos a recepción con los celulares que la organización usará esa noche.',
    tone: 'bg-[#c65035] text-white',
  },
] as const

export function FamilyClosingJourney() {
  return (
    <section className="bg-[#e7ded0] px-5 py-24 sm:px-8 sm:py-32 lg:px-14">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9c3926]">Para tu familia</p>
            <p className="mt-5 max-w-md text-base leading-7 text-black/65">
              El acompañamiento tiene entregas concretas, responsables y momentos de revisión acordados.
            </p>
          </div>
          <h2 className="marketing-display text-[clamp(3.1rem,6vw,6rem)] font-black leading-[0.9] tracking-[-0.01em]">
            Lo que preparás antes te deja disfrutar más.
          </h2>
        </div>

        <ol className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {familyMoments.map((moment) => {
            const Icon = moment.icon

            return (
              <li key={moment.number} className={`${moment.tone} flex min-h-72 flex-col rounded-[2rem] p-5 sm:p-6`}>
                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-10 place-items-center rounded-2xl bg-current/10 ring-1 ring-current/15">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="marketing-display text-xl font-black">{moment.number}</span>
                </div>
                <div className="mt-auto">
                  <p className="marketing-display text-3xl font-black leading-none tracking-[-0.01em]">{moment.title}</p>
                  <p className="mt-4 text-xs leading-5">{moment.detail}</p>
                </div>
                <Check className="mt-5 size-4 opacity-55" strokeWidth={3} aria-hidden="true" />
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

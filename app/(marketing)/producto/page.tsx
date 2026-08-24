import { ClosingCta, PageHero, Section } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Alista: invitaciones, preparación y acceso para tus 15',
  description:
    'Conocé cómo Alista conecta invitaciones, confirmaciones, grupos, preparación y llegada en una fiesta de 15.',
  path: '/producto',
})

const MOMENTS = [
  {
    number: '01',
    eyebrow: 'Invitación',
    title: 'Cada persona entra al recorrido desde un lugar propio.',
    body: 'La invitación se abre desde WhatsApp, sin instalar una app. Desde ahí, cada invitado puede confirmar, completar su grupo y responder lo que la fiesta necesita saber.',
    items: ['Invitación con identidad', 'Confirmaciones y grupos', 'Datos necesarios, sin pasos de más'],
    tone: 'bg-[#d9ee73] text-[#171714]',
  },
  {
    number: '02',
    eyebrow: 'Preparación',
    title: 'Lo que falta se vuelve visible antes de la fiesta.',
    body: 'Alista reúne las respuestas y organiza los pendientes para que la familia y el equipo sepan qué necesita atención, sin reconstruir la historia desde mensajes y planillas.',
    items: ['Pendientes accionables', 'Grupos y restricciones', 'Estados compartidos por el equipo'],
    tone: 'bg-[#162c29] text-white',
  },
  {
    number: '03',
    eyebrow: 'Llegada',
    title: 'La recepción recibe contexto, no una lista suelta.',
    body: 'Los accesos y los grupos llegan preparados para que el equipo pueda buscar, validar y resolver la llegada con un criterio compartido.',
    items: ['Accesos preparados', 'Ingreso individual o grupal', 'Búsqueda y estados claros'],
    tone: 'bg-[#c65035] text-white',
  },
]

const RELATIONSHIPS = [
  ['Invitación', 'Identidad', 'La experiencia empieza reconociendo a quién fue invitado.'],
  ['Identidad', 'Grupo', 'Acompañantes y respuestas quedan vinculados a la persona correcta.'],
  ['Preparación', 'Llegada', 'Lo resuelto antes evita improvisaciones en recepción.'],
  ['Equipo', 'Criterio', 'Todos trabajan sobre los mismos estados y decisiones.'],
]

export default function ProductoPage() {
  return (
    <>
      <PageHero
        eyebrow="El producto"
        title="Una fiesta no empieza"
        highlight="cuando se abren las puertas."
        description="Alista acompaña todo lo que pasa antes: la invitación, las respuestas, los grupos y la preparación que hace posible una llegada más simple."
        primaryCta={{ href: '/demo', label: 'Verlo para mis 15' }}
        secondaryCta={{ href: '/como-funciona', label: 'Recorrer cómo funciona' }}
      />

      <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c65035]">Tres momentos, una misma historia</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {MOMENTS.map((moment) => (
              <article key={moment.number} className={`flex min-h-[500px] flex-col justify-between rounded-[2.25rem] p-7 sm:p-9 ${moment.tone}`}>
                <div>
                  <div className="flex items-center justify-between gap-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">{moment.eyebrow}</p>
                    <span className="marketing-display text-3xl font-black opacity-35">{moment.number}</span>
                  </div>
                  <h2 className="marketing-display mt-10 text-[clamp(2.3rem,3.25vw,3.35rem)] font-black leading-[0.94] tracking-[-0.005em]">
                    {moment.title}
                  </h2>
                  <p className="mt-6 text-sm leading-6 opacity-65">{moment.body}</p>
                </div>
                <ul className="mt-10 divide-y divide-current/15 border-y border-current/15">
                  {moment.items.map((item) => (
                    <li key={item} className="py-3 text-xs font-black uppercase tracking-[0.12em] opacity-70">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Section
        eyebrow="Cómo pensamos Alista"
        title="Cada función tiene que fortalecer una relación."
        description="No sumamos herramientas para llenar un panel. El núcleo existe para que la información conserve su contexto desde la invitación hasta la recepción."
        muted
      >
        <div className="mt-14 divide-y divide-black/12 border-y border-black/12">
          {RELATIONSHIPS.map(([from, to, detail], index) => (
            <div key={from} className="grid gap-3 py-6 sm:grid-cols-[3rem_0.65fr_0.65fr_1.3fr] sm:items-center">
              <span className="marketing-display text-2xl font-black text-[#c65035]">0{index + 1}</span>
              <p className="text-sm font-black">{from}</p>
              <p className="text-sm font-black text-[#213480]">{to}</p>
              <p className="text-sm leading-6 text-black/55">{detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <ClosingCta
        title="Primero entendelo. Después decidí."
        description="La demo muestra cómo se vería Alista en tu fiesta y no inicia un pago ni crea un evento."
      />
    </>
  )
}

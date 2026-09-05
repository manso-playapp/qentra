import { ClosingCta, PageHero, Section } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Diseño y acompañamiento para tus 15',
  description:
    'Una invitación con identidad y acompañamiento para preparar invitados, trasnoche, pagos y recepción. Conocé qué podés delegar en Alista.',
  path: '/producto',
})

const MOMENTS = [
  {
    number: '01',
    eyebrow: 'Diseño propio',
    title: 'Una invitación que se sienta suya.',
    body: 'Escuchamos cómo imagina sus 15 y trabajamos la identidad de la invitación: imágenes, colores, mensajes y detalles. Ustedes revisan la propuesta en el celular antes de compartirla.',
    items: ['Dirección visual acordada', 'Revisiones definidas', 'Madre e hija invitan desde sus WhatsApp'],
    tone: 'bg-[#d9ee73] text-[#171714]',
  },
  {
    number: '02',
    eyebrow: 'Preparación acompañada',
    title: 'Personas, lugares y pagos, relacionados.',
    body: 'La familia decide a quién invita y cuántos acompañantes habilita. Preparamos esa lista con nombres, horarios y tipos de acceso. Si el trasnoche lleva entrada paga, configuramos los importes y revisamos los pendientes con ustedes.',
    items: ['Acompañantes autorizados', 'Cobros a la cuenta de la responsable', 'Pendientes con una próxima acción'],
    tone: 'bg-[#162c29] text-white',
  },
  {
    number: '03',
    eyebrow: 'Recepción ensayada',
    title: 'Un equipo que sabe cómo recibir.',
    body: 'Antes de la fiesta probamos el circuito con quienes van a recibir y con los celulares asignados. Dejamos acordado quién resuelve cada consulta y en qué horario estará disponible el soporte de Alista.',
    items: ['Personal de la organización', 'Equipos y conexión probados', 'Referente y soporte acordados'],
    tone: 'bg-[#c65035] text-white',
  },
]

const RELATIONSHIPS = [
  ['Su estilo', 'Una propuesta visual', 'Ustedes aprueban el diseño y las revisiones se acuerdan antes de empezar.'],
  ['Sus invitados', 'Una lista preparada', 'La responsable define los accesos, los lugares para acompañantes y las reglas de su fiesta.'],
  ['Sus pendientes', 'Seguimiento acordado', 'Revisamos confirmaciones, nombres y pagos en los encuentros incluidos en la propuesta.'],
  ['Su recepción', 'Un ensayo previo', 'El personal lo aporta la organización. Alista configura, capacita y presta el soporte contratado.'],
]

export default function ProductoPage() {
  return (
    <>
      <PageHero
        eyebrow="Qué hacemos por tu fiesta"
        title="Que sus 15 tengan su estilo."
        highlight="Y ustedes, con quién prepararlos."
        description="Diseñamos la invitación y acompañamos las decisiones sobre invitados, acompañantes y recepción. La familia conserva el control y puede delegar tareas concretas antes de esa noche."
        primaryCta={{ href: '/demo', label: 'Consultar disponibilidad' }}
        secondaryCta={{ href: '/como-funciona', label: 'Recorrer cómo funciona' }}
      />

      <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Tres partes del servicio</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {MOMENTS.map((moment) => (
              <article key={moment.number} className={`flex min-h-[500px] flex-col justify-between rounded-[2.25rem] p-7 sm:p-9 ${moment.tone}`}>
                <div>
                  <div className="flex items-center justify-between gap-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em]">{moment.eyebrow}</p>
                    <span className="marketing-display text-3xl font-black">{moment.number}</span>
                  </div>
                  <h2 className="marketing-display mt-10 text-[clamp(2.3rem,3.25vw,3.35rem)] font-black leading-[0.94] tracking-[-0.005em]">
                    {moment.title}
                  </h2>
                  <p className="mt-6 text-sm leading-6">{moment.body}</p>
                </div>
                <ul className="mt-10 divide-y divide-current/15 border-y border-current/15">
                  {moment.items.map((item) => (
                    <li key={item} className="py-3 text-xs font-black uppercase tracking-[0.12em]">
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
        eyebrow="Qué queda en sus manos"
        title="Ustedes deciden. Nosotros ayudamos a prepararlo."
        description="La responsable contrata y conserva su evento. Antes de empezar dejamos por escrito el diseño, las tareas, las revisiones y la ventana de soporte incluidos en el presupuesto."
        muted
      >
        <div className="mt-14 divide-y divide-black/12 border-y border-black/12">
          {RELATIONSHIPS.map(([from, to, detail], index) => (
            <div key={from} className="grid gap-3 py-6 sm:grid-cols-[3rem_0.65fr_0.65fr_1.3fr] sm:items-center">
              <span className="marketing-display text-2xl font-black text-[#9c3926]">0{index + 1}</span>
              <p className="text-sm font-black">{from}</p>
              <p className="text-sm font-black text-[#213480]">{to}</p>
              <p className="text-sm leading-6 text-black/65">{detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Una bienvenida adicional"
        title="El recibidor acompaña la llegada."
        description="Si quieren sumar una pantalla de bienvenida, la cotizamos como adicional. Se ubica después del control: recepción valida desde los celulares y no espera una animación para dejar pasar. El alquiler y la instalación de equipos se detallan en la propuesta."
        muted
      />

      <ClosingCta
        title="Contanos cómo imaginan esos 15."
        description="Con la fecha, el lugar y lo que quieren delegar, revisamos disponibilidad y armamos una propuesta para su fiesta."
        primary={{ href: '/demo', label: 'Consultar disponibilidad' }}
        secondary={{ href: '/autogestion', label: 'Prefiero prepararlo por mi cuenta' }}
      />
    </>
  )
}

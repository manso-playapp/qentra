import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ClosingCta, PageHero } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Cómo contratar personalización y acompañamiento',
  description: 'Una propuesta para sus 15 con diseño, preparación de invitados y recepción, entregas acordadas y precio total antes de contratar.',
  path: '/precios',
})

const DELIVERIES = [
  ['Diseño con ustedes', 'Una dirección visual para la invitación, sus textos y su recorrido. Ustedes revisan y aprueban la versión que se comparte.'],
  ['La lista preparada', 'Configuración de tipos de invitado, horarios y acompañantes. Si hay entrada paga, preparamos el cobro en la cuenta de la responsable.'],
  ['Seguimiento de pendientes', 'Revisiones de confirmaciones, nombres y pagos. Cada encuentro termina con acciones concretas y responsables definidos.'],
  ['Recepción ensayada', 'Capacitación del equipo designado, prueba de celulares y criterios para resolver dudas. El soporte se reserva para los horarios acordados.'],
]

const VARIABLES = [
  ['01', 'Fecha y lugar', 'Contanos cuándo será la fiesta y en qué ciudad o salón. Revisamos disponibilidad y condiciones de la recepción.'],
  ['02', 'Invitados y trasnoche', 'Cantidad prevista, acompañantes y accesos con o sin pago. La familia define quién puede asistir.'],
  ['03', 'Qué quieren delegar', 'Diseño, configuración, seguimiento y preparación de recepción. Acordamos el trabajo que va a realizar Alista.'],
  ['04', 'La propuesta completa', 'Recibís entregas, revisiones, calendario, cobertura de soporte y precio total. Los adicionales se identifican por separado.'],
]

export default function PreciosPage() {
  return (
    <>
      <PageHero
        eyebrow="Cómo contratar"
        title="Una propuesta para sus 15."
        highlight="Con el trabajo y el precio claros."
        description="Cada fiesta necesita una preparación distinta. Contanos la fecha, el lugar y cómo imaginan el trasnoche. Te presentamos una propuesta con las entregas, los tiempos y el precio total antes de contratar."
        primaryCta={{ href: '/demo', label: 'Consultar para mi fecha' }}
      />
      <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-[1320px] rounded-[2.25rem] bg-[#d9ee73] p-7 sm:p-12">
          <p className="text-xs font-black uppercase tracking-[0.22em]">Personalización y acompañamiento</p>
          <h2 className="marketing-display mt-6 max-w-4xl text-[clamp(2.5rem,4vw,4rem)] font-black leading-[0.95]">Una invitación propia. Una preparación compartida.</h2>
          <p className="mt-6 max-w-2xl text-base leading-7">Trabajamos con la madre y la quinceañera para llevar su estilo a la invitación y dejar preparada la información que necesita la recepción.</p>
          <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {DELIVERIES.map(([title, body]) => (
              <div key={title} className="border-t border-black/20 pt-5">
                <dt className="text-lg font-black">{title}</dt>
                <dd className="mt-3 text-sm leading-6 text-black/75">{body}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 border-t border-black/20 pt-6">
            <p className="max-w-3xl text-sm leading-6">La propuesta incluye el uso de Alista para esa fiesta. La activación ya forma parte del servicio contratado. Las revisiones de diseño y los horarios de acompañamiento quedan acordados desde el inicio.</p>
            <Link href="/demo" className="mt-7 inline-flex min-h-12 items-center gap-4 rounded-full bg-[#171714] px-6 text-sm font-black text-white hover:bg-[#213480] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">Consultar para mi fecha <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
      <section className="bg-[#162c29] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9ee73]">Antes de contratar</p>
            <h2 className="marketing-display mt-5 text-[clamp(2.6rem,4.25vw,4.25rem)] font-black leading-[0.95]">Empezamos por su fiesta.</h2>
          </div>
          <ol className="divide-y divide-white/15 border-y border-white/15">
            {VARIABLES.map(([number, title, body]) => (
              <li key={number} className="grid gap-4 py-6 sm:grid-cols-[3rem_0.65fr_1.35fr]">
                <span className="marketing-display text-2xl font-black text-[#d9ee73]">{number}</span>
                <h3 className="text-sm font-black">{title}</h3>
                <p className="text-sm leading-6 text-white/70">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-2">
          <div>
            <h2 className="marketing-display text-3xl font-black">Equipos y recibidor, según lo que necesiten.</h2>
            <p className="mt-5 text-sm leading-7 text-black/65">La familia, el salón o la productora aporta al personal de recepción. Acordamos quién lleva los celulares, cargadores y conexión. Si necesitan alquiler de equipos, instalación o un recibidor digital, los cotizamos como adicionales con sus responsables.</p>
          </div>
          <div>
            <h2 className="marketing-display text-3xl font-black">El servicio y las entradas tienen destinos distintos.</h2>
            <p className="mt-5 text-sm leading-7 text-black/65">El presupuesto corresponde al trabajo de Alista. Si algunos invitados pagan su entrada, ese dinero se recibe en la cuenta de Mercado Pago de la responsable. Alista no cobra comisión sobre esas entradas; los plazos y comisiones de Mercado Pago dependen de la cuenta.</p>
          </div>
        </div>
        <div id="autogestion" className="mx-auto mt-12 max-w-[1180px] scroll-mt-24 border-t border-black/15 pt-7 text-sm leading-6">
          <p>¿Preferís prepararlo por tu cuenta? <Link href="/autogestion" className="font-bold underline underline-offset-4">Conocé la plataforma autogestiva y su precio.</Link></p>
        </div>
      </section>
      <ClosingCta title="Empecemos por una conversación." description="Decinos qué quieren vivir esa noche y qué preparación necesitan delegar. Revisamos la disponibilidad y les proponemos cómo acompañarlas." primary={{ href: '/demo', label: 'Consultar para mi fecha' }} secondary={{ href: '/como-funciona', label: 'Conocer el proceso' }} />
    </>
  )
}

import Link from 'next/link'
import { Plus } from 'lucide-react'

const FAQS = [
  {
    q: '¿Qué preparación podemos delegar en Alista?',
    a: 'El diseño de la invitación, la configuración de invitados y accesos, la revisión de pendientes y la preparación del equipo de recepción. En la propuesta acordamos qué entregamos, cuántas revisiones hacemos y en qué horarios acompañamos a la familia.',
  },
  {
    q: '¿Cuánto cuesta la personalización y el acompañamiento?',
    a: 'Preparamos un presupuesto según la fecha, el lugar y el trabajo que quieran delegar. Antes de contratar conocen el precio total, las entregas y los adicionales. El uso de Alista para esa fiesta forma parte del servicio acompañado.',
  },
  {
    q: '¿Podemos elegir el estilo de la invitación?',
    a: 'Sí. Conversamos con madre e hija, trabajamos una dirección visual y presentamos una versión para revisar en el celular. Colores, imágenes, textos y recorrido se preparan con ustedes. Las rondas de ajustes quedan acordadas en la propuesta.',
  },
  {
    q: '¿Sirve si algunos invitados pagan el trasnoche?',
    a: 'Sí. La familia decide a quién invitar y qué acceso corresponde a cada grupo. En las invitaciones pagas, cada lugar de acompañante completado con nombre suma su importe. El estado del pago queda asociado a esa invitación; una captura reenviada no lo reemplaza.',
  },
  {
    q: '¿Cualquiera puede comprar una entrada?',
    a: 'La familia define los invitados, los tipos de acceso y los acompañantes permitidos. Un trasnoche con entrada paga sigue siendo una fiesta con una lista de invitados; no se convierte en una venta de entradas abierta al público.',
  },
  {
    q: '¿Quién recibe el dinero de las entradas?',
    a: 'La responsable conecta su cuenta de Mercado Pago y recibe allí los pagos. Ese dinero es independiente del servicio de Alista. Las comisiones y la disponibilidad de los fondos dependen de Mercado Pago y de la cuenta. Si no hay entradas pagas, no hace falta conectarla para los invitados.',
  },
  {
    q: '¿Madre e hija pueden invitar desde sus propios teléfonos?',
    a: 'Sí. Cada una comparte los links desde su WhatsApp personal y conserva su agenda. Alista prepara el mensaje y reúne las respuestas en el evento. Los invitados abren la invitación en el navegador, sin instalar una app ni crear una cuenta.',
  },
  {
    q: '¿Quién aporta a los recepcionistas y los celulares?',
    a: 'La familia, el salón o la productora designa al personal y a un referente para resolver dudas. Acordamos quién aporta los celulares, cargadores y conexión, y ensayamos con esos equipos. Si necesitan alquilarlos, se cotizan aparte.',
  },
  {
    q: '¿Es necesario contratar una pantalla o un tótem?',
    a: 'Es opcional. La recepción consulta y registra el ingreso desde el celular. El recibidor digital se coloca después del control para dar la bienvenida; no autoriza el paso ni hay que esperar su animación para entrar.',
  },
  {
    q: '¿Qué pasa si se corta la conexión?',
    a: 'Alista necesita conexión para consultar y registrar ingresos. Por eso se prueban la red y los equipos antes de la fiesta y se acuerda cómo actuar con el referente de recepción. Actualmente no ofrecemos registro de ingresos sin conexión.',
  },
  {
    q: '¿Podemos usar Alista si la fiesta no tiene entradas pagas?',
    a: 'Sí. La invitación personalizada, las confirmaciones, los acompañantes y la preparación de recepción también sirven para una fiesta privada sin cobro a invitados. La propuesta se adapta a lo que necesiten preparar.',
  },
]

export function FaqSection() {
  return (
    <section className="bg-[#e7ded0] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Preguntas frecuentes</p>
          <h2 className="marketing-display mt-5 max-w-lg text-[clamp(2.6rem,4.25vw,4.25rem)] font-black leading-[0.92] tracking-[-0.005em] text-[#171714]">
            Lo que conviene saber antes de contratar.
          </h2>
          <p className="mt-6 text-sm leading-6 text-black/65">¿Querés encargarte de la preparación? <Link href="/autogestion" className="font-bold underline underline-offset-4">Conocé la opción autogestiva y su precio.</Link></p>
        </div>

        <div className="border-t border-black/15">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group border-b border-black/15 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#213480] focus-visible:ring-inset">
                <span className="text-sm font-black leading-6 text-[#171714] sm:text-base">{faq.q}</span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-black/20 transition group-open:bg-[#171714] group-open:text-white">
                  <Plus className="size-4 transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-14 text-sm leading-6 text-black/58">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

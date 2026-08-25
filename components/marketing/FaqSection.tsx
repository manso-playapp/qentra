import { Plus } from 'lucide-react'

const FAQS = [
  {
    q: '¿El invitado tiene que instalar una app o crear una cuenta?',
    a: 'No. La invitación se abre desde WhatsApp en el navegador. La persona puede confirmar, sumar acompañantes y completar lo necesario sin instalar nada ni registrarse.',
  },
  {
    q: '¿Cómo funciona el aporte o pago?',
    a: 'Alista está diseñado para vincular cada aporte con la persona correspondiente y diferenciar su estado de una simple captura. Durante los pilotos trabajamos con conciliación acompañada.',
  },
  {
    q: '¿Quién contrata Alista?',
    a: 'Podemos conversar con una familia que organiza sus 15 o con planners, salones y productoras que quieren incorporar Alista a su servicio. El recorrido y la propuesta cambian según cada caso.',
  },
  {
    q: '¿La invitación puede tener la identidad de la fiesta?',
    a: 'Sí. Trabajamos con un sistema guiado de colores, portada, fotos y mensajes para que la experiencia se sienta propia sin volverse difícil de administrar.',
  },
  {
    q: '¿Qué pasa si la conectividad es inestable en la recepción?',
    a: 'La estrategia se define en cada implementación según el lugar y su infraestructura. No prometemos operación sin conexión sin haber validado antes las condiciones reales del salón.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: 'Todavía no publicamos paquetes genéricos. Primero entendemos la fiesta, el volumen y el alcance; después armamos una propuesta clara para esa operación.',
  },
]

export function FaqSection() {
  return (
    <section className="bg-[#e7ded0] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Preguntas frecuentes</p>
          <h2 className="marketing-display mt-5 max-w-lg text-[clamp(2.6rem,4.25vw,4.25rem)] font-black leading-[0.92] tracking-[-0.005em] text-[#171714]">
            Antes de empezar, hablemos claro.
          </h2>
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

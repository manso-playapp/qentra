import { ContactForm } from '@/components/marketing/ContactForm'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const legacyMetadata = {
  title: 'Contacto',
  description: 'Hablá con el equipo de Alista. Respondemos con claridad y sin vueltas.',
}

export const metadata = createMarketingMetadata({
  title: 'Contacto',
  description: 'Habla con el equipo de Alista para organizar invitados, pagos y accesos de tu evento.',
  path: '/contacto',
})

export default function ContactoPage() {
  return (
    <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c65035]">Contacto</p>
          <h1 className="marketing-display mt-6 max-w-xl text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.91] tracking-[-0.005em] text-[#171714]">
            Empecemos por entender qué estás organizando.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-black/58">
            Puede ser una fiesta de 15, una propuesta piloto o una operación profesional. Contanos el contexto y te respondemos con claridad.
          </p>

          <div className="mt-12 border-y border-black/15">
            <a
              href="mailto:hola@alista.com.ar"
              className="grid gap-1 border-b border-black/15 py-5 transition hover:pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#213480] focus-visible:ring-inset"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/42">Email</span>
              <span className="text-sm font-black text-[#213480]">hola@alista.com.ar</span>
            </a>
            <div className="grid gap-1 py-5">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/42">Qué sigue</span>
              <span className="text-sm font-black text-[#171714]">Leemos el contexto antes de responder.</span>
            </div>
          </div>
        </div>

        <ContactForm subject="Consulta — Alista" cta="Enviar consulta" />
      </div>
    </section>
  )
}

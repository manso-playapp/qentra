import { ContactForm } from '@/components/marketing/ContactForm'
import { TrackedLink } from '@/components/marketing/TrackedLink'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Contacto',
  description:
    'Hablá con el equipo de Alista sobre tus 15 o sobre una operación profesional de eventos.',
  path: '/contacto',
})

export default function ContactoPage() {
  return (
    <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto grid w-full max-w-[1180px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Contacto</p>
          <h1 className="marketing-display mt-6 max-w-xl text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.91] tracking-[-0.005em] text-[#171714]">
            Empecemos por entender qué estás organizando.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-black/58">
            Contanos qué estás organizando para tus 15 y te respondemos con claridad sobre el recorrido que mejor se adapta a tu fiesta.
          </p>

          <div className="mt-12 border-y border-black/15">
            <TrackedLink
              href="mailto:hola@alista.com.ar"
              analytics={{
                name: 'contact_email_opened',
                properties: { source: 'contacto-page', audience: 'general' },
              }}
              className="grid gap-1 border-b border-black/15 py-5 transition hover:pl-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#213480] focus-visible:ring-inset"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">Email</span>
              <span className="text-sm font-black text-[#213480]">hola@alista.com.ar</span>
            </TrackedLink>
            <div className="grid gap-1 py-5">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">Qué sigue</span>
              <span className="text-sm font-black text-[#171714]">Leemos el contexto antes de responder.</span>
            </div>
          </div>
        </div>

        <ContactForm subject="Consulta — Alista" cta="Enviar consulta" source="contacto-page" />
      </div>
    </section>
  )
}

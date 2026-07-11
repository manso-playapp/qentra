import { Mail, MessageCircle } from 'lucide-react'
import { ContactForm } from '@/components/marketing/ContactForm'

export const metadata = {
  title: 'Contacto',
  description: 'Hablá con el equipo de Alista. Respondemos con claridad y sin vueltas.',
}

export default function ContactoPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Contacto
          </span>
          <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl">
            Hablemos de tu
            <span className="text-brand-cyan"> operación.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Escribinos y te respondemos con claridad. Ya sea una consulta, una propuesta o una duda
            sobre cómo preparar un evento, estamos para ayudarte.
          </p>

          <div className="mt-10 space-y-4">
            <a
              href="mailto:hola@alista.com.ar"
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-5 py-4 transition hover:border-primary/40"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-event-surface text-primary ring-1 ring-primary/15">
                <Mail className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">hola@alista.com.ar</p>
              </div>
            </a>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-5 py-4">
              <span className="grid size-10 place-items-center rounded-xl bg-event-surface text-primary ring-1 ring-primary/15">
                <MessageCircle className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Respuesta clara y sin vueltas</p>
                <p className="text-sm text-muted-foreground">Te contestamos a la brevedad.</p>
              </div>
            </div>
          </div>
        </div>

        <ContactForm subject="Consulta — Alista" cta="Enviar consulta" />
      </div>
    </section>
  )
}

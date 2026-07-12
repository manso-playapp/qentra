import { Plus } from 'lucide-react'

/**
 * Preguntas frecuentes orientadas a las objeciones reales del comprador (salon,
 * productor, familia). Respuestas honestas: durante los pilotos usamos lenguaje
 * "disenado para" y no prometemos integraciones que todavia no estan operativas.
 */
const FAQS = [
  {
    q: '¿Cómo funciona el pago?',
    a: 'Alista vincula cada aporte con la persona que lo hizo y está diseñado para distinguir un pago confirmado de una captura reenviada. Estamos integrando el cobro con pasarela; durante los pilotos trabajamos con conciliación asistida.',
  },
  {
    q: '¿El invitado tiene que instalar una app o crear una cuenta?',
    a: 'No. La invitación se abre desde WhatsApp, en el navegador, sin instalar nada ni registrarse. Confirma, suma acompañantes y completa lo necesario en pocos pasos.',
  },
  {
    q: '¿Puedo controlar el cupo y los horarios de acceso?',
    a: 'Sí. Definís el cupo del evento y ventanas horarias por tipo de invitado. En la puerta ves el aforo y los ingresos en tiempo real.',
  },
  {
    q: '¿Qué pasa con la conectividad en la puerta?',
    a: 'La puerta está pensada para pasos mínimos, texto grande y búsqueda manual. La estrategia para conectividad inestable se define en cada implementación, según el salón.',
  },
  {
    q: '¿Puedo personalizar la invitación y el totem?',
    a: 'Sí, con plantillas controladas: colores, portada, fotos y mensajes propios, más módulos opcionales como trivia, música y saludos. Buscamos que sea flexible sin volverse difícil de usar.',
  },
  {
    q: '¿Quién contrata Alista, el salón o la familia?',
    a: 'Habitualmente el salón, productor u organizador lo incorpora a su servicio y lo configura para cada fiesta. La familia recibe una operación resuelta, sin gestionar comprobantes.',
  },
]

export function FaqSection() {
  return (
    <section className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto w-full max-w-3xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Las dudas que aparecen antes de abrir.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-border/70 bg-card px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-sm font-semibold text-foreground sm:text-base">{faq.q}</span>
                <Plus className="size-4 flex-none text-primary transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

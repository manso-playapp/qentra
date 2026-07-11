export const metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de uso de la plataforma Alista.',
}

const SECTIONS = [
  {
    title: '1. Objeto',
    body: 'Estos términos regulan el uso de Alista, una plataforma para gestionar invitaciones, confirmaciones y accesos de eventos. Al usar el servicio, aceptás estas condiciones.',
  },
  {
    title: '2. Uso del servicio',
    body: 'Te comprometés a usar la plataforma de forma lícita y a cargar información sobre la que tengas base para tratarla. Sos responsable de la exactitud de los datos que ingresás y del uso que hace tu equipo.',
  },
  {
    title: '3. Cuentas y accesos',
    body: 'El acceso a las superficies operativas requiere credenciales. Sos responsable de mantener la confidencialidad de tus accesos y de las acciones realizadas desde tu cuenta.',
  },
  {
    title: '4. Responsabilidad',
    body: 'Trabajamos para que el servicio sea confiable, pero se presta “tal cual” disponible. No respondemos por decisiones operativas tomadas durante un evento ni por el uso indebido de la información por parte de los usuarios.',
  },
  {
    title: '5. Propiedad intelectual',
    body: 'La marca, el software y los contenidos de Alista pertenecen a sus titulares. No se otorga ningún derecho más allá del uso del servicio conforme a estos términos.',
  },
  {
    title: '6. Cambios',
    body: 'Podemos actualizar estos términos y el producto. Cuando los cambios sean relevantes, procuraremos comunicarlos con antelación razonable.',
  },
  {
    title: '7. Ley aplicable',
    body: 'Estos términos se rigen por las leyes de la República Argentina. Ante cualquier consulta, escribinos a hola@alista.com.ar.',
  },
]

export default function TerminosPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-20 pt-16 sm:pt-24">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">
        Términos y condiciones
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Versión base de las condiciones de uso de Alista. Debe revisarse con asesoría legal antes de
        su publicación definitiva.
      </p>

      <div className="mt-12 space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="font-display text-xl font-semibold text-foreground">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

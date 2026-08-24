export const metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de uso de la plataforma Alista.',
}

const SECTIONS = [
  {
    title: '1. Objeto',
    body: 'Estos términos regulan el uso de Alista, una plataforma que vincula invitación, pago y acceso en fiestas privadas con cupo limitado. Al usar el servicio, aceptás estas condiciones.',
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
    <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto w-full max-w-[900px]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c65035]">Legal</p>
      <h1 className="marketing-display mt-6 text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.005em] text-[#171714]">
        Términos y condiciones
      </h1>
      <p className="mt-7 max-w-2xl text-sm leading-6 text-black/58">
        Versión base de las condiciones de uso de Alista. Debe revisarse con asesoría legal antes de
        su publicación definitiva.
      </p>

      <div className="mt-14 border-t border-black/15">
        {SECTIONS.map((section) => (
          <div key={section.title} className="grid gap-4 border-b border-black/15 py-7 sm:grid-cols-[0.55fr_1.45fr]">
            <h2 className="text-sm font-black text-[#171714]">{section.title}</h2>
            <p className="text-sm leading-7 text-black/58">{section.body}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}

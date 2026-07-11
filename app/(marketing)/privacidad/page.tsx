export const metadata = {
  title: 'Política de privacidad',
  description:
    'Cómo Alista trata los datos personales: con proporcionalidad, consentimiento y control.',
}

const SECTIONS = [
  {
    title: '1. Qué datos tratamos',
    body: 'Tratamos únicamente los datos personales necesarios para preparar y operar un evento: datos de contacto, confirmaciones de asistencia, acompañantes, necesidades particulares informadas y datos de acceso. Pedimos solo la información que tiene un uso concreto.',
  },
  {
    title: '2. Para qué los usamos',
    body: 'Usamos los datos para convertir la información previa en preparación: organizar invitados, anticipar pendientes, coordinar al equipo y gestionar el ingreso. No los usamos para vigilancia ni para elaborar perfiles que excedan esa finalidad.',
  },
  {
    title: '3. Consentimiento y control',
    body: 'El tratamiento se realiza sobre la base del consentimiento y de la relación con el organizador del evento. Las personas pueden solicitar acceder, rectificar, actualizar o suprimir sus datos.',
  },
  {
    title: '4. Conservación y seguridad',
    body: 'Conservamos los datos por el tiempo necesario para la finalidad del evento y aplicamos medidas técnicas y organizativas razonables. La lógica sensible y las validaciones se resuelven del lado del servidor.',
  },
  {
    title: '5. Terceros',
    body: 'Podemos apoyarnos en proveedores de infraestructura y de envío de comunicaciones para prestar el servicio, sujetos a obligaciones de confidencialidad y seguridad. No vendemos datos personales.',
  },
  {
    title: '6. Derechos y contacto',
    body: 'De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, podés ejercer tus derechos escribiendo a hola@alista.com.ar. La autoridad de control es la Agencia de Acceso a la Información Pública.',
  },
]

export default function PrivacidadPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-20 pt-16 sm:pt-24">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">
        Política de privacidad
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Este documento describe el enfoque de Alista sobre el tratamiento de datos personales. Es
        una versión base y debe revisarse con asesoría legal antes de su publicación definitiva.
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

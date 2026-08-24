export const metadata = {
  title: 'Política de privacidad',
  description:
    'Cómo Alista trata los datos personales: con proporcionalidad, consentimiento y control.',
}

const SECTIONS = [
  {
    title: '1. Qué datos tratamos',
    body: 'Tratamos únicamente los datos personales necesarios para vincular a una persona con su pago y su acceso: datos de contacto, confirmaciones de asistencia, acompañantes, información de pago o aporte y datos de acceso. Pedimos solo la información que tiene un uso concreto.',
  },
  {
    title: '2. Para qué los usamos',
    body: 'Usamos los datos para ordenar la apertura de una fiesta: vincular pago y persona, organizar invitados, respetar el cupo y gestionar el ingreso. No los usamos para vigilancia ni para elaborar perfiles que excedan esa finalidad.',
  },
  {
    title: '3. Menores de edad',
    body: 'Muchas de estas celebraciones involucran a adolescentes. Cuando se tratan datos de menores, lo hacemos con especial cuidado y bajo la responsabilidad del organizador y de las familias, limitando la información a la estrictamente necesaria para el acceso.',
  },
  {
    title: '4. Consentimiento y control',
    body: 'El tratamiento se realiza sobre la base del consentimiento y de la relación con el organizador de la fiesta. Las personas pueden solicitar acceder, rectificar, actualizar o suprimir sus datos.',
  },
  {
    title: '5. Conservación y seguridad',
    body: 'Conservamos los datos por el tiempo necesario para la finalidad de la fiesta y aplicamos medidas técnicas y organizativas razonables. La lógica sensible y las validaciones se resuelven del lado del servidor.',
  },
  {
    title: '6. Terceros',
    body: 'Podemos apoyarnos en proveedores de infraestructura y de envío de comunicaciones para prestar el servicio, sujetos a obligaciones de confidencialidad y seguridad. No vendemos datos personales.',
  },
  {
    title: '7. Derechos y contacto',
    body: 'De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, podés ejercer tus derechos escribiendo a hola@alista.com.ar. La autoridad de control es la Agencia de Acceso a la Información Pública.',
  },
]

export default function PrivacidadPage() {
  return (
    <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto w-full max-w-[900px]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c65035]">Legal</p>
      <h1 className="marketing-display mt-6 text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.005em] text-[#171714]">
        Política de privacidad
      </h1>
      <p className="mt-7 max-w-2xl text-sm leading-6 text-black/58">
        Este documento describe el enfoque de Alista sobre el tratamiento de datos personales. Es
        una versión base y debe revisarse con asesoría legal antes de su publicación definitiva.
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

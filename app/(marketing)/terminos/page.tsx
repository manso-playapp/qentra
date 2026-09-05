import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Términos y condiciones',
  description: 'Alcance del servicio acompañado, uso autogestivo y responsabilidades en la preparación de una fiesta de 15.',
  path: '/terminos',
})

const SECTIONS = [
  { title: '1. Alcance de Alista', body: 'Alista está especializado en preparar invitaciones, invitados y recepción de cumpleaños de 15. Se puede contratar personalización y acompañamiento o utilizar la plataforma por cuenta propia. La contratación acompañada se define en una propuesta para esa fiesta.' },
  { title: '2. La responsable del evento', body: 'La responsable contrata y conserva la cuenta del evento. Puede incorporar a personas que colaboren en la organización. Debe aportar información exacta, contar con las autorizaciones necesarias para utilizar datos e imágenes y cuidar los accesos de su equipo.' },
  { title: '3. Servicio acompañado', body: 'La propuesta acordada define diseño, revisiones, configuración, seguimiento, capacitación, fechas, horarios de soporte y precio total. El uso y la activación de Alista para la fiesta están incluidos en ese servicio. Los cambios fuera del alcance se evalúan y presupuestan antes de realizarlos.' },
  { title: '4. Uso autogestivo', body: 'La tarifa publicada para autogestión corresponde al uso de la plataforma por evento. La organización se ocupa de configurarla y preparar su recepción. La activación habilita la generación de links de invitación. El diseño realizado por Alista y el acompañamiento durante la preparación y la fiesta se contratan aparte.' },
  { title: '5. Pagos de invitados', body: 'Si hay entradas pagas, la responsable conecta su cuenta de Mercado Pago. Esos pagos son independientes del precio del servicio de Alista y quedan sujetos a las condiciones de Mercado Pago. La organización define a quién invita, los importes y las condiciones de cada acceso.' },
  { title: '6. Recepción y adicionales', body: 'La familia, el salón o la productora aporta el personal y el referente de recepción. Se acuerda quién provee celulares, energía y conexión. El alquiler de equipos, instalación y recibidor digital se identifican como adicionales cuando corresponda. El recibidor da la bienvenida después del control y no autoriza el ingreso.' },
  { title: '7. Invitaciones y conectividad', body: 'Cada remitente comparte la invitación desde su cuenta personal de WhatsApp. El uso de recepción requiere conexión para consultar y registrar ingresos. La organización y Alista acuerdan la preparación y el procedimiento ante incidencias dentro del alcance contratado.' },
  { title: '8. Diseños y materiales', body: 'La familia debe tener autorización para usar las fotos, imágenes y otros materiales que aporta. El alcance de las piezas personalizadas se acuerda en la propuesta. La marca y el software de Alista permanecen bajo la titularidad de sus respectivos titulares.' },
  { title: '9. Consultas y condiciones acordadas', body: 'Las condiciones de pago, cambios de fecha y cancelación deben quedar claras en la propuesta antes de contratar. Podés consultar en hola@alista.com.ar. El servicio se rige por la legislación argentina; estas condiciones no limitan los derechos que correspondan a las personas consumidoras.' },
]

export default function TerminosPage() {
  return (
    <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto w-full max-w-[900px]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Legal</p>
      <h1 className="marketing-display mt-6 text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.005em] text-[#171714]">
        Términos y condiciones
      </h1>
      <p className="mt-7 max-w-2xl text-sm leading-6 text-black/58">
        Alcance y responsabilidades al preparar una fiesta con Alista. Esta versión está en revisión;
        la propuesta de cada evento debe detallar las condiciones antes de contratar.
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

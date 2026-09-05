import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Política de privacidad',
  description:
    'Qué información se utiliza para preparar la fiesta, quién puede consultarla y cómo solicitar acceso o cambios.',
  path: '/privacidad',
})

const SECTIONS = [
  { title: '1. Información de la fiesta', body: 'Alista trata los datos que la organización y los invitados aportan para preparar la celebración: nombres, contactos, confirmaciones, acompañantes y condiciones de acceso. Según la configuración, la invitación puede pedir una foto, documento, menú u observaciones. La responsable debe revisar qué información necesita para su fiesta.' },
  { title: '2. Uso de la información', body: 'La información se usa para configurar y personalizar invitaciones, reunir respuestas, revisar pendientes y preparar la recepción. Cuando hay entradas pagas, se vincula el estado del pago con la invitación. Las preferencias o restricciones aportadas por invitados deben compartirse sólo con quienes las necesitan para la organización.' },
  { title: '3. Personas con acceso', body: 'La responsable y quienes están autorizados en el evento pueden consultar la información de su organización. El equipo de soporte de Alista tiene acceso para configurar y asistir. La responsable debe cuidar las credenciales y revisar quién participa en su equipo.' },
  { title: '4. Adolescentes e imágenes', body: 'La organización debe contar con las autorizaciones que correspondan para aportar datos e imágenes de menores. El uso de una foto o video en la fiesta no equivale a autorizar su publicación en la comunicación de Alista. Los casos y testimonios requieren autorización específica.' },
  { title: '5. Pagos y proveedores', body: 'Mercado Pago procesa las entradas pagas en la cuenta receptora de la responsable. Alista registra la información necesaria para relacionar el pago y la invitación. La prestación también utiliza proveedores de infraestructura. Los envíos personales por WhatsApp ocurren desde la cuenta de cada remitente. No vendemos datos personales.' },
  { title: '6. Conservación y solicitudes', body: 'Los datos cargados permanecen asociados al evento para su gestión y consulta. La activación comercial no elimina los datos de un evento sin activar. Podés solicitar información sobre su conservación, acceso, actualización o supresión escribiendo a hola@alista.com.ar.' },
  { title: '7. Tus derechos', body: 'La Ley 25.326 reconoce derechos sobre tus datos personales, incluidos acceso, rectificación y, cuando corresponda, supresión. Para ejercerlos o consultar por información de un menor a tu cargo, escribí a hola@alista.com.ar. La autoridad de control en Argentina es la Agencia de Acceso a la Información Pública.' },
]

export default function PrivacidadPage() {
  return (
    <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
      <div className="mx-auto w-full max-w-[900px]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Legal</p>
      <h1 className="marketing-display mt-6 text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.92] tracking-[-0.005em] text-[#171714]">
        Política de privacidad
      </h1>
      <p className="mt-7 max-w-2xl text-sm leading-6 text-black/58">
        Información sobre los datos que se usan al organizar una fiesta con Alista. Esta versión
        está en revisión antes de su publicación definitiva.
      </p>

      <div className="mt-14 border-t border-black/15">
        {SECTIONS.map((section) => (
          <div key={section.title} className="grid gap-4 border-b border-black/15 py-7 sm:grid-cols-[0.55fr_1.45fr]">
            <h2 className="text-sm font-black text-[#171714]">{section.title}</h2>
            <p className="text-sm leading-7 text-black/58">{section.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm leading-6 text-black/65">Podés consultar también la <a href="https://www.argentina.gob.ar/aaip/datospersonales/derechos" className="font-bold underline underline-offset-4">guía de derechos de la AAIP</a>.</p>
      </div>
    </section>
  )
}

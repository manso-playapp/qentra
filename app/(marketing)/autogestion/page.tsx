import Link from 'next/link'
import { PageHero, Section } from '@/components/marketing/sections'
import { formatAlistaServicePrice } from '@/lib/alista-service-payment'
import { createMarketingMetadata } from '@/lib/marketing-seo'

const price = formatAlistaServicePrice()
export const metadata = createMarketingMetadata({
  title: 'Alista autogestivo: prepará tu fiesta por tu cuenta',
  description: `Usá la plataforma de Alista por ${price} ARS por evento. Configuración a tu cargo, opciones de diseño en el editor e invitaciones desde tu WhatsApp.`,
  path: '/autogestion',
})

export default function AutogestionPage() {
  return <>
    <PageHero eyebrow="Alista autogestivo" title="La plataforma para preparar" highlight="tu fiesta por tu cuenta." description="Si querés ocuparte del diseño, la configuración y el seguimiento, podés usar Alista desde tu cuenta. Conocé el alcance y el precio antes de empezar." />
    <Section eyebrow="Pago único por evento" title={`${price} ARS`} description="La activación permite generar los links de invitación de esa fiesta. Podés crear tu cuenta y explorar la configuración antes de activarla.">
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-7">
          <h2 className="text-xl font-black">Qué incluye la plataforma</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-6 text-black/70">
            <li>Editor de invitación con plantillas, colores, fotos y textos.</li>
            <li>Lista de invitados, tipos de acceso y acompañantes autorizados.</li>
            <li>Links para compartir desde los WhatsApp personales de madre e hija.</li>
            <li>Confirmaciones y estado de pagos cuando hay entradas pagas.</li>
            <li>Registro de ingresos desde celulares con conexión.</li>
          </ul>
        </div>
        <div className="rounded-3xl bg-[#e7ded0] p-7">
          <h2 className="text-xl font-black">Qué queda a cargo de la organización</h2>
          <p className="mt-5 text-sm leading-7 text-black/70">Elegir y cargar el diseño, configurar el evento, revisar las respuestas y preparar al equipo de recepción. También asignar celulares, energía, conexión y una persona que resuelva las dudas de ingreso.</p>
          <p className="mt-4 text-sm leading-7 text-black/70">El diseño realizado por Alista, el seguimiento de preparación, la capacitación y la cobertura de soporte durante la fiesta se contratan como servicio acompañado. Equipos, personal de recepción y recibidor no forman parte de esta tarifa.</p>
        </div>
      </div>
      <p className="mt-8 max-w-3xl text-sm leading-7 text-black/65">Si hay entradas pagas, la responsable conecta su cuenta de Mercado Pago. El dinero de esas entradas es independiente de la activación de Alista. Si la fiesta no tiene entradas pagas, no necesitás conectar Mercado Pago para los invitados.</p>
      <div className="mt-8 flex flex-wrap items-center gap-6">
        <Link href="/acceso?next=/admin/events/new" className="inline-flex min-h-12 items-center rounded-full bg-[#213480] px-6 text-sm font-black text-white hover:bg-[#009cdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#213480] focus-visible:ring-offset-2">Preparar mi evento</Link>
        <Link href="/precios" className="text-sm font-bold underline underline-offset-4">Prefiero personalización y acompañamiento</Link>
      </div>
    </Section>
  </>
}

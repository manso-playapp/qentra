import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ClosingCta, PageHero } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Seguridad y privacidad en Alista',
  description:
    'Cómo preparamos el uso de información, pagos y accesos con la familia y su equipo de recepción.',
  path: '/seguridad',
})

const PRINCIPLES = [
  { number: '01', title: 'Datos para preparar la fiesta.', body: 'Nombre, confirmación, acompañantes y la información necesaria para recibir a cada grupo. Revisamos con la familia qué necesita pedir su invitación y para qué lo va a usar.' },
  { number: '02', title: 'Una responsable y un equipo identificado.', body: 'La responsable conserva su evento. Las personas autorizadas colaboran en la organización y el equipo de Alista puede acceder para prestar soporte. Las credenciales se mantienen personales.' },
  { number: '03', title: 'El pago se consulta en la invitación.', body: 'En accesos pagos, el estado asociado a la invitación es la referencia de recepción. Una captura reenviada no reemplaza la revisión del pago y de quién está invitado.' },
  { number: '04', title: 'Un cuidado especial con adolescentes.', body: 'La familia debe contar con las autorizaciones correspondientes para aportar datos e imágenes. Un material usado en la fiesta requiere un permiso específico si después se quiere publicar como caso de Alista.' },
]

const LIMITS = [
  'Revisar quiénes necesitan acceso al evento y cuidar las credenciales de cada cuenta.',
  'Probar los equipos y la conexión del lugar antes de abrir la recepción.',
  'Derivar las dudas de identidad, pago o lista al referente designado por la organización.',
  'Compartir material de la fiesta sólo con autorización, cuidando nombres, contactos y códigos de acceso.',
]

export default function SeguridadPage() {
  return (
    <>
      <PageHero
        eyebrow="Seguridad y privacidad"
        title="Cuidar la fiesta también es"
        highlight="cuidar su información."
        description="Desde la primera lista hasta la recepción, la información tiene una función concreta. Acordamos con la familia qué hace falta y quién participa en la preparación."
        primaryCta={{ href: '/privacidad', label: 'Leer política de privacidad' }}
        secondaryCta={{ href: '/contacto', label: 'Hacer una consulta' }}
      />

      <section className="bg-[#162c29] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9ee73]">Cuatro criterios</p>
              <h2 className="marketing-display mt-5 text-[clamp(2.6rem,4.25vw,4.25rem)] font-black leading-[0.92] tracking-[-0.005em]">
                Saber qué se comparte y con quién.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/58">
              La preparación incluye revisar los datos de la invitación, identificar a quienes colaboran y explicar al equipo cómo resolver una duda en puerta.
            </p>
          </div>

          <ol className="mt-16 grid gap-px overflow-hidden rounded-[2rem] bg-white/15 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <li key={principle.number} className="min-h-72 bg-[#162c29] p-7 sm:p-9">
                <span className="marketing-display text-3xl font-black text-[#d9ee73]">{principle.number}</span>
                <h3 className="marketing-display mt-9 max-w-md text-3xl font-black leading-[0.96] tracking-[-0.005em]">
                  {principle.title}
                </h3>
                <p className="mt-5 max-w-md text-sm leading-6 text-white/58">{principle.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#f0eee8] px-5 py-20 sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Antes de abrir la recepción</p>
            <h2 className="marketing-display mt-5 text-[clamp(2.6rem,4.25vw,4.25rem)] font-black leading-[0.92] tracking-[-0.005em]">
              Cuatro acuerdos con el equipo.
            </h2>
          </div>
          <div>
            <ul className="divide-y divide-black/12 border-y border-black/12">
              {LIMITS.map((limit, index) => (
                <li key={limit} className="grid grid-cols-[3rem_1fr] gap-4 py-6">
                  <span className="marketing-display text-2xl font-black text-[#9c3926]">0{index + 1}</span>
                  <p className="text-sm font-bold leading-6 text-black/65">{limit}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/privacidad"
              className="mt-8 inline-flex min-h-12 items-center gap-4 rounded-full bg-[#171714] px-6 text-sm font-black text-white transition hover:bg-[#213480] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Ver el tratamiento de datos
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <ClosingCta
        title="Acordemos cómo cuidar su fiesta."
        description="Si tenés dudas sobre los datos que se piden, los accesos de tu equipo o el uso de imágenes, conversemos antes de compartir la invitación."
        primary={{ href: '/contacto', label: 'Hablar con el equipo' }}
        secondary={{ href: '/privacidad', label: 'Leer privacidad' }}
      />
    </>
  )
}

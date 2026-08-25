import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ClosingCta, PageHero } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Seguridad y privacidad en Alista',
  description:
    'Conocé los criterios con los que Alista trata datos de invitados, grupos, aportes y accesos.',
  path: '/seguridad',
})

const PRINCIPLES = [
  {
    number: '01',
    title: 'Pedir solo lo que tiene un uso.',
    body: 'Cada dato debe ayudar a preparar la invitación, el grupo o la llegada. Si no cumple una función concreta, no debería formar parte del recorrido.',
  },
  {
    number: '02',
    title: 'Cuidar especialmente a los menores.',
    body: 'Las fiestas de 15 involucran adolescentes. La información se limita a lo necesario y su tratamiento requiere responsabilidad del organizador y las familias.',
  },
  {
    number: '03',
    title: 'Resolver la lógica sensible en el servidor.',
    body: 'Estados, permisos y validaciones no dependen de lo que muestra una pantalla. La decisión operativa se sostiene en la lógica protegida del sistema.',
  },
  {
    number: '04',
    title: 'Ordenar sin convertir la fiesta en vigilancia.',
    body: 'La información existe para preparar y recibir mejor. No para elaborar perfiles ajenos a esa finalidad ni tratar a cada persona como sospechosa.',
  },
]

const LIMITS = [
  'No vender datos personales ni usarlos con una finalidad ajena a la fiesta.',
  'No tratar una captura como prueba automática de un pago confirmado.',
  'No prometer automatizaciones que la implementación real todavía no puede demostrar.',
  'No dar el mismo acceso a todos los roles cuando sus responsabilidades son distintas.',
]

export default function SeguridadPage() {
  return (
    <>
      <PageHero
        eyebrow="Seguridad y privacidad"
        title="Cuidar la fiesta también es"
        highlight="cuidar su información."
        description="Alista usa los datos para preparar el recorrido y la llegada. Ese propósito define qué se pide, quién puede verlo y qué límites no cruzamos."
        primaryCta={{ href: '/privacidad', label: 'Leer política de privacidad' }}
        secondaryCta={{ href: '/contacto', label: 'Hacer una consulta' }}
      />

      <section className="bg-[#162c29] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d9ee73]">Cuatro criterios</p>
              <h2 className="marketing-display mt-5 text-[clamp(2.6rem,4.25vw,4.25rem)] font-black leading-[0.92] tracking-[-0.005em]">
                La confianza se diseña.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/58">
              No alcanza con agregar una página legal. Estos criterios tienen que aparecer en el producto, en los permisos y en cada decisión de implementación.
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
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9c3926]">Nuestros límites</p>
            <h2 className="marketing-display mt-5 text-[clamp(2.6rem,4.25vw,4.25rem)] font-black leading-[0.92] tracking-[-0.005em]">
              Lo que Alista no hace.
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
        title="La tecnología tiene que dar tranquilidad."
        description="Si necesitás entender cómo se aplica este criterio a tu fiesta o a tu operación, conversemos antes de implementar."
        primary={{ href: '/contacto', label: 'Hablar con el equipo' }}
        secondary={{ href: '/privacidad', label: 'Leer privacidad' }}
      />
    </>
  )
}

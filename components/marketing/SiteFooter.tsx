import Image from 'next/image'
import Link from 'next/link'

const groups = [
  {
    title: 'Conocé Alista',
    links: [
      { href: '/producto', label: 'Producto' },
      { href: '/como-funciona', label: 'Cómo funciona' },
      { href: '/casos', label: 'Caso Dharma' },
      { href: '/seguridad', label: 'Seguridad' },
    ],
  },
  {
    title: 'Para quién',
    links: [
      { href: '/demo', label: 'Estoy organizando mis 15' },
      { href: '/profesionales', label: 'Organizo fiestas de 15' },
      { href: '/precios', label: 'Cómo contratar Alista' },
    ],
  },
  {
    title: 'Alista',
    links: [
      { href: '/contacto', label: 'Contacto' },
      { href: '/privacidad', label: 'Privacidad' },
      { href: '/admin', label: 'Acceder' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#11110f] text-white">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-8 lg:px-14 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.25fr_repeat(3,0.75fr)]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11110f]" aria-label="Alista, inicio">
              <Image src="/alista-logo-white.svg" alt="Alista" width={1890} height={387} className="h-7 w-auto" />
            </Link>
            <p className="mt-6 text-sm leading-6 text-white/50">
              La fiesta dura una noche. Alista todo lo que pasa antes.
            </p>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{group.title}</p>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex min-h-6 items-center rounded-sm text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11110f]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Alista. Cumpleaños de 15, mejor preparados.</p>
          <div className="flex gap-5">
            <Link href="/privacidad" className="inline-flex min-h-6 items-center rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Privacidad</Link>
            <Link href="/terminos" className="inline-flex min-h-6 items-center rounded-sm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

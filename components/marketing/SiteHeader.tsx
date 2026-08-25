import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { MobileNavigation } from '@/components/marketing/MobileNavigation'
import { TrackedLink } from '@/components/marketing/TrackedLink'

const navLinks = [
  { href: '/#probar', label: 'Probá Alista' },
  { href: '/#preparacion', label: 'Preparación' },
  { href: '/#dharma', label: 'Dharma' },
  { href: '/profesionales', label: 'Profesionales' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#11110f]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-14">
        <Link
          href="/"
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11110f]"
          aria-label="Alista, inicio"
        >
          <Image src="/alista-logo-white.svg" alt="Alista" width={1890} height={387} className="h-6 w-auto sm:h-[1.8rem]" priority />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex min-h-6 items-center rounded-sm text-xs font-bold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11110f]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/admin" className="hidden min-h-6 items-center rounded-sm text-xs font-bold text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11110f] sm:inline-flex">
            Acceder
          </Link>
          <MobileNavigation links={navLinks} />
          <TrackedLink
            href="/demo"
            aria-label="Quiero Alista"
            analytics={{
              name: 'cta_clicked',
              properties: { placement: 'header', audience: 'family', destination: 'demo' },
            }}
            className="inline-flex size-11 items-center justify-center gap-2 rounded-full bg-[#213480] text-xs font-black text-white transition hover:bg-[#009cdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-10 sm:w-auto sm:px-4"
          >
            <span className="hidden sm:inline">Quiero Alista</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </TrackedLink>
        </div>
      </div>
    </header>
  )
}

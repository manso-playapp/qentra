import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

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
        <Link href="/" className="flex items-center" aria-label="Alista, inicio">
          <Image src="/alista-logo-white.svg" alt="Alista" width={1890} height={387} className="h-[1.8rem] w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-xs font-bold text-white/58 transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/admin" className="hidden text-xs font-bold text-white/50 transition hover:text-white sm:inline-flex">
            Acceder
          </Link>
          <Link
            href="/demo"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#213480] px-4 text-xs font-black text-white transition hover:bg-[#009cdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Quiero Alista
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  )
}

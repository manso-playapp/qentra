import Link from 'next/link'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '/producto', label: 'Producto' },
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/casos', label: 'Casos de uso' },
  { href: '/seguridad', label: 'Seguridad' },
  { href: '/precios', label: 'Precios' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center" aria-label="Alista, inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/alista-logo.svg" alt="Alista" className="h-7 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/admin">Acceder</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/demo">Solicitar demo</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

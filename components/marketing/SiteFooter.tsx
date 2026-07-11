import Link from 'next/link'

const FOOTER_GROUPS = [
  {
    title: 'Producto',
    links: [
      { href: '/producto', label: 'Qué hace' },
      { href: '/como-funciona', label: 'Cómo funciona' },
      { href: '/casos', label: 'Casos de uso' },
      { href: '/precios', label: 'Precios' },
    ],
  },
  {
    title: 'Para quién',
    links: [
      { href: '/casos#sociales', label: 'Eventos sociales' },
      { href: '/casos#corporativos', label: 'Eventos corporativos' },
      { href: '/casos#escala', label: 'Eventos de escala' },
    ],
  },
  {
    title: 'Compañía',
    links: [
      { href: '/seguridad', label: 'Seguridad y privacidad' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/admin', label: 'Acceder a la plataforma' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-semibold leading-none">
                Q
              </span>
              <span className="font-display text-xl font-semibold tracking-tight">Qentra</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Plataforma de experiencia de invitados. Convertí cada interacción previa en una
              recepción más clara, fluida y personal.
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Qentra. Todo listo para que puedas estar presente.</p>
          <div className="flex gap-5">
            <Link href="/privacidad" className="hover:text-foreground">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-foreground">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

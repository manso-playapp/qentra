'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'

type NavigationLink = {
  href: string
  label: string
}

export function MobileNavigation({ links }: { links: NavigationLink[] }) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const summaryRef = useRef<HTMLElement>(null)

  function closeMenu() {
    detailsRef.current?.removeAttribute('open')
  }

  return (
    <details
      ref={detailsRef}
      className="group relative lg:hidden [&_summary::-webkit-details-marker]:hidden"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return

        closeMenu()
        summaryRef.current?.focus()
      }}
    >
      <summary
        ref={summaryRef}
        className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-white/20 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#11110f]"
      >
        <span className="sr-only">Navegación principal</span>
        <Menu className="size-5" aria-hidden="true" />
      </summary>

      <nav
        aria-label="Principal móvil"
        className="fixed inset-x-5 top-[4.25rem] rounded-3xl border border-white/12 bg-[#171714] p-3 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-13 sm:w-80"
      >
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={closeMenu}
                className="flex min-h-11 items-center rounded-2xl px-4 text-sm font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="border-t border-white/12 pt-1">
            <Link
              href="/admin"
              onClick={closeMenu}
              className="flex min-h-11 items-center rounded-2xl px-4 text-sm font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Acceder
            </Link>
          </li>
        </ul>
      </nav>
    </details>
  )
}

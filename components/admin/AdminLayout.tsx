'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarRange, LayoutDashboard, Settings2, Sparkles, Users2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: ReactNode
}

const ADMIN_NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Inicio',
    description: 'Vista general',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/events',
    label: 'Eventos',
    description: 'Agenda y operacion',
    icon: CalendarRange,
  },
  {
    href: '/admin/guests',
    label: 'Invitados',
    description: 'Directorios y acceso',
    icon: Users2,
  },
  {
    href: '/admin/settings',
    label: 'Configuracion',
    description: 'Canales y usuarios',
    icon: Settings2,
  },
] as const

function isNavItemActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function getPageEyebrow(pathname: string) {
  if (pathname.startsWith('/admin/events/new')) {
    return 'Nuevo evento'
  }

  if (pathname.startsWith('/admin/events/')) {
    return 'Ficha del evento'
  }

  if (pathname.startsWith('/admin/events')) {
    return 'Agenda operativa'
  }

  if (pathname.startsWith('/admin/settings')) {
    return 'Canales y permisos'
  }

  if (pathname.startsWith('/admin/guests')) {
    return 'Recepcion y directorios'
  }

  return 'Backoffice operativo'
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="admin-shell">
      <div className="relative mx-auto flex min-h-screen max-w-[1720px] flex-col px-4 py-4 lg:flex-row lg:gap-6 lg:px-6">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[312px] lg:flex-none">
          <div className="flex h-full flex-col rounded-[32px] border border-white/10 bg-admin-navy p-6 text-white shadow-[0_24px_80px_rgba(24,36,51,0.22)]">
            <Card className="border-white/10 bg-white/[0.06] text-white shadow-none backdrop-blur">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.34em] text-orange-200/80">
                      Qentra Admin
                    </p>
                    <Link href="/admin" className="admin-heading mt-4 block text-[2.15rem] leading-none text-white">
                      Control de eventos
                    </Link>
                  </div>
                  <span className="rounded-full bg-white/10 p-2">
                    <Sparkles className="size-4 text-orange-200" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  La misma base de sistema para operar agenda, delivery y acceso sin quedar atados a una sola superficie visual.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6 border-white/10 bg-white/[0.045] text-white shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-sky-200/70">
                      Estado actual
                    </p>
                    <p className="mt-3 text-sm font-semibold text-white">Base operativa activa</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      Admin, puerta, totem, invitaciones y delivery listos para trabajo real.
                    </p>
                  </div>
                  <Badge variant="success" className="border-emerald-300/15 bg-emerald-300/15 text-emerald-100">
                    Activo
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <nav className="mt-8 flex-1 space-y-2">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(pathname, item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between rounded-[26px] border px-4 py-4 transition',
                      active
                        ? 'border-orange-300/30 bg-orange-300/12 text-white shadow-[0_12px_32px_rgba(184,79,45,0.18)]'
                        : 'border-white/8 bg-white/[0.03] text-slate-200 hover:border-white/12 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'rounded-2xl border p-2.5',
                          active ? 'border-white/10 bg-white/10' : 'border-white/8 bg-black/10'
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className={cn('mt-1 text-xs', active ? 'text-orange-100/80' : 'text-slate-400')}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs font-semibold uppercase tracking-[0.24em]',
                      active ? 'text-orange-200' : 'text-slate-500 group-hover:text-slate-300'
                    )}>
                      go
                    </span>
                  </Link>
                )
              })}
            </nav>

            <form action="/acceso/logout" method="post" className="mt-6">
              <Button type="submit" variant="outline" className="w-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white">
                Cerrar sesion
              </Button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="rounded-[32px] border border-border/70 bg-admin-panel px-6 py-5 shadow-[0_20px_60px_rgba(86,62,38,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                  {getPageEyebrow(pathname)}
                </p>
                <h1 className="admin-heading mt-3 text-4xl leading-none text-foreground">
                  Centro de operaciones
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Sistema visual unificado para operar eventos y, cuando corresponda, vestir cada experiencia con branding propio sin romper consistencia.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/admin/events/new">Nuevo evento</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/settings">Revisar entorno</Link>
                </Button>
              </div>
            </div>
          </header>

          <main className="pb-8 pt-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarRange,
  GaugeCircle,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Settings2,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { APP_VERSION, APP_VERSION_DATE } from '@/lib/version'

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
    href: '/admin/settings',
    label: 'Configuracion',
    description: 'Canales y usuarios',
    icon: Settings2,
  },
  {
    href: '/admin/estado',
    label: 'Estado del MVP',
    description: 'Avance del producto',
    icon: GaugeCircle,
  },
] as const

function isNavItemActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

type PageHeader = {
  eyebrow: string
  title: string
  description: string
  /** Acciones del header. Una seccion nunca ofrece la accion que ya estas ejecutando. */
  actions: { href: string; label: string; variant?: 'outline' }[]
}

// El h1 tiene que decir donde estas parado. Antes era siempre "Centro de
// operaciones" y el titulo real quedaba enterrado en la primera Card.
function getPageHeader(pathname: string): PageHeader {
  if (pathname.includes('/branding')) {
    const eventId = pathname.split('/')[3]
    return {
      eyebrow: 'Ficha del evento',
      title: 'Branding del evento',
      description: 'Colores, logo, portada y los textos que ven el invitado y el tótem.',
      actions: [{ href: `/admin/events/${eventId}`, label: 'Volver al evento', variant: 'outline' }],
    }
  }

  if (pathname.startsWith('/admin/events/new')) {
    return {
      eyebrow: 'Agenda operativa',
      title: 'Nuevo evento',
      description: 'Definí fecha, lugar, cupo y canal de envío. Después vas a poder cargar invitados y emitir accesos.',
      actions: [{ href: '/admin/events', label: 'Volver a eventos', variant: 'outline' }],
    }
  }

  if (pathname.startsWith('/admin/events/')) {
    return {
      eyebrow: 'Ficha del evento',
      title: 'Evento',
      description: 'Invitados, accesos, check-in y branding de este evento.',
      actions: [{ href: '/admin/events', label: 'Volver a eventos', variant: 'outline' }],
    }
  }

  if (pathname.startsWith('/admin/events')) {
    return {
      eyebrow: 'Agenda operativa',
      title: 'Eventos',
      description: 'Todos los eventos cargados, con su estado y su avance de acreditación.',
      actions: [{ href: '/admin/events/new', label: 'Nuevo evento' }],
    }
  }

  if (pathname.startsWith('/admin/settings')) {
    return {
      eyebrow: 'Canales y permisos',
      title: 'Configuración',
      description: 'Operadores, roles, proveedores de envío y salud de los canales.',
      actions: [],
    }
  }

  if (pathname.startsWith('/admin/estado')) {
    return {
      eyebrow: 'Producto',
      title: 'Estado del MVP',
      description: 'Qué está construido, qué está a medias y qué falta para cerrar el alcance.',
      actions: [],
    }
  }

  if (pathname.startsWith('/admin/guests')) {
    return {
      eyebrow: 'Recepción',
      title: 'Invitados',
      description: 'Todos los invitados de todos los eventos, con búsqueda y filtros. Para editar o acreditar, entrá al evento.',
      actions: [{ href: '/admin/events', label: 'Ir a eventos', variant: 'outline' }],
    }
  }

  return {
    eyebrow: 'Backoffice operativo',
    title: 'Centro de operaciones',
    description: 'El pulso de tu próximo evento: invitados cargados, accesos emitidos y gente que ya entró.',
    actions: [{ href: '/admin/events/new', label: 'Nuevo evento' }],
  }
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const header = getPageHeader(pathname)
  const [collapsed, setCollapsed] = useState(false)
  // Arranca en false para que server y cliente hidraten igual; la preferencia
  // guardada se aplica recien despues de montar.
  const skipPersist = useRef(true)

  useEffect(() => {
    if (window.localStorage.getItem('alista-admin-sidebar-collapsed') === '1') {
      // Aplicar la preferencia guardada tras montar mantiene la hidratacion SSR
      // consistente (server y primer render de cliente arrancan expandidos).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(true)
    }
  }, [])

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    window.localStorage.setItem('alista-admin-sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div className="admin-shell">
      <div className="relative mx-auto flex min-h-screen max-w-[1720px] flex-col px-4 py-4 lg:flex-row lg:gap-6 lg:px-6">
        <aside
          className={cn(
            'lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:flex-none lg:transition-[width] lg:duration-300',
            collapsed ? 'lg:w-[92px]' : 'lg:w-[312px]'
          )}
        >
          <div
            className={cn(
              'flex h-full flex-col rounded-[32px] border border-white/10 bg-admin-navy text-white shadow-[0_24px_80px_rgba(24,36,51,0.22)]',
              collapsed ? 'p-4' : 'p-6'
            )}
          >
            <div className={cn('flex items-center gap-2', collapsed ? 'flex-col' : 'justify-between')}>
              <Link href="/admin" className="inline-flex" aria-label="Alista, inicio">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={collapsed ? '/alista-mark.svg' : '/alista-logo-white.svg'}
                  alt="Alista"
                  className={collapsed ? 'h-10 w-auto' : 'h-8 w-auto'}
                />
              </Link>
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? 'Expandir menú' : 'Replegar menú'}
                title={collapsed ? 'Expandir menú' : 'Replegar menú'}
                className="grid size-9 flex-none place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
              </button>
            </div>

            <nav className="mt-8 flex-1 space-y-2">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(pathname, item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group flex items-center rounded-[26px] border transition',
                      collapsed ? 'justify-center p-3' : 'justify-between px-4 py-4',
                      active
                        ? 'border-sky-400/30 bg-sky-400/15 text-white shadow-[0_12px_32px_rgba(0,156,221,0.18)]'
                        : 'border-white/8 bg-white/[0.03] text-slate-200 hover:border-white/12 hover:bg-white/[0.06]'
                    )}
                  >
                    <div className={cn('flex items-center', !collapsed && 'gap-3')}>
                      <span
                        className={cn(
                          'rounded-2xl border p-2.5',
                          active ? 'border-white/10 bg-white/10' : 'border-white/8 bg-black/10'
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      {!collapsed && (
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className={cn('mt-1 text-xs', active ? 'text-sky-200/80' : 'text-slate-400')}>
                            {item.description}
                          </p>
                        </div>
                      )}
                    </div>
                    {!collapsed && (
                      <span
                        className={cn(
                          'text-xs font-semibold uppercase tracking-[0.24em]',
                          active ? 'text-sky-300' : 'text-slate-500 group-hover:text-slate-300'
                        )}
                      >
                        go
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <form action="/acceso/logout" method="post" className="mt-6">
              <Button
                type="submit"
                variant="outline"
                title={collapsed ? 'Cerrar sesión' : undefined}
                className={cn(
                  'w-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white',
                  collapsed && 'px-0'
                )}
              >
                {collapsed ? <LogOut className="size-4" /> : 'Cerrar sesion'}
              </Button>
            </form>

            {/* Control de version: que build esta corriendo en este entorno. */}
            <div className="mt-4 text-center" title={`Version ${APP_VERSION} · ${APP_VERSION_DATE}`}>
              <p className="text-[11px] font-medium tracking-wide text-slate-400">
                {collapsed ? `v${APP_VERSION}` : `Alista · v${APP_VERSION}`}
              </p>
              {!collapsed && (
                <p className="mt-0.5 text-[10px] text-slate-500">{APP_VERSION_DATE}</p>
              )}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="rounded-[32px] border border-border/70 bg-admin-panel px-6 py-5 shadow-[0_20px_60px_rgba(22,33,90,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                  {header.eyebrow}
                </p>
                <h1 className="admin-heading mt-3 text-4xl leading-none text-foreground">
                  {header.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {header.description}
                </p>
              </div>

              {header.actions.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {header.actions.map((action) => (
                    <Button key={action.href} asChild variant={action.variant}>
                      <Link href={action.href}>{action.label}</Link>
                    </Button>
                  ))}
                </div>
              )}
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

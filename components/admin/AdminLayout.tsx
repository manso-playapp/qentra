'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarRange,
  GaugeCircle,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Settings2,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { APP_VERSION, APP_VERSION_DATE } from '@/lib/version'
import { useAdminAccess } from '@/components/admin/AdminAccessContext'
import AdminEventSidebar from '@/components/admin/AdminEventSidebar'

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
    description: 'Mis agendas',
    icon: CalendarRange,
  },
  {
    href: '/admin/events/new',
    label: 'Nuevo evento',
    description: 'Empezar una agenda',
    icon: Plus,
  },
  {
    href: '/admin/settings',
    label: 'Configuracion',
    description: 'Email y usuarios',
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

  if (href === '/admin/events') {
    return pathname === href
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
      eyebrow: 'Personalización',
      title: 'Marca y tótem',
      description: 'Colores, logo, fondo y textos del tótem. La invitación se personaliza en su propio editor.',
      actions: [{ href: `/admin/events/${eventId}`, label: 'Volver al evento', variant: 'outline' }],
    }
  }

  if (pathname.startsWith('/admin/events/new')) {
    return {
      eyebrow: 'Agenda operativa',
      title: 'Nuevo evento',
      description: 'Definí fecha, lugar y cupo. Después vas a poder cargar invitados y emitir accesos.',
      actions: [{ href: '/admin/events', label: 'Volver a eventos', variant: 'outline' }],
    }
  }

  if (pathname.startsWith('/admin/events/')) {
    return {
      eyebrow: 'Ficha del evento',
      title: 'Evento',
      description: 'Centro de operaciones: páginas públicas (invitación, tótem), invitados y control de acceso.',
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
      eyebrow: 'Email y permisos',
      title: 'Configuración',
      description: 'Operadores, roles y salud del email de invitaciones.',
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
    description: 'Tu próximo evento, qué falta para dejarlo listo y acceso directo a operarlo.',
    actions: [{ href: '/admin/events/new', label: 'Nuevo evento' }],
  }
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const header = getPageHeader(pathname)
  const [collapsed, setCollapsed] = useState(false)
  const { isGlobalAdmin, identity } = useAdminAccess()
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

            <div className="admin-sidebar-scroll mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
              <AdminEventSidebar collapsed={collapsed} isStaff={isGlobalAdmin} />

              <div className={cn('my-4 border-t border-white/10', collapsed ? 'mx-2' : 'mx-1')} />

              <nav aria-label="Navegación principal">
                <section className="space-y-0.5">
                  {!collapsed && (
                    <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Alista
                    </p>
                  )}
                  {ADMIN_NAV_ITEMS.filter((item) =>
                    isGlobalAdmin || (item.href !== '/admin/settings' && item.href !== '/admin/estado')
                  ).map((item) => {
                    const active = isNavItemActive(pathname, item.href)
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group relative flex items-center transition',
                          collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2.5',
                          active ? 'text-white' : 'text-slate-200 hover:text-white'
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute left-0 w-1 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]',
                              collapsed ? 'inset-y-2' : 'inset-y-1.5'
                            )}
                          />
                        )}
                        <span className={cn('p-2.5', active ? 'text-sky-200' : 'text-slate-400')}>
                          <Icon className="size-4" />
                        </span>
                        {!collapsed && (
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{item.href === '/admin/events' && !isGlobalAdmin ? 'Mis eventos' : item.label}</span>
                            <span className={cn('mt-0.5 block text-xs', active ? 'text-sky-200/80' : 'text-slate-400')}>
                              {item.description}
                            </span>
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </section>
              </nav>
            </div>

            {/* Cuenta y acciones secundarias: visibles, pero sin competir con la operación. */}
            <details className="relative mt-4 shrink-0 border-t border-white/10 pt-3">
              <summary
                title={collapsed ? identity.email ?? 'Cuenta' : undefined}
                className={cn(
                  'group flex cursor-pointer list-none items-center rounded-2xl text-left transition hover:text-white [&::-webkit-details-marker]:hidden',
                  collapsed ? 'justify-center p-1.5' : 'gap-2 px-1.5 py-1.5'
                )}
              >
                <span className="grid size-8 flex-none place-items-center rounded-xl bg-white/10 text-xs font-bold uppercase text-slate-200">
                  {(identity.name ?? identity.email ?? '?').slice(0, 1)}
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {identity.name ?? identity.email ?? 'Sesión activa'}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {identity.isStaff ? 'Equipo Alista' : 'Tu cuenta'}
                    </span>
                  </span>
                )}
                <MoreHorizontal className="size-5 flex-none text-slate-400 transition group-hover:text-sky-200" aria-hidden="true" />
              </summary>

              <div className="absolute bottom-full left-0 z-30 mb-2 min-w-[220px] rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                {identity.email && (
                  <p className="truncate px-3 py-2 text-xs text-slate-400" title={identity.email}>
                    {identity.email}
                  </p>
                )}
                <form action="/acceso/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="size-4 text-slate-400" />
                    Cerrar sesión
                  </button>
                </form>
                <p className="border-t border-white/10 px-3 pb-1 pt-2 text-[10px] text-slate-500" title={`Versión ${APP_VERSION} · ${APP_VERSION_DATE}`}>
                  Alista · v{APP_VERSION} · {APP_VERSION_DATE}
                </p>
              </div>
            </details>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* El contexto vive en el sidebar y en cada superficie de trabajo. */}
          <header aria-hidden="true" className="hidden">
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

          <main className="pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

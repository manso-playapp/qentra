'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  DoorOpen,
  ExternalLink,
  LayoutDashboard,
  LoaderCircle,
  Mail,
  Pencil,
  ScanLine,
  Tv,
  Users2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatEventDate } from '@/lib/event-date'
import type { Event } from '@/types'

/* eslint-disable react-hooks/set-state-in-effect -- Este componente sincroniza el menu con rutas y APIs externas. */

type ActivationState = {
  activated: boolean
  source?: 'payment' | 'cortesia' | 'manual'
}

type EventNavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  external?: boolean
}

function getCurrentEventId(pathname: string) {
  const match = pathname.match(/^\/admin\/events\/([^/]+)/)
  return match?.[1] && match[1] !== 'new' ? match[1] : null
}

function isEventNavItemActive(pathname: string, href: string, eventId: string) {
  if (href === `/admin/events/${eventId}`) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function eventInitial(event?: Event) {
  return (event?.name ?? 'E').trim().slice(0, 1).toUpperCase()
}

function eventStatusLabel(event?: Event, activation?: ActivationState | null, loading?: boolean) {
  if (!event) return 'Elegí un evento'
  if (loading) return 'Consultando estado…'
  if (activation?.activated) return 'Activado'
  return 'Sin activar'
}

function eventStatusVariant(activation?: ActivationState | null, loading?: boolean) {
  if (loading) return 'outline' as const
  return activation?.activated ? 'success' as const : 'warning' as const
}

function buildEventNav(eventId: string): EventNavItem[] {
  return [
    { href: `/admin/events/${eventId}`, label: 'Resumen', icon: LayoutDashboard },
    { href: `/admin/events/${eventId}/invitacion`, label: 'Invitación', icon: Mail },
    { href: `/admin/events/${eventId}/guests`, label: 'Invitados', icon: Users2 },
    { href: `/admin/events/${eventId}/branding#mensajes-totem`, label: 'Tótem', icon: Tv },
    { href: `/admin/events/${eventId}/check-in`, label: 'Check-in', icon: ScanLine },
    { href: `/puerta/${eventId}`, label: 'Puerta', icon: DoorOpen, external: true },
  ]
}

function NavigationLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: EventNavItem
  active: boolean
  collapsed: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      <span className={cn('p-2.5', active ? 'text-sky-200' : 'text-slate-400')}>
        <item.icon className="size-4" />
      </span>
      {!collapsed && <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>}
      {!collapsed && item.external && <ExternalLink className="size-3.5 text-slate-400" />}
    </>
  )

  const className = cn(
    'group relative flex items-center transition',
    collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2.5',
    active ? 'text-white' : 'text-slate-200 hover:text-white'
  )

  return (
    <Link
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noreferrer' : undefined}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={className}
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
      {content}
    </Link>
  )
}

export default function AdminEventSidebar({
  collapsed,
  isStaff,
}: {
  collapsed: boolean
  isStaff: boolean
}) {
  const pathname = usePathname()
  const currentEventId = getCurrentEventId(pathname)
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [eventMenuOpen, setEventMenuOpen] = useState(false)
  const [activation, setActivation] = useState<ActivationState | null>(null)
  const [activationLoading, setActivationLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setEventsLoading(true)
    setEventsError(null)

    void fetch('/api/events')
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { data?: Event[]; error?: string } | null
        if (!response.ok) throw new Error(payload?.error ?? 'No se pudieron cargar los eventos.')
        if (mounted) setEvents(payload?.data ?? [])
      })
      .catch((error: unknown) => {
        if (mounted) setEventsError(error instanceof Error ? error.message : 'No se pudieron cargar los eventos.')
      })
      .finally(() => {
        if (mounted) setEventsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentEventId])

  useEffect(() => {
    setEventMenuOpen(false)
  }, [currentEventId])

  useEffect(() => {
    if (!currentEventId) {
      setActivation(null)
      setActivationLoading(false)
      return
    }

    let mounted = true
    setActivationLoading(true)

    void fetch(`/api/events/${currentEventId}/activation`)
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          data?: { state?: ActivationState }
        } | null
        if (mounted) setActivation(response.ok ? payload?.data?.state ?? null : null)
      })
      .catch(() => {
        if (mounted) setActivation(null)
      })
      .finally(() => {
        if (mounted) setActivationLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentEventId])

  const selectedEvent = events.find((event) => event.id === currentEventId)
  const eventNav = currentEventId ? buildEventNav(currentEventId) : []
  const statusLabel = eventStatusLabel(selectedEvent, activation, activationLoading)
  const statusVariant = eventStatusVariant(activation, activationLoading)

  if (collapsed) {
    return (
      <div className="mt-6 space-y-2">
        <Link
          href={selectedEvent ? `/admin/events/${selectedEvent.id}` : '/admin/events'}
          title={selectedEvent?.name ?? 'Mis eventos'}
          className="grid place-items-center rounded-[22px] border border-sky-400/30 bg-sky-400/15 p-3 text-lg font-semibold text-white"
        >
          {selectedEvent ? eventInitial(selectedEvent) : <CalendarDays className="size-5" />}
        </Link>
        {eventNav.map((item) => (
          <NavigationLink
            key={item.href}
            item={item}
            active={isEventNavItemActive(pathname, item.href, currentEventId ?? '')}
            collapsed
          />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-3">
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-200/70">Evento seleccionado</p>
          {events.length > 0 && <span className="text-[10px] text-slate-500">{events.length} total</span>}
        </div>

        {selectedEvent ? (
          <>
            <button
              type="button"
              onClick={() => setEventMenuOpen((open) => !open)}
              aria-expanded={eventMenuOpen}
              aria-controls="admin-event-selector"
              className="flex w-full items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.08] p-3 text-left transition hover:border-sky-400/40 hover:bg-white/[0.12]"
            >
              <span className="grid size-11 flex-none place-items-center rounded-2xl bg-sky-400/20 text-lg font-semibold text-sky-100">
                {eventInitial(selectedEvent)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{selectedEvent.name}</span>
                <span className="mt-1 block truncate text-xs text-slate-400">
                  {formatEventDate(selectedEvent.event_date)} · {selectedEvent.venue_name}
                </span>
              </span>
              <ChevronDown className={cn('size-4 flex-none text-slate-300 transition-transform', eventMenuOpen && 'rotate-180')} />
            </button>

            {eventMenuOpen && (
              <div id="admin-event-selector" className="mt-2 space-y-1 rounded-[24px] border border-white/10 bg-slate-950/70 p-2">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    onClick={() => setEventMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 transition',
                      event.id === selectedEvent.id ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span className="grid size-8 flex-none place-items-center rounded-xl bg-white/10 text-xs font-semibold">{eventInitial(event)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{event.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{formatEventDate(event.event_date)}</span>
                    </span>
                    {event.id === selectedEvent.id && <Badge variant="info" className="px-2 py-0.5 text-[9px]">Actual</Badge>}
                  </Link>
                ))}
                <Link href="/admin/events" onClick={() => setEventMenuOpen(false)} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-semibold text-sky-200 transition hover:bg-white/5">
                  Ver todos los eventos
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-2 px-1">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              {activation?.activated ? <BadgeCheck className="size-4 text-emerald-300" /> : null}
            </div>
          </>
        ) : (
          <Link href="/admin/events" className="flex items-center gap-3 rounded-[24px] border border-dashed border-white/15 bg-white/[0.04] p-4 text-slate-300 transition hover:border-sky-400/40 hover:bg-white/[0.08] hover:text-white">
            {eventsLoading ? <LoaderCircle className="size-5 animate-spin" /> : <CalendarDays className="size-5" />}
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{eventsLoading ? 'Cargando eventos…' : 'Elegí un evento'}</span>
              <span className="mt-1 block text-xs text-slate-500">{eventsError ?? (isStaff ? 'Abrí una agenda para operar.' : 'Abrí una agenda para empezar.')}</span>
            </span>
          </Link>
        )}
      </section>

      {eventNav.length > 0 && (
        <section>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Operar este evento</p>
          <nav className="space-y-0.5" aria-label="Secciones del evento">
            {eventNav.map((item) => (
              <NavigationLink
                key={item.href}
                item={item}
                active={isEventNavItemActive(pathname, item.href, currentEventId ?? '')}
                collapsed={false}
              />
            ))}
          </nav>
        </section>
      )}

      {selectedEvent && (
        <Link href={`/admin/events/${selectedEvent.id}/edit`} className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-400 transition hover:text-white">
          <Pencil className="size-3.5" />
          Editar datos del evento
        </Link>
      )}
    </div>
  )
}

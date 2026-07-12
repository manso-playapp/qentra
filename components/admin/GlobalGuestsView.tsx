'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { DbGuestStatus } from '@/lib/guest-schema'
import {
  GUEST_DB_STATUS_LABELS,
  GUEST_DB_STATUS_STYLES,
  GUEST_DB_STATUS_ORDER,
} from '@/lib/guest-status-display'

export type GlobalGuest = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: string
  photo_url: string | null
  event_id: string
  event_name: string
  type_name: string | null
  created_at: string
}

type EventOption = { id: string; name: string }

function statusMeta(status: string) {
  const key = status as DbGuestStatus
  return {
    label: GUEST_DB_STATUS_LABELS[key] ?? status,
    style: GUEST_DB_STATUS_STYLES[key] ?? 'bg-gray-100 text-gray-700',
  }
}

export default function GlobalGuestsView({
  guests,
  events,
}: {
  guests: GlobalGuest[]
  events: EventOption[]
}) {
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Solo los estados que realmente aparecen, en el orden del ciclo.
  const presentStatuses = useMemo(() => {
    const set = new Set(guests.map((guest) => guest.status))
    return GUEST_DB_STATUS_ORDER.filter((status) => set.has(status))
  }, [guests])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return guests.filter((guest) => {
      if (eventFilter !== 'all' && guest.event_id !== eventFilter) return false
      if (statusFilter !== 'all' && guest.status !== statusFilter) return false
      if (!needle) return true
      const haystack = `${guest.first_name} ${guest.last_name} ${guest.email ?? ''} ${
        guest.phone ?? ''
      }`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [guests, query, eventFilter, statusFilter])

  const selectClass =
    'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Todos los invitados</h2>
          <p className="mt-1 text-sm text-gray-600">
            Buscá entre eventos por nombre, email o teléfono.
          </p>
        </div>
        <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {filtered.length} de {guests.length}
        </span>
      </div>

      {/* Controles de busqueda y filtro. */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, email o teléfono"
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(event) => setEventFilter(event.target.value)}
          className={selectClass}
          aria-label="Filtrar por evento"
        >
          <option value="all">Todos los eventos</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={selectClass}
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          {presentStatuses.map((status) => (
            <option key={status} value={status}>
              {GUEST_DB_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {/* Listado. */}
      {filtered.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
          {guests.length === 0
            ? 'Todavía no hay invitados cargados en ningún evento.'
            : 'Ningún invitado coincide con la búsqueda.'}
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-gray-100">
          {filtered.map((guest) => {
            const meta = statusMeta(guest.status)
            return (
              <li key={guest.id} className="flex items-center gap-3 py-3">
                {guest.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={guest.photo_url}
                    alt={`Foto de ${guest.first_name} ${guest.last_name}`}
                    className="size-10 flex-none rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <span className="flex size-10 flex-none items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-500">
                    {`${guest.first_name?.[0] ?? ''}${guest.last_name?.[0] ?? ''}`.toUpperCase() ||
                      '?'}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-gray-900">
                      {guest.first_name} {guest.last_name}
                    </p>
                    <span
                      className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.style}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {guest.event_name}
                    {guest.type_name ? ` · ${guest.type_name}` : ''}
                    {guest.email ? ` · ${guest.email}` : guest.phone ? ` · ${guest.phone}` : ''}
                  </p>
                </div>

                <Link
                  href={`/admin/events/${guest.event_id}/guests`}
                  className="flex-none rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Ver
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

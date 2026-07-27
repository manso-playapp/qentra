'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useGuests } from '@/lib/hooks'
import type { GuestWithType } from '@/types'

type EventTablesManagerProps = {
  event: { id: string; name: string }
  initialGuests: GuestWithType[]
}

export default function EventTablesManager({ event, initialGuests }: EventTablesManagerProps) {
  const { guests, loading, error, updateGuest } = useGuests(event.id, initialGuests)
  const [query, setQuery] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingGuestId, setSavingGuestId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const confirmedGuests = useMemo(
    () => guests.filter((guest) => guest.status === 'confirmed' || guest.status === 'checked_in'),
    [guests]
  )

  const filteredGuests = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es-AR')
    if (!term) return confirmedGuests

    return confirmedGuests.filter((guest) =>
      `${guest.first_name} ${guest.last_name} ${guest.table_assignment ?? ''}`
        .toLocaleLowerCase('es-AR')
        .includes(term)
    )
  }, [confirmedGuests, query])

  const summary = useMemo(() => {
    const groups = new Map<string, { groups: number; people: number }>()
    let unassignedGroups = 0
    let unassignedPeople = 0

    for (const guest of confirmedGuests) {
      const people = 1 + guest.plus_ones_confirmed
      const destination = guest.table_assignment?.trim()
      if (!destination) {
        unassignedGroups += 1
        unassignedPeople += people
        continue
      }

      const current = groups.get(destination) ?? { groups: 0, people: 0 }
      groups.set(destination, { groups: current.groups + 1, people: current.people + people })
    }

    return {
      unassignedGroups,
      unassignedPeople,
      destinations: [...groups.entries()]
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es-AR')),
    }
  }, [confirmedGuests])

  const saveDestination = async (guest: GuestWithType) => {
    const destination = (drafts[guest.id] ?? guest.table_assignment ?? '').trim()
    setSavingGuestId(guest.id)
    setNotice(null)
    setActionError(null)

    const result = await updateGuest(guest.id, { table_assignment: destination || null })
    if (result.error) {
      setActionError(result.error)
    } else {
      setDrafts((current) => ({ ...current, [guest.id]: destination }))
      setNotice(destination ? 'Mesa actualizada.' : 'Destino quitado.')
    }
    setSavingGuestId(null)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/admin/events/${event.id}/guests`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
            ← Volver a invitados
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Conformación de mesas</h1>
          <p className="mt-2 text-gray-600">{event.name} · asigná destinos solamente a grupos confirmados.</p>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-800">
          {confirmedGuests.length} grupos confirmados
        </span>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Sin mesa</p>
          <p className="mt-1 text-2xl font-semibold text-gray-950">{summary.unassignedGroups}</p>
          <p className="mt-1 text-sm text-gray-600">{summary.unassignedPeople} personas por ubicar</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Destinos armados</p>
          <p className="mt-1 text-2xl font-semibold text-gray-950">{summary.destinations.length}</p>
          <p className="mt-1 text-sm text-gray-600">mesas o sectores</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Personas confirmadas</p>
          <p className="mt-1 text-2xl font-semibold text-gray-950">
            {confirmedGuests.reduce((total, guest) => total + 1 + guest.plus_ones_confirmed, 0)}
          </p>
          <p className="mt-1 text-sm text-gray-600">incluye acompañantes</p>
        </div>
      </div>

      {actionError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">No se pudieron cargar algunos invitados: {error}</p>}
      {notice && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_340px]">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Asignar grupos</h2>
              <p className="mt-1 text-sm text-gray-600">Cada destino incluye al titular y sus acompañantes confirmados.</p>
            </div>
            <input
              value={query}
              onChange={(eventInput) => setQuery(eventInput.target.value)}
              placeholder="Buscar invitado o mesa"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:w-60"
            />
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-500">Cargando invitados...</div>
          ) : filteredGuests.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
              {confirmedGuests.length === 0 ? 'Todavía no hay invitados confirmados.' : 'No hay resultados para esta búsqueda.'}
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              {filteredGuests.map((guest) => {
                const currentDestination = drafts[guest.id] ?? guest.table_assignment ?? ''
                const people = 1 + guest.plus_ones_confirmed
                const saving = savingGuestId === guest.id

                return (
                  <div key={guest.id} className="grid gap-3 border-b border-gray-200 px-3 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(250px,.9fr)] md:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{guest.first_name} {guest.last_name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {people} {people === 1 ? 'persona' : 'personas'} · {guest.guest_types?.name ?? 'Sin tipo'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={currentDestination}
                        onChange={(eventInput) => setDrafts((current) => ({ ...current, [guest.id]: eventInput.target.value }))}
                        onKeyDown={(eventInput) => {
                          if (eventInput.key === 'Enter') {
                            eventInput.preventDefault()
                            void saveDestination(guest)
                          }
                        }}
                        placeholder="Mesa 4, VIP, Sector A..."
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        aria-label={`Destino para ${guest.first_name} ${guest.last_name}`}
                      />
                      <button
                        type="button"
                        onClick={() => void saveDestination(guest)}
                        disabled={saving}
                        className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? '...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-sky-200 bg-sky-50/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Resumen por destino</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Cantidad de personas, incluyendo acompañantes.</p>
          <div className="mt-4 space-y-2">
            {summary.destinations.length === 0 ? (
              <p className="rounded-lg bg-white/80 p-4 text-sm text-gray-600">Todavía no hay mesas asignadas.</p>
            ) : (
              summary.destinations.map((destination) => (
                <div key={destination.name} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{destination.name}</p>
                    <p className="text-xs text-slate-500">{destination.groups} grupos</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold text-sky-800">{destination.people} personas</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

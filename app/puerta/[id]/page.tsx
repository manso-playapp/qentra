import { notFound } from 'next/navigation'
import EventCheckinManager from '@/components/admin/EventCheckinManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Event } from '@/types'

type DoorPageProps = {
  params: Promise<{ id: string }>
}

export default async function DoorPage({ params }: DoorPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, name, slug, event_date, start_time')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#0f172a_0%,#111827_16%,#f8fafc_16%,#f8fafc_100%)] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-red-200 bg-white p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-600">Puerta</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">No se pudo abrir la vista de control</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Verifica la conexion con Supabase y vuelve a intentarlo.
          </p>
        </div>
      </main>
    )
  }

  if (!data) {
    notFound()
  }

  return (
    <EventCheckinManager
      event={data as Pick<Event, 'id' | 'name' | 'slug' | 'event_date' | 'start_time'>}
      mode="door"
    />
  )
}

import { notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import EventGuestsManager from '@/components/admin/EventGuestsManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Event } from '@/types'

type EventGuestsPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventGuestsPage({ params }: EventGuestsPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, name, slug, max_capacity, event_date, start_time, delivery_profile_id')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          No se pudo cargar el modulo de invitados. Verifica la conexion con Supabase y las politicas del proyecto.
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    notFound()
  }

  return (
    <AdminLayout>
      <EventGuestsManager event={data as Pick<Event, 'id' | 'name' | 'slug' | 'max_capacity' | 'event_date' | 'start_time' | 'delivery_profile_id'>} />
    </AdminLayout>
  )
}

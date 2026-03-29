import { notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import EventCheckinManager from '@/components/admin/EventCheckinManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Event } from '@/types'

type EventCheckinPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventCheckinPage({ params }: EventCheckinPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, name, slug, event_date, start_time')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          No se pudo cargar el modulo de check-in. Verifica la conexion con Supabase y las politicas del proyecto.
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    notFound()
  }

  return (
    <AdminLayout>
      <EventCheckinManager event={data as Pick<Event, 'id' | 'name' | 'slug' | 'event_date' | 'start_time'>} />
    </AdminLayout>
  )
}

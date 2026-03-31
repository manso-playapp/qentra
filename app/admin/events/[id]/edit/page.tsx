import { notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import EditEventForm from '@/components/admin/EditEventForm'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Event } from '@/types'

type EditEventPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('events')
    .select('id, name, slug, event_type, event_date, start_time, venue_name, venue_address, max_capacity, description, contact_phone, delivery_profile_id, status')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          No se pudo cargar el evento para editar. Verifica la conexion con Supabase y vuelve a intentarlo.
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    notFound()
  }

  return (
    <AdminLayout>
      <EditEventForm
        event={data as Pick<
          Event,
          | 'id'
          | 'name'
          | 'slug'
          | 'event_type'
          | 'event_date'
          | 'start_time'
          | 'venue_name'
          | 'venue_address'
          | 'max_capacity'
          | 'description'
          | 'contact_phone'
          | 'delivery_profile_id'
          | 'status'
        >}
      />
    </AdminLayout>
  )
}

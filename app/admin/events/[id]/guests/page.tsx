import { notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import EventGuestsManager from '@/components/admin/EventGuestsManager'
import { normalizeGuestRecord } from '@/lib/guest-schema'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Event, GuestType, GuestWithType } from '@/types'

type EventGuestsPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventGuestsPage({ params }: EventGuestsPageProps) {
  const { id } = await params
  const supabase = getSupabaseAdminClient() ?? await createServerSupabaseClient()
  const [eventResponse, guestTypesResponse, guestsResponse] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, slug, max_capacity, event_date, start_time, delivery_profile_id')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('guest_types').select('*').eq('event_id', id).order('created_at', { ascending: true }),
    supabase
      .from('guests')
      .select(`
        *,
        guest_types (
          name,
          description,
          access_policy_label,
          access_start_time,
          access_end_time,
          access_start_day_offset,
          access_end_day_offset
        )
      `)
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (eventResponse.error) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          No se pudo cargar el modulo de invitados. Verifica la conexion con Supabase y las politicas del proyecto.
        </div>
      </AdminLayout>
    )
  }

  if (!eventResponse.data) {
    notFound()
  }

  const initialGuestTypes = (guestTypesResponse.data ?? []) as GuestType[]
  const initialGuests = ((guestsResponse.data ?? []) as GuestWithType[]).map((guest) => normalizeGuestRecord(guest))

  return (
    <AdminLayout>
      <EventGuestsManager
        event={eventResponse.data as Pick<Event, 'id' | 'name' | 'slug' | 'max_capacity' | 'event_date' | 'start_time' | 'delivery_profile_id'>}
        initialGuestTypes={initialGuestTypes}
        initialGuests={initialGuests}
      />
    </AdminLayout>
  )
}

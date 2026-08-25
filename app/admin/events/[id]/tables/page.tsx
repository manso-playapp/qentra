import { notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import EventTablesManager from '@/components/admin/EventTablesManager'
import { normalizeGuestRecord } from '@/lib/guest-schema'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { GuestWithType } from '@/types'

export const metadata = {
  title: 'Conformación de mesas',
}

type EventTablesPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventTablesPage({ params }: EventTablesPageProps) {
  const { id } = await params
  const supabase = getSupabaseAdminClient() ?? (await createServerSupabaseClient())
  const [eventResponse, guestsResponse] = await Promise.all([
    supabase.from('events').select('id, name').eq('id', id).maybeSingle(),
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
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true }),
  ])

  if (eventResponse.error || !eventResponse.data) notFound()

  const initialGuests = ((guestsResponse.data ?? []) as GuestWithType[]).map((guest) => normalizeGuestRecord(guest))

  return (
    <AdminLayout>
      <EventTablesManager event={eventResponse.data} initialGuests={initialGuests} />
    </AdminLayout>
  )
}

import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/card'
import GlobalGuestsView, { type GlobalGuest } from '@/components/admin/GlobalGuestsView'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const metadata = {
  title: 'Invitados',
}

type GuestRow = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  status: string | null
  photo_url: string | null
  event_id: string
  created_at: string
  guest_types: { name: string } | { name: string }[] | null
}

function guestTypeName(value: GuestRow['guest_types']): string | null {
  if (!value) return null
  return (Array.isArray(value) ? value[0]?.name : value.name) ?? null
}

// Vista maestra: invitados de todos los eventos. Lee con service role porque RLS
// oculta guests al cliente con cookies (operator-auth no crea sesion de
// Supabase); la ruta ya esta protegida por el layout del admin.
export default async function GuestsPage() {
  const supabase = getSupabaseAdminClient()

  const errorCard = (message: string) => (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <Card className="bg-admin-panel">
          <CardContent className="p-8">
            <p className="text-sm text-rose-700">{message}</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )

  if (!supabase) {
    return errorCard('SUPABASE_SERVICE_ROLE_KEY no está configurada en el entorno.')
  }

  const [guestsResponse, eventsResponse] = await Promise.all([
    supabase
      .from('guests')
      .select(
        'id, first_name, last_name, email, phone, status, photo_url, event_id, created_at, guest_types(name)'
      )
      .order('created_at', { ascending: false }),
    supabase.from('events').select('id, name').order('event_date', { ascending: false }),
  ])

  if (guestsResponse.error) {
    return errorCard(`No se pudieron cargar los invitados: ${guestsResponse.error.message}`)
  }

  const events = (eventsResponse.data ?? []) as { id: string; name: string }[]
  const eventNameById = new Map(events.map((event) => [event.id, event.name]))

  const guests: GlobalGuest[] = ((guestsResponse.data ?? []) as GuestRow[]).map((row) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    status: row.status ?? 'preinvited',
    photo_url: row.photo_url,
    event_id: row.event_id,
    event_name: eventNameById.get(row.event_id) ?? 'Evento sin nombre',
    type_name: guestTypeName(row.guest_types),
    created_at: row.created_at,
  }))

  // Solo eventos que tienen al menos un invitado, para no llenar el filtro.
  const eventsWithGuests = events.filter((event) =>
    guests.some((guest) => guest.event_id === event.id)
  )

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <GlobalGuestsView guests={guests} events={eventsWithGuests} />
      </div>
    </AdminLayout>
  )
}

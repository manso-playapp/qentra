import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/card'
import GlobalGuestsView, { type GlobalGuest } from '@/components/admin/GlobalGuestsView'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { getCurrentOperatorProfile } from '@/lib/operator-auth'
import { isAlistaStaff } from '@/lib/event-access'

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

// Vista transversal de invitados. Lee con service role porque RLS oculta guests
// al cliente con cookies (operator-auth no crea sesion de Supabase), y por eso
// mismo el alcance TIENE que restringirse aca: el layout del admin solo exige
// estar autenticado, no da acceso a los eventos de otra persona. Sin este filtro
// cualquier clienta veia nombre, email, telefono y foto de los invitados de
// todas las fiestas de Alista.
export default async function GuestsPage() {
  const supabase = getSupabaseAdminClient()
  const authState = await getCurrentOperatorProfile()
  const seesEveryEvent = isAlistaStaff(authState.access)
  const allowedEventIds = authState.manageableEventIds

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
    return errorCard('El panel de invitados no está disponible temporalmente. Contactá al equipo de Alista.')
  }

  // Sin eventos propios no hay nada que mostrar, y consultar sin filtro seria
  // justamente el bug.
  if (!seesEveryEvent && allowedEventIds.length === 0) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <GlobalGuestsView guests={[]} events={[]} />
        </div>
      </AdminLayout>
    )
  }

  let guestsQuery = supabase
    .from('guests')
    .select(
      'id, first_name, last_name, email, phone, status, photo_url, event_id, created_at, guest_types(name)'
    )
    .order('created_at', { ascending: false })
  let eventsQuery = supabase.from('events').select('id, name').order('event_date', { ascending: false })

  if (!seesEveryEvent) {
    guestsQuery = guestsQuery.in('event_id', allowedEventIds)
    eventsQuery = eventsQuery.in('id', allowedEventIds)
  }

  const [guestsResponse, eventsResponse] = await Promise.all([guestsQuery, eventsQuery])

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

import { notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import DoorScannerLink from '@/components/admin/DoorScannerLink'
import EventCheckinManager from '@/components/admin/EventCheckinManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Event } from '@/types'

export const metadata = {
  title: 'Check-in',
}

type EventCheckinPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventCheckinPage({ params }: EventCheckinPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, name, slug, event_date, start_time, max_capacity, guest_types(is_active, access_start_time, access_end_time, access_start_day_offset, access_end_day_offset)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <AdminLayout mobileEventNavigation>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          No se pudo cargar el Check-In. Volvé a cargar la página para intentarlo otra vez.
        </div>
      </AdminLayout>
    )
  }

  if (!data) {
    notFound()
  }

  return (
    <AdminLayout mobileEventNavigation>
      <EventCheckinManager
        event={data as Pick<Event, 'id' | 'name' | 'slug' | 'event_date' | 'start_time' | 'max_capacity' | 'guest_types'>}
        sidebarSlot={<DoorScannerLink eventId={id} />}
      />
      <details className="my-6 rounded-2xl border border-border/70 bg-white/70 p-5 text-slate-800">
        <summary className="cursor-pointer text-base font-semibold">Preparar al equipo de recepción</summary>
        <p className="mt-3 text-sm leading-6">Repasá estos puntos con el equipo antes de abrir. Esta guía no reemplaza el ensayo con los equipos y la conexión del lugar.</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>Designar a una persona de la organización para resolver dudas de lista, pagos y horarios.</li>
          <li>Asignar celulares cargados, cargadores y conexión. Confirmar quién los aporta y tener un equipo de reemplazo.</li>
          <li>Iniciar sesión en cada puesto y ensayar con invitaciones de prueba: acceso habilitado, pago pendiente, código repetido y grupo con acompañantes.</li>
          <li>Ante una excepción, apartar la consulta de la fila y avisar al referente. Un comprobante reenviado no habilita el acceso.</li>
          <li>Cuando el celular confirma el registro, dejar pasar. Si hay recibidor digital, ubicarlo después del control sin esperar su animación.</li>
        </ol>
        <p className="mt-3 text-sm font-medium">El personal de recepción lo aporta la organización. Acordá previamente el alcance y horario del soporte de Alista.</p>
      </details>
    </AdminLayout>
  )
}

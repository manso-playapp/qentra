import type { ReactNode } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import RoleAccessDeniedNotice from '@/components/auth/RoleAccessDeniedNotice'
import { requireAuthorizedEventPageAccess } from '@/lib/operator-auth'

type EventLayoutProps = {
  children: ReactNode
  params: Promise<{ id: string }>
}

// Carga el nombre del evento una sola vez para titular todas las pestañas del
// detalle (detalle, editar, invitados, check-in) con el evento al que pertenecen.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('events')
    .select('name')
    .eq('id', id)
    .maybeSingle()

  const eventName = data?.name ?? 'Evento'

  return {
    title: {
      default: eventName,
      template: `%s · ${eventName}`,
    },
  }
}

export default async function EventLayout({ children, params }: EventLayoutProps) {
  const { id } = await params
  const access = await requireAuthorizedEventPageAccess(`/admin/events/${id}`, id)

  if (!access.ok) {
    return <RoleAccessDeniedNotice areaLabel="este evento" reason={access.reason} />
  }

  return children
}

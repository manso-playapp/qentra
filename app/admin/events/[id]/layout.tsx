import type { ReactNode } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

export default function EventLayout({ children }: EventLayoutProps) {
  return children
}

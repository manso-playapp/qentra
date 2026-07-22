import { notFound } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BrandingForm from '@/components/admin/BrandingForm'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Event, EventBranding } from '@/types'

export const metadata = {
  title: 'Branding',
}

type BrandingPageProps = {
  params: Promise<{ id: string }>
}

export default async function BrandingPage({ params }: BrandingPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [eventResponse, brandingResponse] = await Promise.all([
    supabase.from('events').select('id, name, slug').eq('id', id).maybeSingle(),
    supabase.from('event_branding').select('*').eq('event_id', id).maybeSingle(),
  ])

  if (eventResponse.error) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
            No se pudo cargar el evento. Verificá la conexión con Supabase y volvé a intentarlo.
          </div>
        </div>
      </AdminLayout>
    )
  }

  const event = eventResponse.data as Pick<Event, 'id' | 'name' | 'slug'> | null
  if (!event) {
    notFound()
  }

  return (
    <AdminLayout>
      <BrandingForm
        eventId={event.id}
        eventSlug={event.slug}
        eventName={event.name}
        branding={(brandingResponse.data ?? null) as EventBranding | null}
      />
    </AdminLayout>
  )
}

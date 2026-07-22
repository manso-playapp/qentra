import { notFound } from 'next/navigation'
import EventCheckinManager from '@/components/admin/EventCheckinManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SURFACE_BRANDING_COLUMNS, type Event, type SurfaceBranding } from '@/types'

type ShortTotemPageProps = {
  params: Promise<{ slug: string }>
}

export default async function ShortTotemPage({ params }: ShortTotemPageProps) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const eventResponse = await supabase
    .from('events')
    .select('id, name, slug, event_date, start_time, max_capacity')
    .eq('slug', slug)
    .maybeSingle()

  const { data, error } = eventResponse

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white sm:px-10">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-red-400/30 bg-red-950/35 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-300">Tótem</p>
          <h1 className="mt-4 text-3xl font-semibold">No se pudo abrir la pantalla de bienvenida</h1>
          <p className="mt-3 text-sm leading-6 text-red-100/80">Verificá la conexión con Supabase y volvé a intentarlo.</p>
        </div>
      </main>
    )
  }

  if (!data) {
    notFound()
  }

  const brandingResponse = await supabase
    .from('event_branding')
    .select(SURFACE_BRANDING_COLUMNS)
    .eq('event_id', data.id)
    .maybeSingle()

  if (brandingResponse.error) {
    console.error('[totem] no se pudo cargar el branding del evento', brandingResponse.error)
  }

  return (
    <EventCheckinManager
      event={data as Pick<Event, 'id' | 'name' | 'slug' | 'event_date' | 'start_time' | 'max_capacity'>}
      branding={(brandingResponse.data ?? null) as SurfaceBranding | null}
      mode="totem"
    />
  )
}

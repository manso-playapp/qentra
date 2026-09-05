import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import InvitationEditor, {
  DEFAULT_INVITATION_CONFIG,
  type InvitationConfig,
} from '@/components/admin/InvitationEditor'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { DEFAULT_INVITATION_BLOCKS } from '@/lib/invitation-blocks'
import { getInvitationConfigHistory, getDraftInvitationConfig } from '@/lib/invitation-config-state'
import { DEFAULT_INVITATION_LOGO } from '@/lib/invitation-logo'

export const metadata = { title: 'Personalizar invitación' }

function mergeConfig(raw: unknown): InvitationConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_INVITATION_CONFIG
  const value = raw as Partial<InvitationConfig>
  const cleanValue = { ...value } as Partial<InvitationConfig> & Record<string, unknown>
  // No volver a reintroducir campos que ahora pertenecen a events al guardar.
  delete cleanValue.dresscode
  delete cleanValue.directionsUrl
  return {
    ...DEFAULT_INVITATION_CONFIG,
    ...cleanValue,
    colors: { ...DEFAULT_INVITATION_CONFIG.colors, ...(cleanValue.colors ?? {}) },
    fonts: { ...DEFAULT_INVITATION_CONFIG.fonts, ...(cleanValue.fonts ?? {}) },
    widgets: { ...DEFAULT_INVITATION_CONFIG.widgets, ...(cleanValue.widgets ?? {}) },
    fields: { ...DEFAULT_INVITATION_CONFIG.fields, ...(cleanValue.fields ?? {}) },
    blocks: { ...DEFAULT_INVITATION_BLOCKS, ...(cleanValue.blocks ?? {}) },
    logo: { ...DEFAULT_INVITATION_LOGO, ...(cleanValue.logo ?? {}) },
  }
}

export default async function InvitationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <Card className="bg-admin-panel">
            <CardContent className="p-8">
              <p className="text-sm text-rose-700">El editor de invitaciones no está disponible temporalmente. Contactá al equipo de Alista.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, name, event_date, start_time, venue_name, venue_address, dresscode, directions_url, gift_info, contact_phone')
    .eq('id', id)
    .maybeSingle()

  if (!event) notFound()

  const { data: previewGuests } = await supabase
    .from('guests')
    .select('id')
    .eq('event_id', id)

  let invitationPreviewToken: string | null = null
  const previewGuestIds = (previewGuests ?? []).map((guest) => guest.id)

  if (previewGuestIds.length > 0) {
    const { data: previewInvitation } = await supabase
      .from('invitation_tokens')
      .select('token')
      .in('guest_id', previewGuestIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    invitationPreviewToken = previewInvitation?.token ?? null
  }

  // select('*') para no romper si la columna config todavia no existe.
  const { data: branding } = await supabase
    .from('event_branding')
    .select('*')
    .eq('event_id', id)
    .maybeSingle()

  const brandingRow = (branding ?? {}) as Record<string, unknown>

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <AdminPageHeader title="Diseño de la invitación" eyebrow={event.name} backHref={`/admin/events/${id}`} description="Personalizá su fiesta y revisá cómo la verá cada invitado antes de guardar." actions={<><Button asChild variant="outline"><Link href={invitationPreviewToken ? `/invitacion/${invitationPreviewToken}` : `/invitacion/preview/${id}`} target="_blank" rel="noreferrer">{invitationPreviewToken ? 'Ver invitación en vivo' : 'Abrir vista previa'} <ExternalLink className="size-4" /></Link></Button><Button asChild variant="ghost" size="sm"><Link href={`/invitacion/preview/${id}?template=midnight`} target="_blank" rel="noreferrer">Comparar Noche <ExternalLink className="size-3.5" /></Link></Button></>} />
        <InvitationEditor
          eventId={id}
          event={{
            name: (event.name as string) ?? '',
            event_date: (event.event_date as string) ?? '',
            start_time: (event.start_time as string) ?? '',
            venue_name: (event.venue_name as string) ?? '',
            venue_address: (event.venue_address as string) ?? '',
            dresscode: (event.dresscode as string) ?? '',
            directions_url: (event.directions_url as string) ?? '',
            gift_info: (event.gift_info as string) ?? '',
            contact_phone: (event.contact_phone as string) ?? '',
          }}
          initialVisual={{
            primary_color: (brandingRow.primary_color as string) ?? '#8b5e3c',
            secondary_color: (brandingRow.secondary_color as string) ?? '#f1e8da',
            logo_url: (brandingRow.logo_url as string) ?? '',
            cover_image_url: (brandingRow.cover_image_url as string) ?? '',
          }}
          initialConfig={mergeConfig(getDraftInvitationConfig(brandingRow.config))}
          initialHistory={getInvitationConfigHistory(brandingRow.config)}
        />
      </div>
    </AdminLayout>
  )
}

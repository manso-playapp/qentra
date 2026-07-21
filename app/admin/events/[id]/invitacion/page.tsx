import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import InvitationEditor, {
  DEFAULT_INVITATION_CONFIG,
  type InvitationConfig,
} from '@/components/admin/InvitationEditor'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const metadata = { title: 'Personalizar invitación' }

function mergeConfig(raw: unknown): InvitationConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_INVITATION_CONFIG
  const value = raw as Partial<InvitationConfig>
  return {
    ...DEFAULT_INVITATION_CONFIG,
    ...value,
    widgets: { ...DEFAULT_INVITATION_CONFIG.widgets, ...(value.widgets ?? {}) },
    fields: { ...DEFAULT_INVITATION_CONFIG.fields, ...(value.fields ?? {}) },
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
              <p className="text-sm text-rose-700">SUPABASE_SERVICE_ROLE_KEY no está configurada.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, name, event_date, start_time, venue_name, venue_address')
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="px-0 text-primary hover:bg-transparent">
              <Link href={`/admin/events/${id}`}>
                <ArrowLeft className="size-4" />
                Volver al evento
              </Link>
            </Button>
            <h1 className="admin-heading mt-2 text-3xl text-foreground">Personalizar invitación</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Editá la landing que recibe cada invitado. Los cambios se ven en vivo a la derecha.
            </p>
          </div>
          {invitationPreviewToken ? (
            <Button asChild variant="outline">
              <Link href={`/invitacion/${invitationPreviewToken}`} target="_blank" rel="noreferrer">
                Ver invitación en vivo
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Emití una invitación para habilitar la vista en vivo.</p>
          )}
        </div>

        <InvitationEditor
          eventId={id}
          event={{
            name: (event.name as string) ?? '',
            event_date: (event.event_date as string) ?? '',
            start_time: (event.start_time as string) ?? '',
            venue_name: (event.venue_name as string) ?? '',
            venue_address: (event.venue_address as string) ?? '',
          }}
          initialVisual={{
            primary_color: (brandingRow.primary_color as string) ?? '#8b5e3c',
            secondary_color: (brandingRow.secondary_color as string) ?? '#f1e8da',
            logo_url: (brandingRow.logo_url as string) ?? '',
            cover_image_url: (brandingRow.cover_image_url as string) ?? '',
          }}
          initialConfig={mergeConfig(brandingRow.config)}
        />
      </div>
    </AdminLayout>
  )
}

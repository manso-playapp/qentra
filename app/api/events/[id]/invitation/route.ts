import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

export const runtime = 'nodejs'

const HEX = /^#[0-9a-fA-F]{6}$/

type PutBody = {
  visual?: {
    primary_color?: string
    secondary_color?: string
    logo_url?: string
    cover_image_url?: string
  }
  config?: unknown
}

function trimmedOrNull(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

// Guarda la personalizacion de la invitacion: los campos visuales viven en
// columnas de event_branding; la config rica (widgets, dresscode, campos, etc.)
// va en event_branding.config (jsonb). Si esa columna todavia no existe, se
// guarda igual el aspecto y se avisa que la config necesita la migracion.
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const { id: eventId } = await context.params
  const body = (await request.json().catch(() => null)) as PutBody | null
  const v = body?.visual ?? {}

  const visualPayload: Record<string, string | null> = {
    primary_color: HEX.test(v.primary_color ?? '') ? v.primary_color! : '#8b5e3c',
    secondary_color: HEX.test(v.secondary_color ?? '') ? v.secondary_color! : '#f1e8da',
    logo_url: trimmedOrNull(v.logo_url),
    cover_image_url: trimmedOrNull(v.cover_image_url),
  }

  const { data: existing } = await adminClient
    .from('event_branding')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle()

  // 1) Guardar el aspecto (columnas que seguro existen).
  const write = existing
    ? adminClient.from('event_branding').update(visualPayload).eq('event_id', eventId)
    : adminClient.from('event_branding').insert({ event_id: eventId, ...visualPayload })

  const { error: visualError } = await write
  if (visualError) {
    return Response.json({ error: visualError.message }, { status: 500 })
  }

  // 2) Guardar la config rica en la columna jsonb. Si no existe, degradar.
  let configPersisted = true
  if (body?.config !== undefined) {
    const { error: configError } = await adminClient
      .from('event_branding')
      .update({ config: body.config })
      .eq('event_id', eventId)
    if (configError) {
      configPersisted = false
    }
  }

  return Response.json({ ok: true, configPersisted })
}

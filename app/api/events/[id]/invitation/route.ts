import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { normalizeInvitationBlocks } from '@/lib/invitation-blocks'
import { buildInvitationConfigEnvelope, getInvitationConfigHistory, getInvitationConfigState, type InvitationConfigHistoryEntry } from '@/lib/invitation-config-state'

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
  mode?: 'draft' | 'publish'
}

function trimmedOrNull(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

// Guarda la personalizacion de la invitacion: los campos visuales viven en
// columnas de event_branding; la config rica (widgets, campos, etc.)
// va en event_branding.config (jsonb). Si esa columna todavia no existe, se
// guarda igual el aspecto y se avisa que la config necesita la migracion.
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await context.params
  const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(eventId)
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => null)) as PutBody | null
  const v = body?.visual ?? {}

  const visualPayload: Record<string, string | null> = {
    primary_color: HEX.test(v.primary_color ?? '') ? v.primary_color! : '#8b5e3c',
    secondary_color: HEX.test(v.secondary_color ?? '') ? v.secondary_color! : '#f1e8da',
    logo_url: trimmedOrNull(v.logo_url),
    cover_image_url: trimmedOrNull(v.cover_image_url),
  }

  const { data: existingWithConfig, error: existingConfigError } = await adminClient
    .from('event_branding')
    .select('id, config')
    .eq('event_id', eventId)
    .maybeSingle()
  const existing = existingConfigError
    ? (await adminClient.from('event_branding').select('id').eq('event_id', eventId).maybeSingle()).data
    : existingWithConfig

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
  let savedHistory: InvitationConfigHistoryEntry[] = []
  if (body?.config !== undefined) {
    const rawConfig = body.config
    const configPayload = rawConfig && typeof rawConfig === 'object' && !Array.isArray(rawConfig)
      ? {
          ...(rawConfig as Record<string, unknown>),
          blocks: normalizeInvitationBlocks((rawConfig as Record<string, unknown>).blocks),
        }
      : { blocks: {} }
    const currentConfig = existing && 'config' in existing ? existing.config : null
    const currentState = getInvitationConfigState(currentConfig)
    const previousConfig = currentState.draft && typeof currentState.draft === 'object' && !Array.isArray(currentState.draft)
      ? currentState.draft as Record<string, unknown>
      : null
    const savedAt = new Date().toISOString()
    const history = previousConfig
      ? [
          {
            id: crypto.randomUUID(),
            saved_at: savedAt,
            mode: body.mode === 'publish' ? 'publish' as const : 'draft' as const,
            config: previousConfig,
          },
          ...getInvitationConfigHistory(currentConfig),
        ].slice(0, 10)
      : getInvitationConfigHistory(currentConfig)
    const nextEnvelope = buildInvitationConfigEnvelope({
      current: currentConfig,
      draft: configPayload,
      publish: body.mode === 'publish',
      history,
    })
    const { error: configError } = await adminClient
      .from('event_branding')
      .update({
        config: nextEnvelope,
      })
      .eq('event_id', eventId)
    if (configError) {
      configPersisted = false
    } else {
      savedHistory = history
    }
  }

  const configState = getInvitationConfigState(
    body?.config !== undefined
      ? buildInvitationConfigEnvelope({ current: existing && 'config' in existing ? existing.config : null, draft: body.config, publish: body.mode === 'publish' })
      : existing && 'config' in existing ? existing.config : null
  )

  return Response.json({
    ok: true,
    configPersisted,
    mode: body?.mode === 'publish' ? 'publish' : 'draft',
    published: body?.mode === 'publish',
    hasDraft: configState.hasDraft,
    history: savedHistory,
  })
}

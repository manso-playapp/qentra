import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import type { UpdateEventBrandingForm } from '@/types'

export const runtime = 'nodejs'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

type BrandingRequestBody = { event_id?: string } & UpdateEventBrandingForm

function trimmedOrNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function GET(request: Request) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const eventId = new URL(request.url).searchParams.get('eventId')?.trim()
  if (!eventId) {
    return Response.json({ error: 'Falta eventId.' }, { status: 400 })
  }

  const { data, error } = await adminClient
    .from('event_branding')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data: data ?? null })
}

// PUT hace upsert: la fila de branding puede no existir todavia para un evento.
export async function PUT(request: Request) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => null)) as BrandingRequestBody | null
  const eventId = body?.event_id?.trim()

  if (!body || !eventId) {
    return Response.json({ error: 'Falta event_id.' }, { status: 400 })
  }

  if (body.primary_color && !HEX_COLOR.test(body.primary_color)) {
    return Response.json({ error: 'El color primario debe ser un hex tipo #RRGGBB.' }, { status: 400 })
  }
  if (body.secondary_color && !HEX_COLOR.test(body.secondary_color)) {
    return Response.json({ error: 'El color secundario debe ser un hex tipo #RRGGBB.' }, { status: 400 })
  }

  const idle = Number(body.return_to_idle_seconds)
  const returnToIdle = Number.isFinite(idle) ? Math.min(Math.max(Math.round(idle), 2), 30) : 5

  const payload = {
    event_id: eventId,
    primary_color: body.primary_color?.trim() || '#8b5e3c',
    secondary_color: body.secondary_color?.trim() || '#f1e8da',
    logo_url: trimmedOrNull(body.logo_url),
    cover_image_url: trimmedOrNull(body.cover_image_url),
    background_image_url: trimmedOrNull(body.background_image_url),
    welcome_message: trimmedOrNull(body.welcome_message),
    approved_message: trimmedOrNull(body.approved_message),
    assistance_message: trimmedOrNull(body.assistance_message),
    invalid_message: trimmedOrNull(body.invalid_message),
    return_to_idle_seconds: returnToIdle,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await adminClient
    .from('event_branding')
    .upsert(payload, { onConflict: 'event_id' })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}

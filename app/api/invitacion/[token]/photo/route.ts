import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

// Subida de la foto del invitado desde la pagina publica de invitacion. El
// invitado es anonimo: se autoriza por el token (que identifica al invitado y
// su evento), no por rol admin. La foto va al bucket privado guest-photos.

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

// Firma larga: la foto tiene que seguir visible el dia del evento, que puede ser
// semanas despues de la carga. El path es deterministico, asi que re-subir pisa.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params
  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY para guardar la foto.' },
      { status: 500 }
    )
  }

  // El token es la autorizacion: valido que exista, este activo y sin usar.
  const { data: invitationToken, error: tokenError } = await adminClient
    .from('invitation_tokens')
    .select('guest_id, used_count, last_used_at, is_active')
    .eq('token', token)
    .maybeSingle()

  if (tokenError) {
    return Response.json({ error: tokenError.message }, { status: 500 })
  }
  if (!invitationToken) {
    return Response.json({ error: 'No se encontró la invitación.' }, { status: 404 })
  }
  if (
    (invitationToken.used_count ?? 0) > 0 ||
    Boolean(invitationToken.last_used_at) ||
    invitationToken.is_active === false
  ) {
    return Response.json({ error: 'La invitación ya fue utilizada.' }, { status: 409 })
  }

  const { data: guest, error: guestError } = await adminClient
    .from('guests')
    .select('id, event_id')
    .eq('id', invitationToken.guest_id)
    .maybeSingle()

  if (guestError) {
    return Response.json({ error: guestError.message }, { status: 500 })
  }
  if (!guest) {
    return Response.json({ error: 'No se encontró el invitado.' }, { status: 404 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Se esperaba multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'Falta la foto.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: 'Formato no permitido. Usá una foto PNG, JPG o WEBP.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'La foto supera el límite de 5 MB.' }, { status: 400 })
  }

  const ext = EXT_BY_TYPE[file.type] ?? 'jpg'
  // Path deterministico por invitado: re-subir reemplaza la foto anterior.
  const path = `${guest.event_id}/${guest.id}.${ext}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await adminClient.storage
    .from('guest-photos')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: signed, error: signedError } = await adminClient.storage
    .from('guest-photos')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (signedError) {
    return Response.json({ error: signedError.message }, { status: 500 })
  }

  const { error: updateError } = await adminClient
    .from('guests')
    .update({ photo_url: signed.signedUrl })
    .eq('id', guest.id)

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  return Response.json({ data: { url: signed.signedUrl } })
}

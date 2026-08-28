import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'

export const runtime = 'nodejs'

// Buckets permitidos y como se sirve cada uno. event-assets es publico (logos y
// portadas se ven en paginas publicas); guest-photos es privado (caras de
// personas) y se sirve con URL firmada.
const BUCKETS = {
  'event-assets': { public: true },
  'guest-photos': { public: false },
} as const

type BucketName = keyof typeof BUCKETS

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_AUDIO_BYTES = 20 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const ALLOWED_AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac'])
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/aac': 'aac',
}

// Firma por una semana: alcanza para el uso operativo y evita exponer el objeto.
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60)
}

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Se esperaba multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file')
  const bucket = String(formData.get('bucket') || '') as BucketName
  const folder = sanitizeSegment(String(formData.get('folder') || 'general'))
  const label = sanitizeSegment(String(formData.get('label') || 'file'))

  if (!(file instanceof File)) {
    return Response.json({ error: 'Falta el archivo.' }, { status: 400 })
  }
  if (!(bucket in BUCKETS)) {
    return Response.json({ error: 'Bucket no permitido.' }, { status: 400 })
  }
  const isImage = ALLOWED_IMAGE_TYPES.has(file.type)
  const isAudio = ALLOWED_AUDIO_TYPES.has(file.type)
  if (!isImage && !isAudio) {
    return Response.json({ error: 'Formato no permitido. Usá PNG, JPG, WEBP, SVG, MP3, M4A, WAV, OGG o WEBM.' }, { status: 400 })
  }
  if (isAudio && bucket !== 'event-assets') {
    return Response.json({ error: 'Los audios solo se pueden guardar como recursos del evento.' }, { status: 400 })
  }
  const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(folder)
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }
  const maxBytes = isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxBytes) {
    return Response.json({ error: isAudio ? 'El audio supera el límite de 20 MB.' : 'La imagen supera el límite de 5 MB.' }, { status: 400 })
  }

  const ext = EXT_BY_TYPE[file.type] ?? 'bin'
  // Nombre unico sin depender de Math.random: el timestamp basta para el volumen real.
  const path = `${folder}/${label}-${Date.now()}.${ext}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await adminClient.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  if (BUCKETS[bucket].public) {
    const { data } = adminClient.storage.from(bucket).getPublicUrl(path)
    return Response.json({ data: { path, url: data.publicUrl } })
  }

  const { data, error: signedError } = await adminClient.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (signedError) {
    return Response.json({ error: signedError.message }, { status: 500 })
  }

  return Response.json({ data: { path, url: data.signedUrl } })
}

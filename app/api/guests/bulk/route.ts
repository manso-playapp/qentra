import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { buildGuestFullName } from '@/lib/guest-schema'
import {
  isTableAssignmentColumnMissingError,
  upsertTableAssignmentInNotes,
} from '@/lib/invitation-response'

// Alta masiva de invitados: inserta todas las filas en una sola operacion.
// Cada invitado entra como 'preinvited' con el mismo tipo (el que elige el
// operador para el lote). Las filas sin nombre se descartan.

type BulkGuestRow = {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  table_assignment?: string
}

type BulkGuestsRequestBody = {
  event_id?: string
  guest_type_id?: string
  guests?: BulkGuestRow[]
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => null)) as BulkGuestsRequestBody | null
  const eventId = body?.event_id?.trim()
  const guestTypeId = body?.guest_type_id?.trim()
  const rows = Array.isArray(body?.guests) ? body.guests : []

  if (!eventId || !guestTypeId) {
    return Response.json({ error: 'Falta el evento o el tipo de invitado.' }, { status: 400 })
  }

  const payload = rows
    .map((row) => {
      const firstName = row.first_name?.trim() ?? ''
      const lastName = row.last_name?.trim() ?? ''
      if (!firstName) return null
      return {
        event_id: eventId,
        guest_type_id: guestTypeId,
        first_name: firstName,
        last_name: lastName || null,
        full_name: buildGuestFullName(firstName, lastName),
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        table_assignment: row.table_assignment?.trim() || null,
        created_manually: true,
        status: 'preinvited',
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  if (payload.length === 0) {
    return Response.json(
      { error: 'No hay invitados validos para importar (cada fila necesita al menos un nombre).' },
      { status: 400 }
    )
  }

  const { error } = await adminClient.from('guests').insert(payload)

  // Fallback: si la columna table_assignment no existe (migracion pendiente),
  // reintentar sin esa columna y embeber el destino dentro de notes.
  if (error && isTableAssignmentColumnMissingError(error)) {
    const fallbackPayload = payload.map((row) => {
      const { table_assignment, ...rest } = row
      return {
        ...rest,
        notes: upsertTableAssignmentInNotes(null, table_assignment),
      }
    })

    const { error: retryError } = await adminClient.from('guests').insert(fallbackPayload)

    if (retryError) {
      return Response.json({ error: retryError.message }, { status: 500 })
    }

    return Response.json({ count: payload.length })
  }

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ count: payload.length })
}

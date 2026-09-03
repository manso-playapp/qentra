import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { buildGuestFullName } from '@/lib/guest-schema'
import { toE164 } from '@/lib/phone'
import { normalizeGuestTypeName } from '@/lib/guest-import'
import { isMissingInvitationDeliveryTableError } from '@/lib/invitation-delivery-tracking'
import { categorizeBulkGuestRows, type ExistingGuestForMerge } from '@/lib/guest-bulk-merge'
import type { GuestImportRow } from '@/lib/guest-import'
import {
  isTableAssignmentColumnMissingError,
  upsertTableAssignmentInNotes,
} from '@/lib/invitation-response'

// Alta masiva de invitados, con reimportacion protegida.
//
// Cada fila se cruza contra los invitados existentes del mismo tipo, por
// telefono normalizado o email. Sin coincidencia -> alta nueva. Si coincide
// con alguien que ya fue tocado por el evento (le llego el link, respondio,
// hizo check-in o pago) -> se ignora, nunca se pisa. Solo se actualiza a
// quien sigue "preinvited" y sin pago aprobado.
//
// Una columna ausente de la planilla (undefined) no toca ese campo al
// actualizar; una columna presente con celda vacia lo borra. Ver
// lib/guest-import.ts.
//
// `dry_run: true` devuelve el conteo sin escribir nada (para mostrar un
// resumen antes de confirmar). Ver lib/guest-bulk-merge.ts para la regla.

type BulkGuestRow = {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  table_assignment?: string
  sender_group?: string
  document_number?: string
  companion_names?: string[]
}

type BulkGuestsRequestBody = {
  event_id?: string
  guest_type_id?: string
  guests?: BulkGuestRow[]
  dry_run?: boolean
}

export const runtime = 'nodejs'

function normalizePhone(value?: string) {
  return value && /\d/.test(value) ? toE164(value) : null
}

function toImportRow(row: BulkGuestRow): GuestImportRow | null {
  const firstName = row.first_name?.trim() ?? ''
  if (!firstName) return null
  return {
    first_name: firstName,
    last_name: row.last_name?.trim() ?? '',
    email: row.email !== undefined ? row.email.trim() : undefined,
    phone: row.phone !== undefined ? row.phone.trim() : undefined,
    table_assignment: row.table_assignment !== undefined ? row.table_assignment.trim() : undefined,
    source_type: '',
    sender_group: row.sender_group !== undefined ? row.sender_group.trim() : undefined,
    document_number: row.document_number !== undefined ? row.document_number.trim() : undefined,
    companion_names: Array.isArray(row.companion_names)
      ? row.companion_names.map((name) => name.trim()).filter(Boolean)
      : undefined,
  }
}

function previewSample(guest: Pick<ExistingGuestForMerge, 'first_name' | 'last_name'>, extra: string) {
  return { name: `${guest.first_name} ${guest.last_name}`.trim(), detail: extra }
}

const MAX_SAMPLE = 20

type SenderGroupResolution = {
  /** false si `invitation_sender_groups` todavia no esta migrada: hay que
   *  evitar tocar `invitation_sender_group_id` por completo en ese caso. */
  available: boolean
  ids: Map<string, string>
}

/**
 * Resuelve la etiqueta de "Invitado de" a un `invitation_sender_group_id`,
 * creando el grupo si todavia no existe en el evento. Si la tabla de grupos
 * no esta migrada en este entorno, se ignora en silencio: la carga de
 * invitados no debe romperse por una feature aparte que todavia no aplico su
 * migracion (mismo criterio que /api/events/[id]/invitation-delivery).
 */
async function resolveSenderGroupIds(
  adminClient: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  eventId: string,
  labels: string[]
): Promise<SenderGroupResolution> {
  const ids = new Map<string, string>()
  const distinctLabels = [...new Set(labels.map((label) => label.trim()).filter(Boolean))]

  try {
    const { data: existingGroups, error } = await adminClient
      .from('invitation_sender_groups')
      .select('id, label, sort_order')
      .eq('event_id', eventId)

    if (error) throw error

    const byNormalizedLabel = new Map((existingGroups ?? []).map((group) => [normalizeGuestTypeName(group.label), group]))
    let nextSortOrder = (existingGroups ?? []).reduce((max, group) => Math.max(max, group.sort_order ?? -1), -1) + 1

    for (const label of distinctLabels) {
      const existing = byNormalizedLabel.get(normalizeGuestTypeName(label))
      if (existing) {
        ids.set(label, existing.id)
        continue
      }

      const { data: created, error: createError } = await adminClient
        .from('invitation_sender_groups')
        .insert({ event_id: eventId, label, sort_order: nextSortOrder })
        .select('id, label')
        .single()

      if (createError) {
        // Carrera con otra creacion del mismo label: releer y usar la existente.
        if (createError.code === '23505') {
          const { data: raced } = await adminClient
            .from('invitation_sender_groups')
            .select('id, label')
            .eq('event_id', eventId)
            .ilike('label', label)
            .maybeSingle()
          if (raced) ids.set(label, raced.id)
          continue
        }
        throw createError
      }

      nextSortOrder += 1
      byNormalizedLabel.set(normalizeGuestTypeName(created.label), { ...created, sort_order: nextSortOrder })
      ids.set(label, created.id)
    }
  } catch (error) {
    if (isMissingInvitationDeliveryTableError(error)) return { available: false, ids }
    throw error
  }

  return { available: true, ids }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as BulkGuestsRequestBody | null
  const eventId = body?.event_id?.trim()
  const guestTypeId = body?.guest_type_id?.trim()
  const dryRun = body?.dry_run === true
  const rawRows = Array.isArray(body?.guests) ? body.guests : []

  if (!eventId || !guestTypeId) {
    return Response.json({ error: 'Falta el evento o el tipo de invitado.' }, { status: 400 })
  }
  const { response: authErrorResponse } = await ensureAuthorizedEventApiAccess(eventId)
  if (authErrorResponse) return authErrorResponse

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  const { data: guestType, error: guestTypeError } = await adminClient
    .from('guest_types')
    .select('event_id, payment_amount_cents')
    .eq('id', guestTypeId)
    .maybeSingle()

  if (guestTypeError) return Response.json({ error: guestTypeError.message }, { status: 500 })
  if (!guestType || guestType.event_id !== eventId) {
    return Response.json({ error: 'El tipo de invitado no corresponde al evento.' }, { status: 400 })
  }

  const rows = rawRows.map(toImportRow).filter((row): row is GuestImportRow => row !== null)

  if (rows.length === 0) {
    return Response.json(
      { error: 'No hay invitados validos para importar (cada fila necesita al menos un nombre).' },
      { status: 400 }
    )
  }

  const { data: existingRows, error: existingError } = await adminClient
    .from('guests')
    .select('id, first_name, last_name, email, phone, status, payment_status')
    .eq('event_id', eventId)
    .eq('guest_type_id', guestTypeId)

  if (existingError) return Response.json({ error: existingError.message }, { status: 500 })

  const merge = categorizeBulkGuestRows((existingRows ?? []) as ExistingGuestForMerge[], rows)
  const newRows = merge.rows.filter((item) => item.category === 'new')
  const updateRows = merge.rows.filter((item) => item.category === 'update')
  const protectedRows = merge.rows.filter((item) => item.category === 'protected')

  if (dryRun) {
    return Response.json({
      preview: {
        newCount: newRows.length,
        updateCount: updateRows.length,
        protectedCount: protectedRows.length,
        missingCount: merge.missing.length,
        protectedSample: protectedRows
          .slice(0, MAX_SAMPLE)
          .map((item) => previewSample(item.existing, item.reason)),
        missingSample: merge.missing.slice(0, MAX_SAMPLE).map((guest) => previewSample(guest, '')),
      },
    })
  }

  const senderGroupLabels = rows.flatMap((row) => (row.sender_group ? [row.sender_group] : []))
  const senderGroups = await resolveSenderGroupIds(adminClient, eventId, senderGroupLabels)

  const paymentStatus = (guestType.payment_amount_cents ?? 0) > 0 ? 'pending' : 'not_required'

  const insertPayload = newRows.map(({ row }) => {
    const payload: Record<string, string | number | boolean | string[] | null> = {
      event_id: eventId,
      guest_type_id: guestTypeId,
      first_name: row.first_name,
      last_name: row.last_name || null,
      full_name: buildGuestFullName(row.first_name, row.last_name),
      email: row.email || null,
      phone: normalizePhone(row.phone),
      table_assignment: row.table_assignment || null,
      created_manually: true,
      status: 'preinvited',
      payment_status: paymentStatus,
    }
    if (row.document_number) payload.document_number = row.document_number
    if (senderGroups.available && row.sender_group) {
      const senderGroupId = senderGroups.ids.get(row.sender_group)
      if (senderGroupId) payload.invitation_sender_group_id = senderGroupId
    }
    if (row.companion_names !== undefined) {
      payload.companion_names = row.companion_names
      payload.plus_ones_allowed = row.companion_names.length
      payload.plus_ones_confirmed = 0
    }
    return payload
  })

  let createdCount = 0
  if (insertPayload.length > 0) {
    const { error } = await adminClient.from('guests').insert(insertPayload)

    if (error && isTableAssignmentColumnMissingError(error)) {
      const fallbackPayload = insertPayload.map((row) => {
        const { table_assignment, ...rest } = row
        return { ...rest, notes: upsertTableAssignmentInNotes(null, table_assignment as string | null) }
      })
      const { error: retryError } = await adminClient.from('guests').insert(fallbackPayload)
      if (retryError) return Response.json({ error: retryError.message }, { status: 500 })
    } else if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    createdCount = insertPayload.length
  }

  // Update seguro: solo pisa a quien sigue exactamente como en la vista
  // previa, y solo escribe los campos que la planilla efectivamente trae
  // (una columna ausente no borra lo que ya estaba cargado). El filtro
  // `.eq('status', 'preinvited')` vuelve a chequear en el momento de escribir,
  // por si algo cambio entre el preview y la confirmacion.
  let updatedCount = 0
  let racedCount = 0
  for (const item of updateRows) {
    if (item.category !== 'update') continue
    const { row, existing } = item
    const updatePayload: Record<string, string | number | string[] | null> = {
      first_name: row.first_name,
      last_name: row.last_name || null,
      full_name: buildGuestFullName(row.first_name, row.last_name),
    }
    if (row.email !== undefined) updatePayload.email = row.email || null
    if (row.phone !== undefined) updatePayload.phone = normalizePhone(row.phone)
    if (row.table_assignment !== undefined) updatePayload.table_assignment = row.table_assignment || null
    if (row.document_number !== undefined) updatePayload.document_number = row.document_number || null
    if (row.companion_names !== undefined) {
      updatePayload.companion_names = row.companion_names
      updatePayload.plus_ones_allowed = row.companion_names.length
      updatePayload.plus_ones_confirmed = 0
    }
    if (senderGroups.available && row.sender_group !== undefined) {
      updatePayload.invitation_sender_group_id = row.sender_group ? senderGroups.ids.get(row.sender_group) ?? null : null
    }

    const { data, error } = await adminClient
      .from('guests')
      .update(updatePayload)
      .eq('id', existing.id)
      .eq('status', 'preinvited')
      .neq('payment_status', 'approved')
      .select('id')

    if (error && isTableAssignmentColumnMissingError(error)) {
      const { table_assignment, ...rest } = updatePayload
      const fallbackPayload =
        table_assignment !== undefined
          ? { ...rest, notes: upsertTableAssignmentInNotes(null, table_assignment as string | null) }
          : rest
      const { data: retryData, error: retryError } = await adminClient
        .from('guests')
        .update(fallbackPayload)
        .eq('id', existing.id)
        .eq('status', 'preinvited')
        .neq('payment_status', 'approved')
        .select('id')

      if (retryError) return Response.json({ error: retryError.message }, { status: 500 })
      if (retryData && retryData.length > 0) updatedCount += 1
      else racedCount += 1
      continue
    }

    if (error) return Response.json({ error: error.message }, { status: 500 })
    if (data && data.length > 0) updatedCount += 1
    else racedCount += 1
  }

  return Response.json({
    created: createdCount,
    updated: updatedCount,
    skippedProtected: protectedRows.length + racedCount,
  })
}

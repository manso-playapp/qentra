import { ensureAuthorizedEventApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import {
  isMissingInvitationDeliveryTableError,
  readInvitationDeliveryData,
  upsertInvitationDeliveryStatus,
} from '@/lib/invitation-delivery-tracking'
import { isInvitationExpired } from '@/lib/invitation-expiry'
import type { InvitationDeliveryChannel } from '@/types'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

type DeliveryActionBody = {
  action?: 'create_group' | 'assign_group' | 'mark_sent' | 'unmark_sent'
  label?: string
  guestId?: string
  invitationTokenId?: string
  senderGroupId?: string | null
  channel?: InvitationDeliveryChannel
}

function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function getAuthorizedContext(eventId: string) {
  const authorization = await ensureAuthorizedEventApiAccess(eventId)
  if (authorization.response) return { response: authorization.response, auth: null, adminClient: null }

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return {
      response: Response.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
        { status: 503 }
      ),
      auth: null,
      adminClient: null,
    }
  }

  return { response: null, auth: authorization.auth, adminClient }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: eventId } = await context.params
  const { response, adminClient } = await getAuthorizedContext(eventId)
  if (response) return response

  try {
    const data = await readInvitationDeliveryData(adminClient!, eventId)
    return Response.json({ data: { ...data, available: true } })
  } catch (error) {
    if (isMissingInvitationDeliveryTableError(error)) {
      // Durante el despliegue la lista de invitados sigue funcionando. La
      // feature se muestra como no disponible hasta aplicar la migracion.
      return Response.json({ data: { groups: [], tracking: [], available: false } })
    }

    const message = error instanceof Error ? error.message : 'No se pudo cargar el seguimiento de invitaciones.'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id: eventId } = await context.params
  const { response, auth, adminClient } = await getAuthorizedContext(eventId)
  if (response) return response

  const body = (await request.json().catch(() => null)) as DeliveryActionBody | null
  if (!body?.action) {
    return Response.json({ error: 'Falta la accion de seguimiento.' }, { status: 400 })
  }

  try {
    if (body.action === 'create_group') {
      const label = body.label?.trim() ?? ''
      if (label.length < 1 || label.length > 80) {
        return Response.json({ error: 'El nombre del grupo debe tener entre 1 y 80 caracteres.' }, { status: 400 })
      }

      const { data: lastGroup, error: lastGroupError } = await adminClient!
        .from('invitation_sender_groups')
        .select('sort_order')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (lastGroupError) throw lastGroupError

      const { data: group, error: groupError } = await adminClient!
        .from('invitation_sender_groups')
        .insert({
          event_id: eventId,
          label,
          sort_order: (lastGroup?.sort_order ?? -1) + 1,
        })
        .select('*')
        .single()
      if (groupError) {
        if (groupError.code === '23505') {
          return Response.json({ error: 'Ya existe un grupo con ese nombre en este evento.' }, { status: 409 })
        }
        throw groupError
      }

      return Response.json({ data: group })
    }

    if (body.action === 'assign_group') {
      if (!isValidUuid(body.guestId)) {
        return Response.json({ error: 'El invitado no es valido.' }, { status: 400 })
      }
      if (body.senderGroupId !== null && body.senderGroupId !== undefined && !isValidUuid(body.senderGroupId)) {
        return Response.json({ error: 'El grupo de envio no es valido.' }, { status: 400 })
      }

      const { data: guest, error: guestError } = await adminClient!
        .from('guests')
        .select('id, event_id')
        .eq('id', body.guestId)
        .maybeSingle()
      if (guestError) throw guestError
      if (!guest || guest.event_id !== eventId) {
        return Response.json({ error: 'El invitado no pertenece a este evento.' }, { status: 404 })
      }

      if (body.senderGroupId) {
        const { data: group, error: groupError } = await adminClient!
          .from('invitation_sender_groups')
          .select('id')
          .eq('id', body.senderGroupId)
          .eq('event_id', eventId)
          .maybeSingle()
        if (groupError) throw groupError
        if (!group) return Response.json({ error: 'El grupo no pertenece a este evento.' }, { status: 404 })
      }

      const { data: updatedGuest, error: updateError } = await adminClient!
        .from('guests')
        .update({ invitation_sender_group_id: body.senderGroupId ?? null })
        .eq('id', body.guestId)
        .eq('event_id', eventId)
        .select('id, invitation_sender_group_id')
        .single()
      if (updateError) throw updateError

      return Response.json({ data: updatedGuest })
    }

    if (body.action !== 'mark_sent' && body.action !== 'unmark_sent') {
      return Response.json({ error: 'Accion de seguimiento no soportada.' }, { status: 400 })
    }

    if (!isValidUuid(body.guestId) || !isValidUuid(body.invitationTokenId)) {
      return Response.json({ error: 'Faltan el invitado o la invitacion.' }, { status: 400 })
    }
    if (body.channel !== 'whatsapp' && body.channel !== 'email') {
      return Response.json({ error: 'El canal de envio no es valido.' }, { status: 400 })
    }

    const [{ data: guest, error: guestError }, { data: invitationToken, error: tokenError }] = await Promise.all([
      adminClient!
        .from('guests')
        .select('id, event_id, invitation_sender_group_id')
        .eq('id', body.guestId)
        .maybeSingle(),
      adminClient!
        .from('invitation_tokens')
        .select('id, guest_id, expires_at, is_active')
        .eq('id', body.invitationTokenId)
        .maybeSingle(),
    ])
    if (guestError) throw guestError
    if (tokenError) throw tokenError
    if (!guest || guest.event_id !== eventId) {
      return Response.json({ error: 'El invitado no pertenece a este evento.' }, { status: 404 })
    }
    if (!invitationToken || invitationToken.guest_id !== guest.id) {
      return Response.json({ error: 'La invitacion no pertenece a este invitado.' }, { status: 404 })
    }
    if (body.action === 'mark_sent' && (!invitationToken.is_active || isInvitationExpired(invitationToken.expires_at))) {
      return Response.json({ error: 'La invitacion esta vencida o inactiva. Regenera el acceso antes de enviarla.' }, { status: 409 })
    }

    const tracking = await upsertInvitationDeliveryStatus({
      adminClient: adminClient!,
      eventId,
      guestId: guest.id,
      invitationTokenId: invitationToken.id,
      channel: body.channel,
      status: body.action === 'mark_sent' ? 'marked_sent' : 'pending',
      senderGroupId: body.senderGroupId ?? guest.invitation_sender_group_id,
      actorUserId: auth?.user.id,
    })

    return Response.json({ data: tracking })
  } catch (error) {
    if (isMissingInvitationDeliveryTableError(error)) {
      return Response.json(
        { error: 'El seguimiento de invitaciones todavía no está habilitado. Aplicá la migración pendiente.' },
        { status: 503 }
      )
    }

    const message = error instanceof Error ? error.message : 'No se pudo actualizar el seguimiento de la invitacion.'
    return Response.json({ error: message }, { status: 500 })
  }
}

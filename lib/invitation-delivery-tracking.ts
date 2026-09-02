import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  InvitationDeliveryChannel,
  InvitationDeliveryStatus,
  InvitationDeliveryTracking,
  InvitationSenderGroup,
} from '@/types'

type TrackingClient = SupabaseClient

type TrackingStatusInput = {
  adminClient: TrackingClient
  eventId: string
  guestId: string
  invitationTokenId: string
  channel: InvitationDeliveryChannel
  status: InvitationDeliveryStatus
  senderGroupId?: string | null
  actorUserId?: string | null
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as { code?: unknown }
  return typeof candidate.code === 'string' ? candidate.code : undefined
}

export function isMissingInvitationDeliveryTableError(error: unknown) {
  const code = getErrorCode(error)
  return code === 'PGRST205' || code === '42P01'
}

export async function readInvitationDeliveryData(
  adminClient: TrackingClient,
  eventId: string
): Promise<{ groups: InvitationSenderGroup[]; tracking: InvitationDeliveryTracking[] }> {
  const [{ data: groups, error: groupsError }, { data: tracking, error: trackingError }] = await Promise.all([
    adminClient
      .from('invitation_sender_groups')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    adminClient
      .from('invitation_delivery_tracking')
      .select('*')
      .eq('event_id', eventId),
  ])

  if (groupsError) throw groupsError
  if (trackingError) throw trackingError

  return {
    groups: (groups ?? []) as InvitationSenderGroup[],
    tracking: (tracking ?? []) as InvitationDeliveryTracking[],
  }
}

export async function upsertInvitationDeliveryStatus(input: TrackingStatusInput) {
  const now = new Date().toISOString()
  const { adminClient, eventId, guestId, invitationTokenId, channel, status, senderGroupId, actorUserId } = input

  const { data: existing, error: existingError } = await adminClient
    .from('invitation_delivery_tracking')
    .select('*')
    .eq('invitation_token_id', invitationTokenId)
    .maybeSingle()

  if (existingError) throw existingError

  const nextSenderGroupId = senderGroupId === undefined ? existing?.sender_group_id ?? null : senderGroupId
  const tracking = existing
    ? await adminClient
        .from('invitation_delivery_tracking')
        .update({
          event_id: eventId,
          guest_id: guestId,
          channel,
          status,
          sender_group_id: nextSenderGroupId,
          marked_sent_at: status === 'marked_sent' ? now : null,
          marked_sent_by: status === 'marked_sent' ? actorUserId ?? null : null,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select('*')
        .single()
    : await adminClient
        .from('invitation_delivery_tracking')
        .insert({
          event_id: eventId,
          guest_id: guestId,
          invitation_token_id: invitationTokenId,
          channel,
          status,
          sender_group_id: nextSenderGroupId,
          marked_sent_at: status === 'marked_sent' ? now : null,
          marked_sent_by: status === 'marked_sent' ? actorUserId ?? null : null,
          updated_at: now,
        })
        .select('*')
        .single()

  if (tracking.error) throw tracking.error

  const action = status === 'marked_sent' ? 'marked_sent' : 'unmarked_sent'
  const { error: auditError } = await adminClient
    .from('invitation_delivery_audit')
    .insert({
      tracking_id: tracking.data.id,
      event_id: eventId,
      guest_id: guestId,
      invitation_token_id: invitationTokenId,
      channel,
      action,
      sender_group_id: nextSenderGroupId,
      actor_user_id: actorUserId ?? null,
    })

  if (auditError) throw auditError

  return tracking.data as InvitationDeliveryTracking
}

export async function recordInvitationLinkOpened(input: {
  adminClient: TrackingClient
  eventId: string
  guestId: string
  invitationTokenId: string
}) {
  const now = new Date().toISOString()
  const { adminClient, eventId, guestId, invitationTokenId } = input

  const { data: existing, error: existingError } = await adminClient
    .from('invitation_delivery_tracking')
    .select('*')
    .eq('invitation_token_id', invitationTokenId)
    .maybeSingle()

  if (existingError) throw existingError

  let tracking = existing as InvitationDeliveryTracking | null
  let shouldAudit = false

  if (!tracking) {
    const { data, error } = await adminClient
      .from('invitation_delivery_tracking')
      .insert({
        event_id: eventId,
        guest_id: guestId,
        invitation_token_id: invitationTokenId,
        status: 'pending',
        first_opened_at: now,
        last_opened_at: now,
        updated_at: now,
      })
      .select('*')
      .single()

    if (error) {
      // Dos pestañas pueden informar la primera visita al mismo tiempo. La
      // unicidad por token hace que sólo una cree la fila; la otra relee y no
      // convierte una visita en un error visible para el invitado.
      if (getErrorCode(error) !== '23505') throw error
      const { data: concurrentTracking, error: concurrentError } = await adminClient
        .from('invitation_delivery_tracking')
        .select('*')
        .eq('invitation_token_id', invitationTokenId)
        .maybeSingle()
      if (concurrentError) throw concurrentError
      tracking = concurrentTracking as InvitationDeliveryTracking | null
    } else {
      tracking = data as InvitationDeliveryTracking
      shouldAudit = true
    }
  }

  if (tracking && tracking.first_opened_at === null) {
    const { data, error } = await adminClient
      .from('invitation_delivery_tracking')
      .update({ first_opened_at: now, last_opened_at: now, updated_at: now })
      .eq('id', tracking.id)
      .is('first_opened_at', null)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (data) {
      tracking = data as InvitationDeliveryTracking
      shouldAudit = true
    }
  }

  if (tracking && shouldAudit) {
    const { error: auditError } = await adminClient
      .from('invitation_delivery_audit')
      .insert({
        tracking_id: tracking.id,
        event_id: eventId,
        guest_id: guestId,
        invitation_token_id: invitationTokenId,
        channel: null,
        action: 'link_opened',
        actor_user_id: null,
      })

    if (auditError) throw auditError
  }

  return tracking
}

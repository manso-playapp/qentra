import QRCode from 'qrcode'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { buildGuestFullName } from '@/lib/guest-schema'
import { parseInvitationDetails, serializeInvitationDetails } from '@/lib/invitation-response'

export const runtime = 'nodejs'

type InvitationResponseBody = {
  attendanceResponse?: 'confirmed' | 'declined'
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dni?: string
  plusOnesConfirmed?: number
  companionNames?: string
  dietaryRequirements?: string
  observations?: string
  paymentStatus?: 'not_required' | 'pending' | 'approved'
}

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params
  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY para guardar la invitacion.' },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json()) as InvitationResponseBody
    const attendanceResponse = body.attendanceResponse

    if (attendanceResponse !== 'confirmed' && attendanceResponse !== 'declined') {
      return Response.json({ error: 'Respuesta de asistencia invalida.' }, { status: 400 })
    }

    const { data: invitationToken, error: invitationTokenError } = await adminClient
      .from('invitation_tokens')
      .select('id, guest_id, token, used_count, last_used_at, is_active')
      .eq('token', token)
      .maybeSingle()

    if (invitationTokenError) {
      throw invitationTokenError
    }

    if (!invitationToken) {
      return Response.json({ error: 'No se encontro la invitacion.' }, { status: 404 })
    }

    const { data: guest, error: guestError } = await adminClient
      .from('guests')
      .select('id, event_id, status, notes')
      .eq('id', invitationToken.guest_id)
      .maybeSingle()

    if (guestError) {
      throw guestError
    }

    if (!guest) {
      return Response.json({ error: 'No se encontro el invitado.' }, { status: 404 })
    }

    if (
      guest.status === 'checked_in' ||
      (invitationToken.used_count ?? 0) > 0 ||
      Boolean(invitationToken.last_used_at) ||
      invitationToken.is_active === false
    ) {
      return Response.json(
        { error: 'La invitacion ya fue utilizada y no admite cambios.' },
        { status: 409 }
      )
    }

    const firstName = body.firstName?.trim() || ''
    const lastName = body.lastName?.trim() || ''
    const email = body.email?.trim() || null
    const phone = body.phone?.trim() || null
    const dni = body.dni?.trim() || ''
    const plusOnesConfirmed = Math.max(0, body.plusOnesConfirmed ?? 0)
    const companionNames = body.companionNames?.trim() || ''
    const dietaryRequirements = body.dietaryRequirements?.trim() || ''
    const observations = body.observations?.trim() || ''
    const existingInvitationDetails = parseInvitationDetails(guest.notes)
    const paymentStatus =
      body.paymentStatus ?? existingInvitationDetails.paymentStatus ?? 'not_required'

    if (!firstName || !lastName) {
      return Response.json({ error: 'Completa nombre y apellido.' }, { status: 400 })
    }

    if (attendanceResponse === 'confirmed' && !dni) {
      return Response.json({ error: 'Completa el DNI para emitir el QR final.' }, { status: 400 })
    }

    if (attendanceResponse === 'confirmed' && plusOnesConfirmed > 0 && !companionNames) {
      return Response.json(
        { error: 'Indica los nombres de los acompanantes confirmados.' },
        { status: 400 }
      )
    }

    const specialRequests = serializeInvitationDetails({
      dni,
      dietaryRequirements,
      companionNames,
      observations,
      paymentStatus,
    })

    const nextGuestStatus =
      attendanceResponse === 'declined'
        ? 'rejected'
        : paymentStatus === 'pending'
        ? 'registered'
        : 'enabled'

    const { error: updateGuestError } = await adminClient
      .from('guests')
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: buildGuestFullName(firstName, lastName),
        email,
        phone,
        document_number: attendanceResponse === 'confirmed' ? dni : null,
        notes: specialRequests || null,
        status: nextGuestStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationToken.guest_id)

    if (updateGuestError) {
      throw updateGuestError
    }

    if (nextGuestStatus === 'enabled') {
      const { data: eventData, error: eventError } = await adminClient
        .from('events')
        .select('slug')
        .eq('id', guest.event_id)
        .maybeSingle()

      if (eventError) {
        throw eventError
      }

      const qrPayload = buildGuestAccessQrPayload({
        eventId: guest.event_id,
        eventSlug: eventData?.slug,
        guestId: invitationToken.guest_id,
        guestName: buildGuestFullName(firstName, lastName),
        token: invitationToken.token,
      })

      const qrCodeUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
      })

      const { error: qrError } = await adminClient
        .from('guest_qr_codes')
        .upsert(
          {
            guest_id: invitationToken.guest_id,
            qr_value: qrPayload,
            qr_image_url: qrCodeUrl,
            is_active: true,
            revoked_at: null,
          },
          {
            onConflict: 'guest_id',
          }
        )

      if (qrError) {
        throw qrError
      }
    } else {
      const { error: revokeQrError } = await adminClient
        .from('guest_qr_codes')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('guest_id', invitationToken.guest_id)
        .eq('is_active', true)

      if (revokeQrError) {
        throw revokeQrError
      }
    }

    return Response.json({
      ok: true,
      status: attendanceResponse === 'confirmed' ? 'confirmed' : 'declined',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar la invitacion.'
    return Response.json({ error: message }, { status: 500 })
  }
}

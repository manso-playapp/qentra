import QRCode from 'qrcode'
import { buildGuestAccessQrPayload } from '@/lib/guest-access'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import { buildGuestFullName } from '@/lib/guest-schema'
import { parseCompanionNames, parseInvitationDetails, serializeInvitationDetails } from '@/lib/invitation-response'

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
  song?: string
  greeting?: string
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
      .select('id, event_id, status, notes, payment_status, table_assignment, plus_ones_allowed, plus_ones_confirmed, companion_names')
      .eq('id', invitationToken.guest_id)
      .maybeSingle()

    if (guestError) {
      throw guestError
    }

    if (!guest) {
      return Response.json({ error: 'No se encontro el invitado.' }, { status: 404 })
    }

    // La configuracion de campos pertenece al evento. El cliente puede
    // ocultarlos en la invitacion, pero la API tambien debe respetarlo para
    // que no se puedan enviar valores deshabilitados manualmente.
    const { data: branding } = await adminClient
      .from('event_branding')
      .select('config')
      .eq('event_id', guest.event_id)
      .maybeSingle()
    const configFields = branding?.config && typeof branding.config === 'object' && !Array.isArray(branding.config)
      ? (branding.config as { fields?: Record<string, unknown> }).fields
      : undefined
    const isRsvpEnabled = configFields?.rsvp !== false
    const isDniEnabled = configFields?.dni !== false
    const isMenuEnabled = configFields?.menu !== false
    const isCompanionsEnabled = configFields?.companions !== false

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
    const dni = isDniEnabled ? body.dni?.trim() || '' : ''
    const companionNameList = isCompanionsEnabled ? parseCompanionNames(body.companionNames) : []
    const companionNames = companionNameList.join('\n')
    const plusOnesConfirmed = companionNameList.length
    const dietaryRequirements = isMenuEnabled ? body.dietaryRequirements?.trim() || '' : ''
    const song = body.song?.trim() || ''
    const greeting = body.greeting?.trim() || ''
    const observations = body.observations?.trim() || ''
    const paymentStatus = body.paymentStatus ?? guest.payment_status ?? 'not_required'
    const effectiveAttendanceResponse = isRsvpEnabled ? attendanceResponse : 'confirmed'

    if (!firstName || !lastName) {
      return Response.json({ error: 'Completa nombre y apellido.' }, { status: 400 })
    }

    if (effectiveAttendanceResponse === 'confirmed' && isDniEnabled && !dni) {
      return Response.json({ error: 'Completa el DNI para emitir el QR final.' }, { status: 400 })
    }

    const plusOnesAllowed = Math.max(0, guest.plus_ones_allowed ?? 0)
    if (effectiveAttendanceResponse === 'confirmed' && plusOnesConfirmed > plusOnesAllowed) {
      return Response.json(
        { error: `Esta invitacion permite hasta ${plusOnesAllowed} acompanante(s).` },
        { status: 400 }
      )
    }

    if (effectiveAttendanceResponse === 'confirmed' && plusOnesConfirmed === 0 && (body.plusOnesConfirmed ?? 0) > 0 && isCompanionsEnabled) {
      return Response.json(
        { error: 'Indica los nombres de los acompanantes confirmados.' },
        { status: 400 }
      )
    }

    // Preservamos el destino (mesa) actual al serializar notes para no pisar
    // el valor legacy embebido. El destino no lo edita el invitado en este form.
    const currentTableAssignment =
      guest.table_assignment?.trim() ||
      parseInvitationDetails(guest.notes).tableAssignment ||
      ''

    const specialRequests = serializeInvitationDetails({
      dni,
      dietaryRequirements,
      companionNames,
      song,
      greeting,
      observations,
      tableAssignment: currentTableAssignment,
    })

    // Un cambio en la respuesta puede dejar obsoleto un checkout pendiente
    // (por ejemplo, si se agregan o quitan acompañantes). Los intentos ya
    // aprobados no se tocan.
    if (guest.payment_status === 'pending') {
      const { error: cancelOpenTransactionsError } = await adminClient
        .from('payment_transactions')
        .update({
          status: 'cancelled',
          status_detail: 'La respuesta del invitado cambió antes del pago.',
          updated_at: new Date().toISOString(),
        })
        .eq('guest_id', guest.id)
        .in('status', ['created', 'pending'])

      if (cancelOpenTransactionsError) {
        throw cancelOpenTransactionsError
      }
    }

    const nextGuestStatus =
      effectiveAttendanceResponse === 'declined'
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
        document_number: dni || null,
        notes: specialRequests || null,
        payment_status: paymentStatus,
        plus_ones_confirmed: effectiveAttendanceResponse === 'confirmed' ? plusOnesConfirmed : 0,
        companion_names: effectiveAttendanceResponse === 'confirmed' ? companionNameList : [],
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
      status: effectiveAttendanceResponse === 'confirmed' ? 'confirmed' : 'declined',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar la invitacion.'
    return Response.json({ error: message }, { status: 500 })
  }
}

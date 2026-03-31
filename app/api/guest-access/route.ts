import QRCode from 'qrcode'
import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  const adminClient = getSupabaseAdminClient()

  if (!adminClient) {
    return Response.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no esta configurada en el entorno.' },
      { status: 503 }
    )
  }

  try {
    const url = new URL(request.url)
    const eventId = url.searchParams.get('eventId')

    if (!eventId) {
      return Response.json({ error: 'Falta eventId.' }, { status: 400 })
    }

    const { data: guests, error: guestsError } = await adminClient
      .from('guests')
      .select('id')
      .eq('event_id', eventId)

    if (guestsError) {
      throw guestsError
    }

    const guestIds = (guests ?? []).map((guest) => guest.id as string)

    if (guestIds.length === 0) {
      return Response.json({
        data: {
          invitationTokens: [],
          guestQrCodes: [],
        },
      })
    }

    const { data: invitationTokens, error: tokensError } = await adminClient
      .from('invitation_tokens')
      .select('*')
      .in('guest_id', guestIds)
      .order('created_at', { ascending: false })

    if (tokensError) {
      throw tokensError
    }

    const { data: guestQrCodes, error: qrError } = await adminClient
      .from('guest_qr_codes')
      .select('*')
      .in('guest_id', guestIds)
      .order('generated_at', { ascending: false })

    if (qrError) {
      throw qrError
    }

    const qrCodes = guestQrCodes ?? []
    const missingQrImages = qrCodes.filter(
      (qrCode) => qrCode.is_active && qrCode.qr_value && !qrCode.qr_image_url
    )

    if (missingQrImages.length > 0) {
      const repairedQrCodes = await Promise.all(
        missingQrImages.map(async (qrCode) => {
          const qrImageUrl = await QRCode.toDataURL(qrCode.qr_value, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 256,
          })

          const { data, error } = await adminClient
            .from('guest_qr_codes')
            .update({ qr_image_url: qrImageUrl })
            .eq('id', qrCode.id)
            .select('*')
            .single()

          if (error) {
            throw error
          }

          return data
        })
      )

      const repairedMap = new Map(repairedQrCodes.map((qrCode) => [qrCode.id, qrCode]))

      return Response.json({
        data: {
          invitationTokens: invitationTokens ?? [],
          guestQrCodes: qrCodes.map((qrCode) => repairedMap.get(qrCode.id) ?? qrCode),
        },
      })
    }

    return Response.json({
      data: {
        invitationTokens: invitationTokens ?? [],
        guestQrCodes: qrCodes,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los accesos.'
    return Response.json({ error: message }, { status: 500 })
  }
}

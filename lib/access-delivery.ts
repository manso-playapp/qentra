import { buildInvitationWhatsAppMessage } from './invitation-message'

type DeliveryChannel = 'email'

export type AccessDeliveryPayload = {
  channel: DeliveryChannel
  recipient: string
  guestName: string
  guestFirstName: string
  eventName: string
  invitationUrl: string
  expiresAt: string
  confirmationDeadline?: string | null
}

type DeliveryResult = {
  provider: 'resend'
  externalId?: string
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatConfirmationDeadline(payload: AccessDeliveryPayload) {
  if (payload.confirmationDeadline) {
    const parsed = new Date(`${payload.confirmationDeadline}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('es-AR', { dateStyle: 'long' }).format(parsed)
    }
  }

  return formatDateTime(payload.expiresAt)
}

function buildPlainTextMessage(payload: AccessDeliveryPayload) {
  return buildInvitationWhatsAppMessage({
    guestFirstName: payload.guestFirstName,
    eventName: payload.eventName,
    invitationUrl: payload.invitationUrl,
    confirmationDeadline: formatConfirmationDeadline(payload),
  })
}

function buildEmailHtml(payload: AccessDeliveryPayload) {
  const expiry = formatDateTime(payload.expiresAt)
  const confirmationDeadline = formatConfirmationDeadline(payload)

  return `
    <div style="font-family: Georgia, serif; background:#f8fafc; padding:32px; color:#0f172a;">
      <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:24px; overflow:hidden;">
        <div style="padding:32px; background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%); color:#ffffff;">
          <p style="margin:0; font-size:12px; letter-spacing:0.28em; text-transform:uppercase; color:#7dd3fc;">Alista Access</p>
          <h1 style="margin:16px 0 0; font-size:36px; line-height:1.15;">${payload.guestFirstName}, tu acceso ya esta listo</h1>
          <p style="margin:16px 0 0; font-size:15px; line-height:1.7; color:rgba(255,255,255,0.82);">
            Presenta el QR desde tu celular en la puerta del evento.
          </p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0; font-size:14px; color:#475569;">Evento</p>
          <h2 style="margin:8px 0 0; font-size:30px; line-height:1.2;">${payload.eventName}</h2>
          <p style="margin:20px 0 0; font-size:15px; line-height:1.7; color:#475569;">
            Tu acceso estara disponible en el siguiente enlace:
          </p>
          <p style="margin:24px 0;">
            <a href="${payload.invitationUrl}" style="display:inline-block; padding:14px 20px; border-radius:16px; background:#0f172a; color:#ffffff; text-decoration:none; font-weight:600;">
              Abrir Invitación
            </a>
          </p>
          <p style="margin:0; font-size:14px; line-height:1.7; color:#475569;">
            Vigencia: ${expiry}
          </p>
          <p style="margin:16px 0 0; font-size:14px; line-height:1.7; color:#475569;">
            Fecha límite para confirmar: ${confirmationDeadline}
          </p>
        </div>
      </div>
    </div>
  `.trim()
}

// toE164 vive en un modulo puro (lib/phone) para poder reutilizarlo desde
// componentes cliente. Se re-exporta aca por compatibilidad con importadores
// y tests existentes.
export { toE164 } from './phone'

async function sendWithResend(payload: AccessDeliveryPayload): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ALISTA_EMAIL_FROM ?? process.env.QENTRA_EMAIL_FROM
  // Casilla que recibe las respuestas del invitado ("no me abre el link", etc.).
  // Enviamos desde el dominio de Manso, pero las respuestas caen en esta casilla.
  const replyTo =
    process.env.ALISTA_EMAIL_REPLY_TO?.trim() || process.env.QENTRA_EMAIL_REPLY_TO?.trim()

  if (!apiKey || !from) {
    throw new Error('Falta configurar RESEND_API_KEY o ALISTA_EMAIL_FROM para envio real de email.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.recipient],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `Tu acceso para ${payload.eventName}`,
      html: buildEmailHtml(payload),
      text: buildPlainTextMessage(payload),
    }),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body?.message || 'Resend rechazo el envio del email.')
  }

  return {
    provider: 'resend',
    externalId: body?.id,
  }
}

export async function sendGuestAccess(payload: AccessDeliveryPayload): Promise<DeliveryResult> {
  return sendWithResend(payload)
}

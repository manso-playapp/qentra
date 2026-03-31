type DeliveryChannel = 'email' | 'whatsapp'

type WhatsAppConfig = {
  fromPhone?: string
  messagingServiceSid?: string
  contentSid?: string
  allowFreeform?: boolean
}

export type AccessDeliveryPayload = {
  channel: DeliveryChannel
  recipient: string
  guestName: string
  guestFirstName: string
  eventName: string
  invitationUrl: string
  expiresAt: string
  whatsappConfig?: WhatsAppConfig
}

type DeliveryResult = {
  provider: 'resend' | 'twilio'
  externalId?: string
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function buildPlainTextMessage(payload: AccessDeliveryPayload) {
  return [
    `Hola ${payload.guestFirstName},`,
    '',
    `Tu acceso para ${payload.eventName} ya esta listo.`,
    `Abre este enlace desde tu celular y muestra el QR en puerta: ${payload.invitationUrl}`,
    `Vigencia: ${formatDateTime(payload.expiresAt)}`,
  ].join('\n')
}

function buildEmailHtml(payload: AccessDeliveryPayload) {
  const expiry = formatDateTime(payload.expiresAt)

  return `
    <div style="font-family: Georgia, serif; background:#f8fafc; padding:32px; color:#0f172a;">
      <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:24px; overflow:hidden;">
        <div style="padding:32px; background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%); color:#ffffff;">
          <p style="margin:0; font-size:12px; letter-spacing:0.28em; text-transform:uppercase; color:#7dd3fc;">Qentra Access</p>
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
              Abrir acceso
            </a>
          </p>
          <p style="margin:0; font-size:14px; line-height:1.7; color:#475569;">
            Vigencia: ${expiry}
          </p>
          <p style="margin:16px 0 0; font-size:14px; line-height:1.7; color:#475569;">
            Si no puedes abrir el enlace, copia y pega esta URL en tu navegador:<br />
            <span style="color:#0f172a;">${payload.invitationUrl}</span>
          </p>
        </div>
      </div>
    </div>
  `.trim()
}

function normalizeWhatsAppRecipient(phone: string) {
  return phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`
}

async function sendWithResend(payload: AccessDeliveryPayload): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.QENTRA_EMAIL_FROM

  if (!apiKey || !from) {
    throw new Error('Falta configurar RESEND_API_KEY o QENTRA_EMAIL_FROM para envio real de email.')
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

async function sendWithTwilioWhatsApp(payload: AccessDeliveryPayload): Promise<DeliveryResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = payload.whatsappConfig?.fromPhone?.trim() || process.env.TWILIO_WHATSAPP_FROM
  const messagingServiceSid =
    payload.whatsappConfig?.messagingServiceSid?.trim() || process.env.TWILIO_MESSAGING_SERVICE_SID
  const contentSid = payload.whatsappConfig?.contentSid?.trim() || process.env.TWILIO_WHATSAPP_CONTENT_SID
  const allowFreeform =
    payload.whatsappConfig?.allowFreeform ?? (process.env.TWILIO_WHATSAPP_ALLOW_FREEFORM === 'true')

  if (!accountSid || !authToken || (!from && !messagingServiceSid)) {
    throw new Error('Falta configurar credenciales base de Twilio para envio real de WhatsApp.')
  }

  if (!contentSid && !allowFreeform) {
    throw new Error('Falta TWILIO_WHATSAPP_CONTENT_SID. Para invitaciones de WhatsApp se espera una plantilla aprobada.')
  }

  const formData = new URLSearchParams()
  formData.set('To', normalizeWhatsAppRecipient(payload.recipient))

  if (messagingServiceSid) {
    formData.set('MessagingServiceSid', messagingServiceSid)
  } else if (from) {
    formData.set('From', normalizeWhatsAppRecipient(from))
  }

  if (contentSid) {
    formData.set('ContentSid', contentSid)
    formData.set('ContentVariables', JSON.stringify({
      1: payload.guestFirstName,
      2: payload.eventName,
      3: payload.invitationUrl,
      4: formatDateTime(payload.expiresAt),
    }))
  } else {
    formData.set('Body', buildPlainTextMessage(payload))
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body?.message || 'Twilio rechazo el envio de WhatsApp.')
  }

  return {
    provider: 'twilio',
    externalId: body?.sid,
  }
}

export async function sendGuestAccess(payload: AccessDeliveryPayload): Promise<DeliveryResult> {
  if (payload.channel === 'email') {
    return sendWithResend(payload)
  }

  return sendWithTwilioWhatsApp(payload)
}

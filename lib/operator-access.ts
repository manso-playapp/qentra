import { getSupabaseAdminClient } from '@/lib/supabase-admin'

type SupabaseAdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>

export type OperatorAccessLinkData = {
  user_id: string
  email: string
  full_name: string | null
  action_link: string
  redirect_to: string
  verification_type: string
}

export type OperatorAccessEmailDeliveryResult = {
  provider: 'resend'
  externalId?: string
}

function resolveRecoveryRedirect(requestUrl: string | URL) {
  const url = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl
  return process.env.QENTRA_OPERATOR_RECOVERY_REDIRECT_URL?.trim() || `${url.origin}/acceso`
}

function formatRolesLabel(roles: string[] | null | undefined) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return 'sin rol operativo asignado'
  }

  return roles.join(', ')
}

function buildOperatorAccessText(payload: OperatorAccessLinkData, roles: string[] | null | undefined) {
  return [
    `Hola ${payload.full_name || payload.email},`,
    '',
    'Tu acceso operativo a Qentra ya esta listo.',
    `Roles: ${formatRolesLabel(roles)}`,
    `Abre este enlace para definir o recuperar tu acceso: ${payload.action_link}`,
    `Si el enlace no abre correctamente, entra luego por: ${payload.redirect_to}`,
  ].join('\n')
}

function buildOperatorAccessHtml(payload: OperatorAccessLinkData, roles: string[] | null | undefined) {
  return `
    <div style="font-family: Georgia, serif; background:#f8fafc; padding:32px; color:#0f172a;">
      <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:24px; overflow:hidden;">
        <div style="padding:32px; background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%); color:#ffffff;">
          <p style="margin:0; font-size:12px; letter-spacing:0.28em; text-transform:uppercase; color:#7dd3fc;">Qentra Access</p>
          <h1 style="margin:16px 0 0; font-size:34px; line-height:1.15;">Acceso operativo listo</h1>
          <p style="margin:16px 0 0; font-size:15px; line-height:1.7; color:rgba(255,255,255,0.82);">
            Usa este enlace para definir o recuperar tu acceso a admin, puerta o totem.
          </p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0; font-size:14px; color:#475569;">Operador</p>
          <h2 style="margin:8px 0 0; font-size:28px; line-height:1.2;">${payload.full_name || payload.email}</h2>
          <p style="margin:16px 0 0; font-size:14px; line-height:1.7; color:#475569;">
            Roles: ${formatRolesLabel(roles)}
          </p>
          <p style="margin:24px 0;">
            <a href="${payload.action_link}" style="display:inline-block; padding:14px 20px; border-radius:16px; background:#0f172a; color:#ffffff; text-decoration:none; font-weight:600;">
              Abrir acceso
            </a>
          </p>
          <p style="margin:0; font-size:14px; line-height:1.7; color:#475569;">
            Si el boton no abre correctamente, copia y pega este enlace:
          </p>
          <p style="margin:16px 0 0; font-size:14px; line-height:1.7; color:#0f172a;">
            ${payload.action_link}
          </p>
        </div>
      </div>
    </div>
  `.trim()
}

export async function generateOperatorAccessLink(
  adminClient: SupabaseAdminClient,
  userId: string,
  requestUrl: string | URL
): Promise<OperatorAccessLinkData> {
  const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId)

  if (userError) {
    throw new Error(userError.message)
  }

  const user = userData.user
  const email = user?.email

  if (!email) {
    throw new Error('El operador no tiene email asociado.')
  }

  const redirectTo = resolveRecoveryRedirect(requestUrl)
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo,
    },
  })

  if (linkError) {
    throw new Error(linkError.message)
  }

  const fullName =
    user?.user_metadata &&
    typeof user.user_metadata === 'object' &&
    'full_name' in user.user_metadata &&
    typeof user.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : null

  return {
    user_id: userId,
    email,
    full_name: fullName,
    action_link: linkData.properties.action_link,
    redirect_to: linkData.properties.redirect_to,
    verification_type: linkData.properties.verification_type,
  }
}

export async function sendOperatorAccessEmail(
  payload: OperatorAccessLinkData,
  roles: string[] | null | undefined
): Promise<OperatorAccessEmailDeliveryResult> {
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
      to: [payload.email],
      subject: 'Tu acceso operativo a Qentra',
      html: buildOperatorAccessHtml(payload, roles),
      text: buildOperatorAccessText(payload, roles),
    }),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body?.message || 'Resend rechazo el envio del acceso del operador.')
  }

  return {
    provider: 'resend',
    externalId: body?.id,
  }
}

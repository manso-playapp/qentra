import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'

export const runtime = 'nodejs'

function missingWhenEmpty(name: string, value: string | undefined) {
  return value?.trim() ? [] : [name]
}

function getGuestWhatsAppMissing() {
  const missing = [
    ...missingWhenEmpty('TWILIO_ACCOUNT_SID', process.env.TWILIO_ACCOUNT_SID),
    ...missingWhenEmpty('TWILIO_AUTH_TOKEN', process.env.TWILIO_AUTH_TOKEN),
  ]

  const hasSender = Boolean(
    process.env.TWILIO_WHATSAPP_FROM?.trim() || process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()
  )

  if (!hasSender) {
    missing.push('TWILIO_WHATSAPP_FROM o TWILIO_MESSAGING_SERVICE_SID')
  }

  const hasTemplateOrFreeform = Boolean(
    process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim() ||
      process.env.TWILIO_WHATSAPP_ALLOW_FREEFORM === 'true'
  )

  if (!hasTemplateOrFreeform) {
    missing.push('TWILIO_WHATSAPP_CONTENT_SID o TWILIO_WHATSAPP_ALLOW_FREEFORM=true')
  }

  return missing
}

export async function GET() {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  const recoveryRedirectConfigured = Boolean(process.env.QENTRA_OPERATOR_RECOVERY_REDIRECT_URL?.trim())

  const guestEmailMissing = [
    ...missingWhenEmpty('RESEND_API_KEY', process.env.RESEND_API_KEY),
    ...missingWhenEmpty('QENTRA_EMAIL_FROM', process.env.QENTRA_EMAIL_FROM),
  ]

  const operatorAccessEmailMissing = [
    ...missingWhenEmpty('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
    ...guestEmailMissing,
  ]

  const guestWhatsAppMissing = getGuestWhatsAppMissing()

  return Response.json({
    data: {
      serviceRoleConfigured,
      recoveryRedirectConfigured,
      operatorAccessEmail: {
        ready: operatorAccessEmailMissing.length === 0,
        missing: operatorAccessEmailMissing,
      },
      guestEmail: {
        ready: guestEmailMissing.length === 0,
        missing: guestEmailMissing,
      },
      guestWhatsApp: {
        ready: guestWhatsAppMissing.length === 0,
        missing: guestWhatsAppMissing,
      },
    },
  })
}

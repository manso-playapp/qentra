import { ensureAuthorizedApiAccess } from '@/lib/operator-auth'
import { getAlistaMercadoPagoConfig } from '@/lib/mercadopago'

export const runtime = 'nodejs'

function missingWhenEmpty(name: string, value: string | undefined) {
  return value?.trim() ? [] : [name]
}

export async function GET() {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  const alistaMercadoPago = getAlistaMercadoPagoConfig()
  const recoveryRedirectConfigured = Boolean(
    process.env.ALISTA_OPERATOR_RECOVERY_REDIRECT_URL?.trim() ||
      process.env.QENTRA_OPERATOR_RECOVERY_REDIRECT_URL?.trim()
  )

  const guestEmailMissing = [
    ...missingWhenEmpty('RESEND_API_KEY', process.env.RESEND_API_KEY),
    ...missingWhenEmpty(
      'ALISTA_EMAIL_FROM',
      process.env.ALISTA_EMAIL_FROM ?? process.env.QENTRA_EMAIL_FROM
    ),
  ]

  const operatorAccessEmailMissing = [
    ...missingWhenEmpty('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
    ...guestEmailMissing,
  ]

  return Response.json({
    data: {
      serviceRoleConfigured,
      alistaMercadoPago: {
        ready: Boolean(alistaMercadoPago),
        mode: alistaMercadoPago?.mode ?? null,
        missing: alistaMercadoPago ? [] : ['MERCADOPAGO_ALISTA_ACCESS_TOKEN'],
      },
      recoveryRedirectConfigured,
      operatorAccessEmail: {
        ready: operatorAccessEmailMissing.length === 0,
        missing: operatorAccessEmailMissing,
      },
      guestEmail: {
        ready: guestEmailMissing.length === 0,
        missing: guestEmailMissing,
      },
    },
  })
}

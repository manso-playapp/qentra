import {
  ensureAuthorizedApiAccess,
  isSecurityOverrideConfigured,
  isSecuritySupervisorPinConfigured,
  verifySecurityOverridePin,
  verifySecuritySupervisorPin,
} from '@/lib/operator-auth'

type SecurityOverrideRequestBody = {
  pin?: string
  supervisorPin?: string
}

export const runtime = 'nodejs'

export async function GET() {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin', 'door', 'security_supervisor'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  return Response.json({
    overridePinConfigured: isSecurityOverrideConfigured(),
    supervisorPinRequired: isSecuritySupervisorPinConfigured(),
  })
}

export async function POST(request: Request) {
  const { response: authErrorResponse } = await ensureAuthorizedApiAccess(['admin', 'door', 'security_supervisor'])

  if (authErrorResponse) {
    return authErrorResponse
  }

  if (!isSecurityOverrideConfigured()) {
    return Response.json(
      { error: 'Security override PIN is not configured.' },
      { status: 503 }
    )
  }

  let body: SecurityOverrideRequestBody | null = null

  try {
    body = (await request.json()) as SecurityOverrideRequestBody

    if (!body.pin) {
      return Response.json(
        { error: 'Falta el PIN de override.' },
        { status: 400 }
      )
    }

    if (!verifySecurityOverridePin(body.pin)) {
      return Response.json(
        { error: 'PIN de override invalido.' },
        { status: 401 }
      )
    }

    if (isSecuritySupervisorPinConfigured()) {
      if (!body.supervisorPin) {
        return Response.json(
          { error: 'Falta el PIN de supervisor.' },
          { status: 400 }
        )
      }

      if (!verifySecuritySupervisorPin(body.supervisorPin)) {
        return Response.json(
          { error: 'PIN de supervisor invalido.' },
          { status: 401 }
        )
      }
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json(
      { error: 'No se pudo validar el override.' },
      { status: 500 }
    )
  }
}

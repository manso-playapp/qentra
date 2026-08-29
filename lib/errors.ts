export function getErrorMessage(error: unknown) {
  const sanitizeMessage = (message: string) => {
    const internalConfigurationMarkers = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'ALISTA_OPERATOR_PASSWORD',
      'ALISTA_OPERATOR_SESSION_SECRET',
      'ALISTA_SECURITY_OVERRIDE_PIN',
      'RESEND_API_KEY',
      'ALISTA_EMAIL_FROM',
    ]

    if (internalConfigurationMarkers.some((marker) => message.includes(marker))) {
      return 'El servicio no está disponible temporalmente. Contactá al equipo de Alista.'
    }

    return message
  }

  if (error instanceof Error) {
    return sanitizeMessage(error.message)
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown; error_description?: unknown; details?: unknown }

    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return sanitizeMessage(candidate.message)
    }

    if (typeof candidate.error_description === 'string' && candidate.error_description.trim()) {
      return sanitizeMessage(candidate.error_description)
    }

    if (typeof candidate.details === 'string' && candidate.details.trim()) {
      return sanitizeMessage(candidate.details)
    }
  }

  return 'Ocurrio un error inesperado'
}

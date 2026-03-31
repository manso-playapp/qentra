export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as { message?: unknown; error_description?: unknown; details?: unknown }

    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return candidate.message
    }

    if (typeof candidate.error_description === 'string' && candidate.error_description.trim()) {
      return candidate.error_description
    }

    if (typeof candidate.details === 'string' && candidate.details.trim()) {
      return candidate.details
    }
  }

  return 'Ocurrio un error inesperado'
}

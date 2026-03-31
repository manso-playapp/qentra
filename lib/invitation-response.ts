type InvitationDetailsInput = {
  dni?: string
  dietaryRequirements?: string
  companionNames?: string
  observations?: string
  paymentStatus?: 'not_required' | 'pending' | 'approved'
}

export type ParsedInvitationDetails = {
  dni: string
  dietaryRequirements: string
  companionNames: string
  observations: string
  paymentStatus: 'not_required' | 'pending' | 'approved'
}

const LABELS = {
  dni: 'DNI',
  dietaryRequirements: 'Menu',
  companionNames: 'Acompanantes',
  observations: 'Observaciones',
  paymentStatus: 'Pago',
} as const

export function serializeInvitationDetails({
  dni,
  dietaryRequirements,
  companionNames,
  observations,
  paymentStatus,
}: InvitationDetailsInput) {
  const sections = [
    { label: LABELS.dni, value: dni?.trim() },
    { label: LABELS.dietaryRequirements, value: dietaryRequirements?.trim() },
    { label: LABELS.companionNames, value: companionNames?.trim() },
    { label: LABELS.observations, value: observations?.trim() },
    {
      label: LABELS.paymentStatus,
      value: paymentStatus && paymentStatus !== 'not_required' ? paymentStatus : undefined,
    },
  ].filter((section) => section.value)

  return sections.map((section) => `${section.label}: ${section.value}`).join('\n')
}

export function parseInvitationDetails(value?: string | null): ParsedInvitationDetails {
  const lines = (value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed: ParsedInvitationDetails = {
    dni: '',
    dietaryRequirements: '',
    companionNames: '',
    observations: '',
    paymentStatus: 'not_required',
  }

  const legacyLines: string[] = []

  for (const line of lines) {
    if (line.startsWith(`${LABELS.dni}:`)) {
      parsed.dni = line.replace(`${LABELS.dni}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.dietaryRequirements}:`)) {
      parsed.dietaryRequirements = line.replace(`${LABELS.dietaryRequirements}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.companionNames}:`)) {
      parsed.companionNames = line.replace(`${LABELS.companionNames}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.observations}:`)) {
      parsed.observations = line.replace(`${LABELS.observations}:`, '').trim()
      continue
    }

    if (line.startsWith(`${LABELS.paymentStatus}:`)) {
      const value = line.replace(`${LABELS.paymentStatus}:`, '').trim()
      if (value === 'pending' || value === 'approved' || value === 'not_required') {
        parsed.paymentStatus = value
      }
      continue
    }

    legacyLines.push(line)
  }

  if (!parsed.observations && legacyLines.length > 0) {
    parsed.observations = legacyLines.join('\n')
  }

  return parsed
}

export function isInvitationAccessReady(
  guestStatus?: string | null,
  paymentStatus: ParsedInvitationDetails['paymentStatus'] = 'not_required'
) {
  if (guestStatus === 'checked_in') {
    return true
  }

  if (guestStatus !== 'enabled') {
    return false
  }

  return paymentStatus === 'not_required' || paymentStatus === 'approved'
}

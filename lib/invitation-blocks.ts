export const INVITATION_BLOCK_KEYS = [
  'personal',
  'eventDetails',
  'countdown',
  'dresscode',
  'gift',
  'actions',
  'audio',
  'guestData',
] as const

export type InvitationBlockKey = (typeof INVITATION_BLOCK_KEYS)[number]

export type InvitationBlock = {
  visible: boolean
  title: string
  body: string
}

export type InvitationBlocks = Partial<Record<InvitationBlockKey, Partial<InvitationBlock>>>

export const DEFAULT_INVITATION_BLOCKS: Record<InvitationBlockKey, InvitationBlock> = {
  personal: {
    visible: true,
    title: 'Invitación especial para',
    body: 'Confirmá tu asistencia para que todo esté listo cuando llegues.',
  },
  eventDetails: { visible: true, title: 'Fecha, hora y lugar', body: '' },
  countdown: { visible: false, title: 'Faltan:', body: '' },
  dresscode: { visible: true, title: 'Dress Code', body: '' },
  gift: { visible: true, title: 'Regalo', body: '' },
  actions: { visible: true, title: '', body: '' },
  audio: { visible: true, title: '', body: '' },
  guestData: { visible: true, title: 'Tus Datos', body: '' },
}

export function getInvitationBlock(blocks: InvitationBlocks | undefined, key: InvitationBlockKey) {
  return {
    ...DEFAULT_INVITATION_BLOCKS[key],
    ...(blocks?.[key] ?? {}),
  }
}

export function isInvitationBlockVisible(
  blocks: InvitationBlocks | undefined,
  key: InvitationBlockKey,
  fallback = DEFAULT_INVITATION_BLOCKS[key].visible
) {
  return blocks?.[key]?.visible ?? fallback
}

/**
 * Keeps persisted block settings small and predictable. Unknown block keys
 * and non-object values are ignored so an old or manually edited config
 * cannot break the public invitation.
 */
export function normalizeInvitationBlocks(raw: unknown): InvitationBlocks {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const source = raw as Record<string, unknown>
  const result: InvitationBlocks = {}

  for (const key of INVITATION_BLOCK_KEYS) {
    const value = source[key]
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue

    const block = value as Record<string, unknown>
    result[key] = {
      ...(typeof block.visible === 'boolean' ? { visible: block.visible } : {}),
      ...(typeof block.title === 'string' ? { title: block.title.trim().slice(0, 120) } : {}),
      ...(typeof block.body === 'string' ? { body: block.body.trim().slice(0, 500) } : {}),
    }
  }

  return result
}

import { INVITATION_BLOCK_KEYS, type InvitationBlockKey, type InvitationBlocks } from './invitation-blocks'
import type { InvitationLogoConfig } from './invitation-logo'

export const INVITATION_TEMPLATE_KEYS = ['travel', 'midnight'] as const

export type InvitationTemplateKey = (typeof INVITATION_TEMPLATE_KEYS)[number]

export type InvitationTemplateDefinition = {
  key: InvitationTemplateKey
  label: string
  description: string
  supportedBlocks: readonly InvitationBlockKey[]
  defaultBlockOrder: readonly InvitationBlockKey[]
}

export const INVITATION_TEMPLATES: InvitationTemplateDefinition[] = [
  {
    key: 'travel',
    supportedBlocks: ['eventDetails', 'dresscode', 'gift', 'actions', 'audio', 'guestData'],
    defaultBlockOrder: ['eventDetails', 'dresscode', 'gift', 'actions', 'audio', 'guestData'],
    label: 'Viaje',
    description: 'Boarding pass, ruta y detalles de abordaje. Es el aspecto actual de la invitación.',
  },
  {
    key: 'midnight',
    supportedBlocks: INVITATION_BLOCK_KEYS,
    defaultBlockOrder: INVITATION_BLOCK_KEYS,
    label: 'Noche',
    description: 'Una portada nocturna y editorial para que la identidad de la fiesta sea protagonista.',
  },
]

export function getInvitationTemplateDefinition(template: InvitationTemplateKey) {
  return INVITATION_TEMPLATES.find((item) => item.key === template) ?? INVITATION_TEMPLATES[0]
}

export type InvitationBrandingConfig = {
  template?: InvitationTemplateKey
  fontFamily?: 'sans' | 'serif' | 'display'
  audio_url?: string
  widgets?: { countdown?: boolean; particles?: boolean }
  fields?: { rsvp?: boolean; dni?: boolean; menu?: boolean; companions?: boolean }
  blocks?: InvitationBlocks
  logo?: Partial<InvitationLogoConfig>
}

export function normalizeInvitationTemplate(value: unknown): InvitationTemplateKey {
  return INVITATION_TEMPLATE_KEYS.includes(value as InvitationTemplateKey) ? (value as InvitationTemplateKey) : 'travel'
}

export function getInvitationTemplate(config: unknown): InvitationTemplateKey {
  if (!config || typeof config !== 'object') return 'travel'
  return normalizeInvitationTemplate((config as InvitationBrandingConfig).template)
}

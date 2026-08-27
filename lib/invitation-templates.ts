import type { InvitationBlocks } from './invitation-blocks'

export const INVITATION_TEMPLATE_KEYS = ['travel', 'midnight'] as const

export type InvitationTemplateKey = (typeof INVITATION_TEMPLATE_KEYS)[number]

export type InvitationTemplateDefinition = {
  key: InvitationTemplateKey
  label: string
  description: string
}

export const INVITATION_TEMPLATES: InvitationTemplateDefinition[] = [
  {
    key: 'travel',
    label: 'Viaje',
    description: 'Boarding pass, ruta y detalles de abordaje. Es el aspecto actual de la invitación.',
  },
  {
    key: 'midnight',
    label: 'Noche',
    description: 'Una portada nocturna y editorial para que la identidad de la fiesta sea protagonista.',
  },
]

export type InvitationBrandingConfig = {
  template?: InvitationTemplateKey
  fontFamily?: 'sans' | 'serif' | 'display'
  audio_url?: string
  widgets?: { countdown?: boolean; particles?: boolean }
  fields?: { rsvp?: boolean; dni?: boolean; menu?: boolean; companions?: boolean }
  blocks?: InvitationBlocks
}

export function normalizeInvitationTemplate(value: unknown): InvitationTemplateKey {
  return INVITATION_TEMPLATE_KEYS.includes(value as InvitationTemplateKey) ? (value as InvitationTemplateKey) : 'travel'
}

export function getInvitationTemplate(config: unknown): InvitationTemplateKey {
  if (!config || typeof config !== 'object') return 'travel'
  return normalizeInvitationTemplate((config as InvitationBrandingConfig).template)
}

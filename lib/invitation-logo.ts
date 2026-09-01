import {
  INVITATION_FONT_KEYS,
  type InvitationFontKey,
} from './invitation-fonts'

export type InvitationLogoConfig = {
  text: string
  font: InvitationFontKey
  size: number
  letterSpacing: number
  color: string
}

export const DEFAULT_INVITATION_LOGO: InvitationLogoConfig = {
  text: '',
  font: 'playfair',
  size: 42,
  letterSpacing: 0.16,
  color: '#ffffff',
}

const HEX = /^#[0-9a-fA-F]{6}$/

export function normalizeInvitationLogo(raw: unknown): Partial<InvitationLogoConfig> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const value = raw as Record<string, unknown>
  const font = value.font
  const size = typeof value.size === 'number' && Number.isFinite(value.size) ? Math.min(96, Math.max(16, value.size)) : undefined
  const letterSpacing = typeof value.letterSpacing === 'number' && Number.isFinite(value.letterSpacing)
    ? Math.min(0.5, Math.max(-0.05, value.letterSpacing))
    : undefined

  return {
    ...(typeof value.text === 'string' ? { text: value.text.trim().slice(0, 80) } : {}),
    ...(typeof font === 'string' && INVITATION_FONT_KEYS.includes(font as InvitationFontKey) ? { font: font as InvitationFontKey } : {}),
    ...(size !== undefined ? { size } : {}),
    ...(letterSpacing !== undefined ? { letterSpacing } : {}),
    ...(typeof value.color === 'string' && HEX.test(value.color) ? { color: value.color } : {}),
  }
}

export const INVITATION_FONT_KEYS = ['nunito', 'playfair', 'inter-tight'] as const

export type InvitationFontKey = (typeof INVITATION_FONT_KEYS)[number]

export type InvitationFontConfig = {
  titles: InvitationFontKey
  subtitles: InvitationFontKey
  data: InvitationFontKey
}

export const DEFAULT_INVITATION_FONTS: InvitationFontConfig = {
  titles: 'playfair',
  subtitles: 'nunito',
  data: 'playfair',
}

export const INVITATION_FONT_STACKS: Record<InvitationFontKey, string> = {
  nunito: 'var(--font-nunito), ui-sans-serif, system-ui, sans-serif',
  playfair: 'var(--font-playfair), Georgia, serif',
  'inter-tight': 'var(--font-inter-tight), ui-sans-serif, system-ui, sans-serif',
}

export const INVITATION_FONT_LABELS: Record<InvitationFontKey, string> = {
  nunito: 'Nunito',
  playfair: 'Playfair Display',
  'inter-tight': 'Inter Tight',
}

export function getInvitationFonts(config?: { fonts?: Partial<InvitationFontConfig> } | null): InvitationFontConfig {
  const isFontKey = (value: unknown): value is InvitationFontKey => INVITATION_FONT_KEYS.includes(value as InvitationFontKey)
  const configured = config?.fonts ?? {}

  return {
    titles: isFontKey(configured.titles) ? configured.titles : DEFAULT_INVITATION_FONTS.titles,
    subtitles: isFontKey(configured.subtitles) ? configured.subtitles : DEFAULT_INVITATION_FONTS.subtitles,
    data: isFontKey(configured.data) ? configured.data : DEFAULT_INVITATION_FONTS.data,
  }
}

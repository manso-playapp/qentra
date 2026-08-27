type ConfigObject = Record<string, unknown>

export type InvitationConfigHistoryEntry = {
  id: string
  saved_at: string
  mode: 'draft' | 'publish'
  config: ConfigObject
}

function isConfigObject(value: unknown): value is ConfigObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

/** Returns the version visible to guests. Legacy configs pass through intact. */
export function getPublishedInvitationConfig(raw: unknown): unknown {
  if (!isConfigObject(raw)) return raw
  return isConfigObject(raw.published) ? raw.published : raw
}

/** The editor always works on the draft when one exists. */
export function getDraftInvitationConfig(raw: unknown): unknown {
  if (!isConfigObject(raw)) return raw
  return isConfigObject(raw.draft) ? raw.draft : getPublishedInvitationConfig(raw)
}

export function getInvitationConfigState(raw: unknown) {
  if (!isConfigObject(raw) || (!isConfigObject(raw.draft) && !isConfigObject(raw.published))) {
    return { draft: raw, published: raw, hasDraft: false }
  }

  return {
    draft: getDraftInvitationConfig(raw),
    published: getPublishedInvitationConfig(raw),
    hasDraft: isConfigObject(raw.draft),
  }
}

/** Historial acotado de configuraciones guardadas por el editor. */
export function getInvitationConfigHistory(raw: unknown): InvitationConfigHistoryEntry[] {
  if (!isConfigObject(raw) || !Array.isArray(raw.history)) return []

  return raw.history.filter((entry): entry is InvitationConfigHistoryEntry => {
    if (!isConfigObject(entry) || typeof entry.id !== 'string' || typeof entry.saved_at !== 'string') return false
    if (entry.mode !== 'draft' && entry.mode !== 'publish') return false
    return isConfigObject(entry.config)
  })
}

export function buildInvitationConfigEnvelope(input: {
  current: unknown
  draft: unknown
  publish: boolean
  history?: InvitationConfigHistoryEntry[]
}) {
  const state = getInvitationConfigState(input.current)
  const currentEnvelope = isConfigObject(input.current) ? input.current : {}
  const draft = isConfigObject(input.draft) ? input.draft : {}
  const published = input.publish ? draft : state.published

  const envelope = {
    version: 1,
    draft,
    published: isConfigObject(published) ? published : {},
    updated_at: new Date().toISOString(),
    published_at: input.publish
      ? new Date().toISOString()
      : typeof currentEnvelope.published_at === 'string'
      ? currentEnvelope.published_at
      : null,
  }

  if (input.history && input.history.length > 0) {
    return { ...envelope, history: input.history.slice(0, 10) }
  }

  return envelope
}

export const MARKETING_ANALYTICS_BROWSER_EVENT = 'alista:marketing-analytics'

export const MARKETING_SECTION_IDS = [
  'hero',
  'before',
  'invitation_demo',
  'whatsapp',
  'journey',
  'personalization',
  'preparation',
  'arrival',
  'dharma',
  'professionals',
  'closing',
] as const

export type MarketingSectionId = (typeof MARKETING_SECTION_IDS)[number]
export type MarketingAudience = 'family' | 'professional' | 'general'

type MarketingEventMap = {
  cta_clicked: {
    placement:
      | 'header'
      | 'home_hero'
      | 'home_professionals'
      | 'home_closing'
      | 'professionals_hero'
      | 'pricing'
    audience: MarketingAudience
    destination: 'demo' | 'professionals' | 'contact' | 'dharma' | 'page_section'
  }
  contact_form_prepared: {
    source: 'familia-demo' | 'profesionales-page' | 'contacto-page'
    audience: MarketingAudience
  }
  contact_email_opened: {
    source: 'familia-demo' | 'profesionales-page' | 'contacto-page'
    audience: MarketingAudience
  }
  invitation_demo_started: Record<string, never>
  invitation_demo_completed: {
    attendee_count: 1 | 2 | 3
    restriction_selected: boolean
  }
  whatsapp_demo_previewed: {
    customized: boolean
  }
  persona_preview_changed: {
    persona: 'student' | 'family' | 'paid_entry'
  }
  visual_style_changed: {
    style: 'editorial' | 'soft' | 'pop'
  }
  preparation_item_viewed: {
    item: 'confirmations' | 'payments' | 'groups' | 'restrictions'
  }
  preparation_item_resolved: {
    item: 'confirmations' | 'payments' | 'groups' | 'restrictions'
    resolved_count: 1 | 2 | 3 | 4
  }
  checkin_demo_started: Record<string, never>
  checkin_demo_completed: {
    group_size: 3
  }
  marketing_section_viewed: {
    section: MarketingSectionId
  }
}

export type MarketingEventName = keyof MarketingEventMap

export type MarketingAnalyticsEvent<
  Name extends MarketingEventName = MarketingEventName,
> = Name extends MarketingEventName
  ? {
      name: Name
      properties: MarketingEventMap[Name]
    }
  : never

type MarketingAnalyticsProperty = string | number | boolean | null

/**
 * Convierte el contrato interno a las propiedades planas admitidas por el
 * proveedor. El filtro es defensivo: evita que un valor futuro no permitido
 * termine saliendo del navegador por accidente.
 */
export function toMarketingAnalyticsProperties(
  event: MarketingAnalyticsEvent,
): Record<string, MarketingAnalyticsProperty> {
  const properties: Record<string, MarketingAnalyticsProperty> = {}

  for (const [key, value] of Object.entries(event.properties)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      properties[key] = value
    }
  }

  return properties
}

export function createMarketingEvent<Name extends MarketingEventName>(
  name: Name,
  properties: MarketingEventMap[Name],
): MarketingAnalyticsEvent<Name> {
  return { name, properties } as MarketingAnalyticsEvent<Name>
}

export function isMarketingSectionId(value: string): value is MarketingSectionId {
  return MARKETING_SECTION_IDS.includes(value as MarketingSectionId)
}

export function trackMarketingEvent<Name extends MarketingEventName>(
  name: Name,
  properties: MarketingEventMap[Name],
): MarketingAnalyticsEvent<Name> {
  const event = createMarketingEvent(name, properties)

  dispatchMarketingEvent(event)
  return event
}

export function dispatchMarketingEvent(event: MarketingAnalyticsEvent) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<MarketingAnalyticsEvent>(MARKETING_ANALYTICS_BROWSER_EVENT, {
        detail: event,
      }),
    )
  }

  return event
}

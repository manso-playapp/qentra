import type { Event } from '@/types'

export type EventTemplateKey =
  | 'quince_signature'
  | 'wedding_classic'
  | 'private_paid'
  | 'corporate_standard'

export type EventTemplateGuestType = {
  name: string
  description?: string
  access_policy_label?: string
  access_start_time?: string
  access_end_time?: string
  access_start_day_offset?: number
  access_end_day_offset?: number
}

export type EventTemplateDefinition = {
  key: EventTemplateKey
  label: string
  summary: string
  eventType: Event['event_type']
  notes: string[]
  guestTypes: EventTemplateGuestType[]
}

export const EVENT_TEMPLATES: EventTemplateDefinition[] = [
  {
    key: 'quince_signature',
    label: '15 años',
    summary: 'Incluye familia, amigos, VIP y acceso after con ventana posterior a medianoche.',
    eventType: 'quince',
    notes: [
      'Pensada para separar mesa principal, invitados generales y after.',
      'Sirve como base para futuros flujos de pulsera o wall pay despues de las 00:00.',
    ],
    guestTypes: [
      {
        name: 'Familia',
        description: 'Mesa principal y familia cercana.',
      },
      {
        name: 'Amigos',
        description: 'Invitados generales de la fiesta.',
      },
      {
        name: 'VIP',
        description: 'Acceso preferente y seguimiento especial.',
      },
      {
        name: 'After 00:00',
        description: 'Invitados habilitados solo para la segunda franja de la fiesta.',
        access_policy_label: 'Despues de las 00:00',
        access_start_time: '00:00',
        access_end_time: '05:00',
        access_start_day_offset: 1,
        access_end_day_offset: 1,
      },
    ],
  },
  {
    key: 'wedding_classic',
    label: 'Boda',
    summary: 'Base simple para familias, amigos y proveedores, con menos variabilidad operativa.',
    eventType: 'wedding',
    notes: [
      'Pensada para una operacion mas lineal y menos excepciones.',
      'Buena base para ceremonia + cena + fiesta en una sola lista.',
    ],
    guestTypes: [
      {
        name: 'Familia novia',
        description: 'Familia y mesa principal del lado de la novia.',
      },
      {
        name: 'Familia novio',
        description: 'Familia y mesa principal del lado del novio.',
      },
      {
        name: 'Amigos',
        description: 'Invitados generales de la celebracion.',
      },
      {
        name: 'Proveedores',
        description: 'Foto, video, coordinacion y staff externo.',
      },
    ],
  },
  {
    key: 'private_paid',
    label: 'Privado pago',
    summary: 'Prepara categorias por acceso y deja base para futuras validaciones de pago.',
    eventType: 'private',
    notes: [
      'Pensada para evolucionar luego a validacion de pago y diferentes tiers.',
      'Por ahora resuelve la segmentacion y las reglas horarias principales.',
    ],
    guestTypes: [
      {
        name: 'Early bird',
        description: 'Ingreso anticipado con cupo o precio diferencial.',
      },
      {
        name: 'General',
        description: 'Acceso general del evento.',
      },
      {
        name: 'VIP',
        description: 'Acceso preferente o mesa reservada.',
      },
      {
        name: 'After',
        description: 'Ingreso tardio para segunda etapa del evento.',
        access_policy_label: 'Ingreso despues de medianoche',
        access_start_time: '00:00',
        access_end_time: '06:00',
        access_start_day_offset: 1,
        access_end_day_offset: 1,
      },
    ],
  },
  {
    key: 'corporate_standard',
    label: 'Corporativo',
    summary: 'Segmenta invitados, speakers, prensa y staff para una operacion ordenada.',
    eventType: 'corporate',
    notes: [
      'Base util para acreditacion, speakers y acceso de produccion.',
      'Puede crecer luego a multiples puertas y franjas por bloque horario.',
    ],
    guestTypes: [
      {
        name: 'Invitado',
        description: 'Asistente general del evento.',
      },
      {
        name: 'Speaker',
        description: 'Disertantes o participantes del escenario.',
      },
      {
        name: 'Prensa',
        description: 'Cobertura, medios y contenido.',
      },
      {
        name: 'Staff',
        description: 'Operacion y produccion.',
      },
    ],
  },
]

export function getEventTemplateByKey(templateKey?: string | null) {
  if (!templateKey) {
    return null
  }

  return EVENT_TEMPLATES.find((template) => template.key === templateKey) ?? null
}

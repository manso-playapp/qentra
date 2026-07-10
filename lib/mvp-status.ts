// Estado del MVP contra la definicion del playbook (seccion 16.1).
//
// Este archivo es la unica fuente de verdad de la pagina /admin/estado.
// Al cerrar una feature, cambiar su `status` aca: los porcentajes, las barras
// por modulo y el tablero se recalculan solos.

export type FeatureStatus = 'done' | 'partial' | 'todo'

export type ModuleKey = 'plataforma' | 'admin' | 'guest' | 'checkin' | 'totem'

export interface MvpFeature {
  id: string
  title: string
  module: ModuleKey
  status: FeatureStatus
  /** Que hace hoy el sistema. */
  detail: string
  /** Que falta para darla por cerrada. Solo para `partial` y `todo`. */
  gap?: string
  /** Archivos donde vive la implementacion, para poder auditarlo despues. */
  evidence?: string[]
}

export const MODULES: Record<ModuleKey, { label: string; description: string }> = {
  plataforma: { label: 'Plataforma', description: 'Auth, roles y base comun' },
  admin: { label: 'Admin', description: 'Backoffice de eventos' },
  guest: { label: 'Guest', description: 'Invitacion, registro y QR' },
  checkin: { label: 'Check-In', description: 'Puerta y validacion de acceso' },
  totem: { label: 'Totem', description: 'Pantalla de recepcion' },
}

/** Las 15 features que el playbook define como alcance del MVP. */
export const MVP_FEATURES: MvpFeature[] = [
  {
    id: 'login',
    title: 'Login interno',
    module: 'plataforma',
    status: 'done',
    detail:
      'Supabase Auth real con roles (admin, door, security_supervisor), perfil activo y redireccion protegida por ruta.',
    evidence: ['lib/operator-auth.ts', 'app/acceso/page.tsx'],
  },
  {
    id: 'crear-evento',
    title: 'Creacion de evento',
    module: 'admin',
    status: 'done',
    detail:
      'Alta completa con slug automatico, fecha, venue, capacidad, canal de envio y aplicacion opcional de plantilla operativa.',
    evidence: ['app/admin/events/new/page.tsx', 'app/api/event-templates/apply/route.ts'],
  },
  {
    id: 'branding',
    title: 'Branding del evento',
    module: 'admin',
    status: 'partial',
    detail:
      'El branding se lee y se renderiza en invitacion, totem y detalle del evento. El modelo y el consumo ya existen.',
    gap: 'No hay UI ni API para editarlo: hoy hay que cargar event_branding a mano en la base.',
    evidence: ['app/admin/events/[id]/page.tsx', 'app/totem/[id]/page.tsx'],
  },
  {
    id: 'alta-invitados',
    title: 'Alta manual de invitados',
    module: 'admin',
    status: 'done',
    detail: 'Crear, editar, borrar y cambiar estado del invitado desde la ficha del evento.',
    evidence: ['components/admin/EventGuestsManager.tsx', 'app/api/guests/route.ts'],
  },
  {
    id: 'categorias',
    title: 'Categorias de invitado',
    module: 'admin',
    status: 'done',
    detail:
      'CRUD completo de guest_types, con ventana horaria de acceso por categoria y guarda para no borrar tipos en uso.',
    evidence: ['app/api/guest-types/route.ts', 'components/admin/EventGuestsManager.tsx'],
  },
  {
    id: 'estados',
    title: 'Estados de invitado',
    module: 'admin',
    status: 'partial',
    detail:
      'La base maneja los 7 estados del playbook y el flujo de invitacion los escribe correctamente.',
    gap: 'El panel los colapsa a 4 estados visibles: link_sent y duplicate no se exponen en la UI.',
    evidence: ['lib/guest-schema.ts', 'components/admin/EventGuestsManager.tsx'],
  },
  {
    id: 'link-registro',
    title: 'Link seguro de registro',
    module: 'guest',
    status: 'done',
    detail:
      'Token de un solo uso con expiracion, pagina publica de invitacion, y envio por email o WhatsApp con Resend y Twilio.',
    evidence: ['app/api/guest-access/issue/route.ts', 'app/invitacion/[token]/page.tsx'],
  },
  {
    id: 'foto',
    title: 'Foto del invitado',
    module: 'guest',
    status: 'todo',
    detail: 'Sin implementar. El bucket guest-photos existe en el SQL pero no lo consume nadie.',
    gap: 'Falta el upload en el formulario de invitacion, el guardado en Storage y el campo en el modelo de invitado.',
  },
  {
    id: 'qr',
    title: 'QR por invitado',
    module: 'guest',
    status: 'done',
    detail:
      'Generacion real con la libreria qrcode, persistencia en guest_qr_codes, revocacion del anterior y auto-reparacion de imagenes faltantes.',
    evidence: ['lib/guest-access.ts', 'app/api/guest-access/issue/route.ts'],
  },
  {
    id: 'checkin-web',
    title: 'Check-in web con escaneo QR',
    module: 'checkin',
    status: 'done',
    detail:
      'Escaneo por camara con jsQR, mas ingreso manual del token. Disponible en el panel y en la vista de puerta.',
    evidence: ['components/admin/EventCheckinManager.tsx', 'app/puerta/[id]/page.tsx'],
  },
  {
    id: 'validacion-horario',
    title: 'Validacion por horario',
    module: 'checkin',
    status: 'done',
    detail:
      'Motor puro de politica de acceso con ventanas horarias, desplazamiento de dia y cruce de medianoche. Cubierto por tests.',
    evidence: ['lib/access-policy.ts', 'lib/access-policy.test.ts'],
  },
  {
    id: 'validacion-categoria',
    title: 'Validacion por categoria',
    module: 'checkin',
    status: 'partial',
    detail: 'La ventana horaria de cada categoria se aplica al validar el acceso.',
    gap: 'No hay control de aforo ni cupo por categoria: max_capacity existe en el modelo pero no se valida al ingresar.',
    evidence: ['lib/access-policy.ts'],
  },
  {
    id: 'validacion-duplicado',
    title: 'Validacion de duplicado',
    module: 'checkin',
    status: 'done',
    detail:
      'Rechaza invitados marcados como duplicados y advierte el doble ingreso re-consultando el ultimo check-in.',
    evidence: ['lib/access-policy.ts', 'components/admin/EventCheckinManager.tsx'],
  },
  {
    id: 'registro-checkin',
    title: 'Registro de check-in',
    module: 'checkin',
    status: 'done',
    detail:
      'Actualiza el estado del invitado, inserta en checkins con el metodo usado y consume el token de invitacion.',
    evidence: ['components/admin/EventCheckinManager.tsx'],
  },
  {
    id: 'totem',
    title: 'Totem: idle y respuesta visual',
    module: 'totem',
    status: 'partial',
    detail:
      'La pantalla idle con branding funciona, muestra el ultimo ingreso aprobado y vuelve sola a idle a los 6 segundos.',
    gap: 'Faltan los estados validando y error: hoy el totem es un display pasivo que hace polling, no valida ni muestra rechazos.',
    evidence: ['app/totem/[id]/page.tsx', 'components/admin/EventCheckinManager.tsx'],
  },
]

/** Cosas construidas que el MVP no pedia. Sirven para no subestimar el avance. */
export const BEYOND_MVP: { title: string; detail: string }[] = [
  {
    title: 'Override de seguridad',
    detail: 'Ingreso forzado con PIN de operador y PIN de supervisor, con comparacion timing-safe y auditoria.',
  },
  {
    title: 'Envio por email y WhatsApp',
    detail: 'Integracion real con Resend y Twilio, con guardas de credenciales y salud de canales.',
  },
  {
    title: 'Gestion de operadores',
    detail: 'Alta, roles, activacion, reset de password y links de recuperacion desde Configuracion.',
  },
  {
    title: 'Plantillas de evento',
    detail: 'Preconfiguran tipos de invitado y politica de acceso al crear un evento.',
  },
  {
    title: 'Logs de auditoria',
    detail: 'Registro de envios y trazabilidad de delivery en la vista de configuracion.',
  },
  {
    title: '71 tests automatizados',
    detail: 'Cobertura de la politica de acceso y del parseo de respuestas de invitacion.',
  },
]

/** Deuda conocida. No bloquea el MVP, pero conviene tenerla a la vista. */
export const TECH_DEBT: { title: string; detail: string; severity: 'alta' | 'media' | 'baja' }[] = [
  {
    title: 'supabase-schema.sql no crea las tablas nucleo',
    detail:
      'Solo aplica RLS y policies: asume que las 8 tablas ya existen en Supabase. Levantar el proyecto de cero hoy no es reproducible.',
    severity: 'alta',
  },
  {
    title: 'Vista global de invitados es un placeholder',
    detail: '/admin/guests muestra un cartel de proximamente. El CRUD real solo vive dentro de cada evento.',
    severity: 'media',
  },
  {
    title: 'Guest.status desalineado con la logica real',
    detail: 'El tipo declara 4 estados y el motor de acceso maneja 7. Se sostiene con casts. Trackeado como QEN-007.',
    severity: 'media',
  },
  {
    title: 'totem_sessions definida pero sin uso',
    detail: 'La tabla y el tipo existen, pero ninguna sesion de totem se crea ni se consulta.',
    severity: 'baja',
  },
  {
    title: 'Faltan los documentos base del playbook',
    detail: 'No existen qentra-product-base.md, qentra-db-schema.md ni qentra-roadmap.md.',
    severity: 'baja',
  },
]

/** Lo minimo para poder declarar el MVP cerrado. */
export const NEXT_STEPS: { order: number; title: string; detail: string; featureId: string }[] = [
  {
    order: 1,
    title: 'Foto del invitado',
    detail: 'Es lo unico del MVP que no tiene una sola linea escrita. Upload en la invitacion y guardado en Storage.',
    featureId: 'foto',
  },
  {
    order: 2,
    title: 'Editor de branding',
    detail: 'El consumo ya existe en toda la app. Falta solo el formulario y la API para escribir event_branding.',
    featureId: 'branding',
  },
  {
    order: 3,
    title: 'Estados validando y error en el totem',
    detail: 'Convertir el display pasivo en una pantalla que refleje el resultado de la validacion.',
    featureId: 'totem',
  },
]

const STATUS_WEIGHT: Record<FeatureStatus, number> = {
  done: 1,
  partial: 0.5,
  todo: 0,
}

export interface ProgressSummary {
  done: number
  partial: number
  todo: number
  total: number
  /** Porcentaje 0-100, contando las features a medias como medio punto. */
  percent: number
}

export function summarize(features: MvpFeature[]): ProgressSummary {
  const done = features.filter((feature) => feature.status === 'done').length
  const partial = features.filter((feature) => feature.status === 'partial').length
  const todo = features.filter((feature) => feature.status === 'todo').length
  const total = features.length

  const weighted = features.reduce((sum, feature) => sum + STATUS_WEIGHT[feature.status], 0)
  const percent = total === 0 ? 0 : Math.round((weighted / total) * 100)

  return { done, partial, todo, total, percent }
}

export function summarizeByModule(features: MvpFeature[]) {
  return (Object.keys(MODULES) as ModuleKey[]).map((key) => ({
    key,
    ...MODULES[key],
    ...summarize(features.filter((feature) => feature.module === key)),
  }))
}

export function featuresByStatus(features: MvpFeature[], status: FeatureStatus) {
  return features.filter((feature) => feature.status === status)
}

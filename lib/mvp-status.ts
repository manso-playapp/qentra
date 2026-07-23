// Estado del MVP contra la definicion del playbook (seccion 16.1).
//
// Este archivo es la unica fuente de verdad de la pagina /admin/estado.
// Al cerrar una feature, cambiar su `status` aca: los porcentajes, las barras
// por modulo y el tablero se recalculan solos.

export type FeatureStatus = 'done' | 'partial' | 'todo'

export type ModuleKey = 'plataforma' | 'admin' | 'guest' | 'checkin' | 'totem' | 'pagos'

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
  pagos: { label: 'Pagos', description: 'Cobros y monetizacion' },
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
    status: 'done',
    detail:
      'Editor con colores, logo, portada y fondo (subida a Storage) y los mensajes del totem. Se aplica de verdad en invitacion y totem, con preview de la invitacion.',
    evidence: ['components/admin/BrandingForm.tsx', 'app/api/event-branding/route.ts', 'app/api/uploads/route.ts'],
  },
  {
    id: 'alta-invitados',
    title: 'Alta de invitados (manual, masiva y export)',
    module: 'admin',
    status: 'done',
    detail:
      'Crear, editar, borrar y cambiar estado desde la ficha del evento. Carga masiva por pegado o plantilla CSV descargable, export a CSV y organizador de mesas/destinos para confirmados.',
    evidence: ['components/admin/EventGuestsManager.tsx', 'app/api/guests/bulk/route.ts'],
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
    status: 'done',
    detail:
      'La base maneja los 7 estados del playbook y el flujo de invitacion los escribe correctamente. El panel ahora expone los 7 (Sin invitar, Link enviado, Registrado, Habilitado, Ingreso, Rechazado, Duplicado) como badge, en vez de colapsarlos a 4.',
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
    status: 'done',
    detail:
      'El invitado sube su foto (o selfie con camara) al confirmar. Subida autorizada por token, guardada en el bucket privado guest-photos, visible en el admin y en el spotlight del totem.',
    evidence: ['app/api/invitacion/[token]/photo/route.ts', 'components/invitation/InvitationResponseForm.tsx'],
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
    id: 'conciliacion-pagos',
    title: 'Conciliacion de pagos (asistida)',
    module: 'guest',
    status: 'done',
    detail:
      'El admin puede marcar el aporte desde la ficha y Mercado Pago lo concilia automáticamente. Un pago aprobado actualiza payment_status, habilita el acceso y emite el QR; la invitación también puede revalidar un pago pendiente contra la API de Mercado Pago.',
    evidence: [
      'app/api/guests/[guestId]/route.ts',
      'components/admin/EventGuestsManager.tsx',
      'app/api/invitacion/[token]/payment/sync/route.ts',
    ],
  },
  {
    id: 'checkin-web',
    title: 'Check-in web con escaneo QR',
    module: 'checkin',
    status: 'done',
    detail:
      'Modo Puerta móvil con cámara, prevalidación, foto, DNI, menores confirmados y aprobación explícita. El notebook conserva monitoreo, actividad, búsqueda y excepciones; desde allí genera un QR para abrir el escáner en otro celular autenticado.',
    evidence: ['components/door/DoorScanner.tsx', 'components/admin/DoorScannerLink.tsx', 'app/api/events/[id]/checkin/route.ts'],
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
    title: 'Validacion por categoria y aforo',
    module: 'checkin',
    status: 'done',
    detail:
      'La ventana horaria de cada categoria se aplica al validar el acceso. El aforo TOTAL del evento se valida en la puerta: al llegar al cupo se bloquea el ingreso con override de supervisor (cuenta check-ins aprobados; no descuenta acompañantes porque no se modelan). El cupo por categoria queda fuera de alcance a proposito.',
    evidence: ['lib/access-policy.ts', 'app/api/events/[id]/checkin/route.ts'],
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
      'Actualiza el estado del invitado, inserta en checkins (result, checked_in_at, metodo) y consume el token. Verificado insert+lectura contra la base real.',
    evidence: ['components/admin/EventCheckinManager.tsx', 'lib/hooks.ts'],
  },
  {
    id: 'totem',
    title: 'Totem: idle y respuesta visual',
    module: 'totem',
    status: 'done',
    detail:
      'Pantalla de bienvenida con branding; muestra al instante el ingreso aprobado con foto y destino cuando existe, via Realtime con sondeo de respaldo. Por diseño solo celebra aprobaciones; los rechazos quedan en la puerta.',
    evidence: ['app/api/events/[id]/checkin-feed/route.ts', 'components/admin/EventCheckinManager.tsx'],
  },
  {
    id: 'twilio-numero',
    title: 'Numero de WhatsApp emisor',
    module: 'guest',
    status: 'todo',
    detail: 'El envio por WhatsApp funciona contra el sandbox de Twilio. El envio manual ("mandar desde mi WhatsApp") ya permite invitar desde el numero propio.',
    gap: 'Diferido hasta definir el numero emisor: debe ser propio del evento (de la familia en un 15, de la organizacion en otros), no un unico numero de negocio. El emisor deberia ser configurable por evento; para 15s probablemente convenga el envio manual antes que un sender de Twilio.',
  },
  {
    id: 'invitacion-editor',
    title: 'Editor de invitacion (front editor)',
    module: 'admin',
    status: 'partial',
    detail:
      'Editor dedicado con preview de aspecto, imágenes, información y trivia. La invitación pública usa una composición de boarding pass controlada, con dress code, regalo, ubicación y formulario de confirmación.',
    gap: 'Falta que los controles persistidos del editor afecten de forma completa la composición pública y sumar una trivia funcional si vuelve a ser necesaria.',
    evidence: ['components/admin/InvitationEditor.tsx', 'app/api/events/[id]/invitation/route.ts'],
  },
  {
    id: 'totem-editor',
    title: 'Backend del disenador de totem',
    module: 'totem',
    status: 'todo',
    detail: 'El totem usa el branding y los mensajes cargados en el evento.',
    gap: 'Falta el backend para disenar y guardar la composicion visual del totem a medida.',
  },
  {
    id: 'mercadopago',
    title: 'Cobros con MercadoPago',
    module: 'pagos',
    status: 'done',
    detail:
      'Checkout Pro crea una preferencia por invitado, usa Sandbox en Preview y cobros reales en Producción. Los webhooks firmados y la conciliación autenticada de respaldo validan importe/moneda, actualizan el pago y habilitan o revocan el QR. Flujo end-to-end verificado con una cuenta de prueba.',
    evidence: [
      'app/api/invitacion/[token]/payment/route.ts',
      'app/api/mercadopago/webhook/route.ts',
      'app/api/invitacion/[token]/payment/sync/route.ts',
      'lib/mercadopago-webhook.ts',
    ],
  },
]

/** Cosas construidas que el MVP no pedia. Sirven para no subestimar el avance. */
export const BEYOND_MVP: { title: string; detail: string }[] = [
  {
    title: 'Mesas y destinos operativos',
    detail: 'El panel de invitados permite ubicar grupos confirmados por mesa o sector, cuenta acompañantes y entrega ese dato al Tótem en el ingreso.',
  },
  {
    title: 'Puerta móvil emparejable desde notebook',
    detail: 'El panel de check-in muestra un QR que abre Modo puerta en otro celular autenticado, separado de la superficie de monitoreo detallado.',
  },
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
    title: '113 tests automatizados',
    detail: 'Cobertura de política de acceso, respuestas de invitación, configuración de Mercado Pago y firma de webhooks.',
  },
]

/** Deuda conocida. No bloquea el MVP, pero conviene tenerla a la vista. */
export const TECH_DEBT: { title: string; detail: string; severity: 'alta' | 'media' | 'baja' }[] = [
]

/** Con el alcance del MVP cerrado, lo que sigue: probarlo de verdad y pulir. */
export const NEXT_STEPS: { order: number; title: string; detail: string; featureId: string }[] = [
  {
    order: 1,
    title: 'Terminar el editor de invitacion',
    detail: 'Spotify real (buscar y sumar temas a la playlist), guardar respuestas de trivia y que los toggles de campos afecten el formulario publico y su validacion.',
    featureId: 'invitacion-editor',
  },
  {
    order: 2,
    title: 'Editor del totem (dedicado)',
    detail: 'Su propio editor, distinto al de la invitacion: composicion visual y mensajes del totem con preview en vivo.',
    featureId: 'totem-editor',
  },
  {
    order: 3,
    title: 'Numero de WhatsApp productivo',
    detail: 'El envio por WhatsApp corre contra el sandbox de Twilio. Dar de alta un numero propio aprobado para escribirle a cualquier invitado sin opt-in previo.',
    featureId: 'twilio-numero',
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

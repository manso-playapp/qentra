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

/** Features que hoy componen el alcance operativo del MVP. */
export const MVP_FEATURES: MvpFeature[] = [
  {
    id: 'login',
    title: 'Login interno',
    module: 'plataforma',
    status: 'done',
    detail:
      'Supabase Auth real con roles (admin, door, security_supervisor), acceso con Google para clientas, perfil activo y redireccion protegida por ruta.',
    evidence: ['lib/operator-auth.ts', 'app/acceso/page.tsx', 'app/acceso/callback/route.ts'],
  },
  {
    id: 'propiedad-evento',
    title: 'Propiedad del evento',
    module: 'plataforma',
    status: 'done',
    detail:
      'Cada evento tiene una responsable como dueña, puede tener colaboradores y la propiedad se puede transferir a una cuenta existente sin duplicar el evento.',
    evidence: ['supabase/migrations/20260828120000_add_event_admin_assignments.sql', 'app/api/events/[id]/transfer/route.ts'],
  },
  {
    id: 'crear-evento',
    title: 'Creacion de evento',
    module: 'admin',
    status: 'done',
    detail:
      'Alta completa con slug automatico, fecha, venue, capacidad y aplicacion opcional de plantilla operativa.',
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
      'Token de un solo uso con expiracion, pagina publica de invitacion, envio por email con Resend y enlace preparado para compartir por WhatsApp personal.',
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
    id: 'activacion-evento',
    title: 'Activación comercial del evento',
    module: 'pagos',
    status: 'done',
    detail:
      'El evento se puede configurar y cargar invitados antes del pago. La activación controla la emisión de links de invitación y conserva el origen: pago, cortesía o manual.',
    evidence: ['supabase/migrations/20260828160000_add_event_activations.sql', 'app/api/guest-access/issue/route.ts', 'components/admin/EventActivationCard.tsx'],
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
    title: 'Automatizacion de WhatsApp',
    module: 'guest',
    status: 'todo',
    detail: 'El envio manual ("mandar desde mi WhatsApp") ya permite invitar desde el numero propio, sin conectar ni automatizar WhatsApp personal.',
    gap: 'La automatizacion masiva por WhatsApp queda fuera de prioridad. Se conserva como posible evolucion futura, no como requisito del producto actual.',
  },
  {
    id: 'invitacion-editor',
    title: 'Editor de invitacion (front editor)',
    module: 'admin',
    status: 'partial',
    detail:
      'Editor dedicado con preview de aspecto, imágenes e información. La preview y la invitación pública comparten la misma vista, con borrador/publicación separados y composición controlada por template.',
    gap: 'Falta QA final contra invitaciones públicas reales y definir si el historial debe evolucionar a versiones etiquetadas por el organizador.',
    evidence: ['components/admin/InvitationEditor.tsx', 'app/api/events/[id]/invitation/route.ts'],
  },
  {
    id: 'totem-editor',
    title: 'Editor del totem',
    module: 'totem',
    status: 'partial',
    detail: 'Editor dedicado para logo, fondo, colores y mensajes del totem, con preview de pantalla en espera y acceso aprobado. Los cambios se guardan por evento y se consumen en la pantalla publica.',
    gap: 'Queda definir presets de composicion, soporte opcional para video idle y una vista responsive que replique exactamente el dispositivo final.',
    evidence: ['components/admin/BrandingForm.tsx', 'app/api/event-branding/route.ts', 'components/admin/EventCheckinManager.tsx'],
  },
  {
    id: 'mercadopago',
    title: 'Cobros con MercadoPago',
    module: 'pagos',
    status: 'done',
    detail:
      'Checkout Pro crea una preferencia por invitado para la cuenta receptora del evento y una preferencia separada para el servicio de Alista. Usa Sandbox en Preview y cobros reales en Producción. Los webhooks firmados validan importe, moneda y referencia; los pagos aprobados habilitan el QR del invitado o activan el evento.',
    evidence: [
      'app/api/invitacion/[token]/payment/route.ts',
      'app/api/events/[id]/activation/payment/route.ts',
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
    title: 'Envio de emails y WhatsApp manual',
    detail: 'Resend cubre el email como alternativa; WhatsApp se prepara para compartir desde el telefono propio del organizador.',
  },
  {
    title: 'Gestion de operadores',
    detail: 'Alta, roles, activacion, reset de password, links de recuperacion y eliminacion segura desde Configuracion.',
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
    title: '329 tests automatizados',
    detail: 'Cobertura de política de acceso, respuestas de invitación, activación comercial, configuración de Mercado Pago y firma de webhooks.',
  },
  {
    title: 'Sidebar contextual por evento',
    detail: 'Selector de eventos y accesos directos a Invitación, Invitados, Tótem, Check-in y Puerta, sin mezclar la navegación de la cuenta con la operación de una fiesta.',
  },
]

/** Deuda conocida. No bloquea el MVP, pero conviene tenerla a la vista. */
export const TECH_DEBT: { title: string; detail: string; severity: 'alta' | 'media' | 'baja' }[] = [
]

/** Con el alcance del MVP cerrado, lo que sigue: probarlo de verdad y pulir. */
export const NEXT_STEPS: { order: number; title: string; detail: string; featureId: string }[] = [
  {
    order: 1,
    title: 'Check-in grupal e individual',
    detail: 'Permitir ingresar un grupo con un solo QR, desmarcar ausentes y registrar llegadas individuales sin perder la identidad del titular.',
    featureId: 'registro-checkin',
  },
  {
    order: 2,
    title: 'Recepción con conectividad degradada',
    detail: 'Cache local, cola durable y sincronización posterior para que una caída breve de red no detenga la puerta.',
    featureId: 'registro-checkin',
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

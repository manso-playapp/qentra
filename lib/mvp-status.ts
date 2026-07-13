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
      'Crear, editar, borrar y cambiar estado desde la ficha del evento. Carga masiva pegando una lista (CSV/tab) con insert unico, y export a CSV de todos los invitados con estado, pago y contacto.',
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
      'El admin marca el aporte de cada invitado como sin cobro / pendiente / confirmado desde la ficha. Confirmarlo destraba la emision del acceso (isInvitationAccessReady ya gatea contra la columna payment_status). La pasarela automatica (MercadoPago) sigue pendiente aparte.',
    evidence: ['app/api/guests/[guestId]/route.ts', 'components/admin/EventGuestsManager.tsx'],
  },
  {
    id: 'checkin-web',
    title: 'Check-in web con escaneo QR',
    module: 'checkin',
    status: 'done',
    detail:
      'Escaneo por camara con jsQR mas ingreso manual del token. Probado end-to-end: invitacion por mail, registro con foto, lectura en la puerta y festejo en el totem, todo funcionando con el registro persistido.',
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
      'Pantalla de bienvenida con branding; muestra el ingreso aprobado con la FOTO del invitado al instante via Realtime (con polling de respaldo) y vuelve sola a idle. Por diseno solo celebra aprobaciones; los rechazos quedan en la puerta.',
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
      'Editor dedicado con preview en vivo de dos paneles: aspecto (colores, tipografia, subida de logo/portada/fondo), info (dresscode, como llegar) y widgets opcionales (mensaje, trivia, Spotify) + toggles de campos. Todo persiste (aspecto e imagenes en columnas; la config rica en event_branding.config). La invitacion publica muestra dresscode y como llegar.',
    gap: 'Falta Spotify real (buscar y sumar temas), guardar respuestas de trivia y que los toggles de campos afecten el formulario publico y su validacion.',
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
    status: 'todo',
    detail: 'Sin integracion de pagos todavia.',
    gap: 'Falta conectar MercadoPago para cobrar entradas o el uso de la plataforma.',
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

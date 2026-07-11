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
    status: 'done',
    detail:
      'Editor con colores, logo, portada y fondo (subida a Storage) y los mensajes del totem. Se aplica de verdad en invitacion y totem, con preview de la invitacion.',
    evidence: ['components/admin/BrandingForm.tsx', 'app/api/event-branding/route.ts', 'app/api/uploads/route.ts'],
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
    id: 'checkin-web',
    title: 'Check-in web con escaneo QR',
    module: 'checkin',
    status: 'done',
    detail:
      'Escaneo por camara con jsQR mas ingreso manual del token. El registro ahora SI persiste: el codigo escribia contra columnas inexistentes y ningun check-in se guardaba (tabla siempre vacia). Alineado al esquema real.',
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
    title: 'Tipos TS vs esquema real: auditados',
    detail:
      'Se barrieron las 11 tablas y todos los select/insert/update contra las columnas reales. Corregidos: branding (banner_url), check-in (checkin_time/method, nunca persistia) y directorio (plus_ones). Runtime limpio. Quedan campos virtuales en el tipo Guest (special_requests=notes, plus_ones no se persisten) documentados; los acompañantes como dato estructurado siguen sin modelar.',
    severity: 'media',
  },
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

/** Con el alcance del MVP cerrado, lo que sigue: probarlo de verdad y pulir. */
export const NEXT_STEPS: { order: number; title: string; detail: string; featureId: string }[] = [
  {
    order: 1,
    title: 'Prueba real end-to-end en produccion',
    detail: 'Cargar invitado, confirmar con foto, escanear el QR en la puerta y ver el spotlight en el totem. Cada pieza se verifico contra la base, pero el flujo completo con camara nunca se corrio (el check-in estaba roto hasta ahora).',
    featureId: 'checkin-web',
  },
  {
    order: 2,
    title: 'Habilitar Realtime en checkins',
    detail: 'Agregar la tabla checkins a la publicacion supabase_realtime para que el spotlight del totem sea instantaneo. Sin esto funciona igual, pero con la demora del polling.',
    featureId: 'totem',
  },
  {
    order: 3,
    title: 'Aforo por categoria y exponer los 7 estados',
    detail: 'Los dos partials que no bloquean el MVP: control de cupo por categoria en el check-in, y mostrar link_sent/duplicate en el panel.',
    featureId: 'validacion-categoria',
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

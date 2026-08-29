/**
 * Registro interno de cambios de Alista.
 *
 * Las entradas se curan desde Git para que el historial explique el impacto
 * del cambio y no quede atado a que .git exista en el build de producción.
 * Cada cambio funcional nuevo debe sumar su entrada en el mismo commit.
 */

export type AlistaChangeKind = 'producto' | 'experiencia' | 'estabilidad' | 'documentación'

export type AlistaChange = {
  commit: string
  date: string
  dateLabel: string
  kind: AlistaChangeKind
  area: string
  title: string
  summary: string
}

export const ALISTA_CHANGELOG: AlistaChange[] = [
  {
    commit: 'pending',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'producto',
    area: 'Estado ALISTA',
    title: 'El estado de la aplicación pasó a ser un log de producto',
    summary: 'Se retiraron explicaciones internas de las tarjetas operativas, se relevó el copy visible y el historial quedó concentrado en un registro cronológico.',
  },
  {
    commit: '99c4e14',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'producto',
    area: 'Responsabilidad y cobros',
    title: 'La cuenta receptora forma parte de la cuenta responsable',
    summary: 'La responsabilidad del evento y la cuenta Mercado Pago quedan explicadas y operadas dentro de una misma superficie.',
  },
  {
    commit: 'db09360',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'experiencia',
    area: 'Cobros de invitados',
    title: 'Se aclaró el estado de la cuenta Mercado Pago',
    summary: 'La interfaz diferencia una cuenta vinculada de una cuenta que todavía necesita configuración para volver a vincularse o renovar credenciales.',
  },
  {
    commit: '05ddcb9',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'producto',
    area: 'Propiedad del evento',
    title: 'La transferencia de responsabilidad es inmediata',
    summary: 'La confirmación deja claro que la nueva responsable no necesita aceptar y que invitados, configuración, colaboradores y cobros se conservan.',
  },
  {
    commit: '4d777e2',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'estabilidad',
    area: 'Panel admin',
    title: 'Las fechas se renderizan igual en servidor y navegador',
    summary: 'Se eliminó la diferencia de formato regional que provocaba errores de hidratación en las fechas del panel.',
  },
  {
    commit: 'd529848',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'experiencia',
    area: 'Navegación',
    title: 'La barra de desplazamiento quedó integrada al sidebar',
    summary: 'La línea de scroll es más fina y discreta, manteniendo visible toda la navegación contextual.',
  },
  {
    commit: 'e9e6963',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'estabilidad',
    area: 'Build',
    title: 'Se sincronizaron las dependencias bloqueadas',
    summary: 'El lockfile quedó alineado con el proyecto para que las instalaciones y los builds reproduzcan el mismo conjunto de paquetes.',
  },
  {
    commit: 'aab833f',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'experiencia',
    area: 'Navegación',
    title: 'Se redujo el espacio entre opciones del sidebar',
    summary: 'La navegación ocupa menos altura y deja más lugar para las opciones propias del evento.',
  },
  {
    commit: '694ab1f',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'experiencia',
    area: 'Navegación',
    title: 'El scroll acompaña toda la navegación',
    summary: 'El desplazamiento se integró a la columna completa para que la cuenta y los accesos del evento no queden aislados.',
  },
  {
    commit: '6cdc7ba',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'experiencia',
    area: 'Cuenta',
    title: 'El pie de cuenta se volvió compacto',
    summary: 'La identidad de la cuenta y el cierre de sesión se agruparon en un menú de tres puntos para liberar espacio.',
  },
  {
    commit: '77f8ce6',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'estabilidad',
    area: 'Editor de invitación',
    title: 'El historial de versiones dejó de cambiar al hidratar',
    summary: 'Las fechas del historial usan un formato estable y ya no generan diferencias entre el HTML inicial y el navegador.',
  },
  {
    commit: 'b3c526d',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'experiencia',
    area: 'Navegación',
    title: 'El evento activo se identifica con una barra lateral',
    summary: 'El estado activo dejó de depender de marcos en los botones y se reconoce con una señal visual más liviana.',
  },
  {
    commit: '5b9b23d',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'producto',
    area: 'Operación por evento',
    title: 'Se incorporó la navegación contextual del evento',
    summary: 'Cada evento reúne accesos a invitación, invitados, tótem, check-in y puerta sin mezclar la agenda general.',
  },
  {
    commit: 'cd1d588',
    date: '2026-08-29',
    dateLabel: '29 ago 2026',
    kind: 'producto',
    area: 'Activación',
    title: 'El pago de Alista activa el evento',
    summary: 'El cobro propio se concilia antes de habilitar la emisión de links de invitación y conserva el origen de la activación.',
  },
  {
    commit: 'cc79be3',
    date: '28 ago 2026',
    dateLabel: '28 ago 2026',
    kind: 'producto',
    area: 'Propiedad del evento',
    title: 'Superadmin puede transferir la responsabilidad',
    summary: 'Se agregó la transferencia segura a una cuenta existente sin modificar invitados, colaboradores ni la cuenta de cobros.',
  },
  {
    commit: 'ecf2e9c',
    date: '28 ago 2026',
    dateLabel: '28 ago 2026',
    kind: 'producto',
    area: 'Acceso y activación',
    title: 'La cuenta responsable obtiene su panel y el evento tiene activación',
    summary: 'Se incorporaron registro con Google, propiedad del evento y el bloqueo de emisión hasta activar el servicio.',
  },
  {
    commit: '4e823b4',
    date: '28 ago 2026',
    dateLabel: '28 ago 2026',
    kind: 'estabilidad',
    area: 'Acceso',
    title: 'Una sesión vencida se trata como sesión cerrada',
    summary: 'El panel deja de responder con error cuando un refresh token ya no es válido y devuelve el flujo normal de acceso.',
  },
  {
    commit: '93f5b5b',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'producto',
    area: 'Invitaciones y precios',
    title: 'Se actualizaron invitación, tótem y servicio',
    summary: 'Las superficies de invitación y recepción reflejan la propuesta comercial y los valores definidos para operar una fiesta.',
  },
  {
    commit: 'e091bd3',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'producto',
    area: 'Configuración',
    title: 'Se pueden eliminar cuentas operativas de forma segura',
    summary: 'La administración de operadores incorpora la baja de cuentas con las validaciones necesarias para no eliminar la cuenta propia.',
  },
  {
    commit: '1758da1',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'producto',
    area: 'Invitaciones',
    title: 'Se simplificaron los canales de entrega',
    summary: 'El flujo distingue el email de Alista del WhatsApp personal de la familia, sin presentar automatización que el producto no ofrece.',
  },
  {
    commit: 'd40075e',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'experiencia',
    area: 'Ficha del evento',
    title: 'Los datos principales se leen mejor en móvil',
    summary: 'Los campos de detalle se apilan verticalmente para evitar compresión y pérdida de contexto en pantallas angostas.',
  },
  {
    commit: '36e594b',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'experiencia',
    area: 'Ficha del evento',
    title: 'La información de la invitación tiene un lugar propio',
    summary: 'Los datos públicos del evento dejaron de mezclarse con la operación de invitados y accesos.',
  },
  {
    commit: '93ea286',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'producto',
    area: 'Alcance del producto',
    title: 'Se retiró la función de trivia',
    summary: 'La experiencia se concentró en preparar la llegada, gestionar invitados y operar el acceso.',
  },
  {
    commit: 'c34349c',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'producto',
    area: 'Invitados',
    title: 'Las invitaciones admiten acompañantes identificados',
    summary: 'La carga y la recepción conservan la relación entre titular y acompañantes sin perder trazabilidad.',
  },
  {
    commit: '517968b',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'estabilidad',
    area: 'WhatsApp',
    title: 'Los links de WhatsApp se generan limpios',
    summary: 'Se corrigieron caracteres y parámetros para que compartir una invitación desde el teléfono propio funcione de forma consistente.',
  },
  {
    commit: 'f0ebdbf',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'experiencia',
    area: 'WhatsApp',
    title: 'Se ajustó el texto de invitación',
    summary: 'El mensaje que prepara Alista acompaña mejor el envío personal de la familia.',
  },
  {
    commit: '4dbd048',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'experiencia',
    area: 'Marca',
    title: 'La marca de Alista se usa como favicon',
    summary: 'La identidad de la aplicación también aparece en la pestaña del navegador.',
  },
  {
    commit: 'cfe5953',
    date: '27 ago 2026',
    dateLabel: '27 ago 2026',
    kind: 'estabilidad',
    area: 'WhatsApp',
    title: 'El mensaje de WhatsApp tiene una única fuente',
    summary: 'La composición del texto se centralizó para evitar diferencias entre las distintas superficies de invitación.',
  },
]

export const ALISTA_OPEN_ITEMS = [
  {
    title: 'Retención de datos antes de activar',
    detail: 'Definir cuánto tiempo se conservan los datos de invitados si una cuenta carga la fiesta pero no activa el servicio.',
  },
  {
    title: 'Recepción con conectividad degradada',
    detail: 'Evaluar cache local, cola durable y sincronización posterior para que una caída breve de red no detenga la puerta.',
  },
  {
    title: 'Asignación de operadores de puerta',
    detail: 'Antes de una recepción con equipo propio, asignar explícitamente los operadores al evento para conservar el acceso al modo tótem.',
  },
] as const

export const ALISTA_CHANGELOG_UPDATED_AT = '29 ago 2026'

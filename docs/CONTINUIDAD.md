# EMPEZÁ ACÁ — Continuidad de Alista

> **Para el humano:** al abrir un motor nuevo (Claude Code, Codex, GLM, el que sea), decile:
> *"Leé `docs/CONTINUIDAD.md` y después decime cómo seguimos."*
>
> **Para la IA que lee esto:** este documento es el punto de entrada. NO reemplaza la fuente de
> verdad — te dice en qué orden leerla y en qué estado está todo HOY. Doc **vivo**: se
> **sobrescribe en su lugar** al cerrar cada frente. No crees copias con fecha.

---

## 1. Orden de lectura

1. **`docs/Product/ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md`** — canónico de producto, UX y
   reglas funcionales. Manda sobre todo lo demás.
2. **`docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md`** — propiedad del evento, quién
   compra, muro de pago y Mercado Pago. **Cierra la §42 del anterior y corrige la jerarquía de
   comprador.** En materia de propiedad/comprador/pagos, manda este.
3. **`docs/DHARMA_CASE_PRIVACY.md`** — criterio de privacidad y menores. Leer antes de tocar
   datos de invitados o material audiovisual.
4. **`docs/ALISTA_ESTRATEGIA_NUEVA_WEB.md`** — dirección de la web. ⚠️ Anterior al cambio de
   comprador: donde hable del planner/salón como comprador principal, manda el doc 2.
5. Este archivo — el estado de hoy y las reglas para no romper nada.

Los archivos de agente (`CLAUDE.md`, `GEMINI.md`, `GLM.md`, `AGENTS.md`) son el mismo criterio
resumido por motor. Si uno contradice a los docs de arriba, **mandan los docs**.

---

## 2. Método (no negociable)

- **Un frente por vez.** Ante un pedido: **diagnóstico + propuesta en texto, SIN tocar código**;
  esperá el OK del dueño; recién ahí implementás.
- **Las migraciones no se aplican solas.** Se escriben como archivo en `supabase/migrations/`, se
  proponen, y **las aplica el dueño** pegándolas en el SQL Editor de Supabase. No hay CLI de
  Supabase enlazado en este proyecto.
- **Antes de aplicar una migración que borra policies**, guardar el estado actual:
  ```sql
  select tablename, policyname, cmd, qual, with_check
  from pg_policies where schemaname in ('public','storage')
  order by tablename, policyname;
  ```
  Una vez borradas, sus definiciones no se recuperan.
- **No reabrir decisiones cerradas** (§6) por conveniencia técnica ni porque aparezca una idea
  linda. Sólo con evidencia nueva o decisión explícita del owner.
- El owner es diseñador/director creativo, no programador: explicar consecuencias en castellano
  llano, hacer visibles los tradeoffs, no esconderlos detrás de jerga.

---

## 3. Reglas de oro (seguridad / integridad)

- **La propiedad del evento es la primitiva de autorización.** `events.owner_user_id`. Un evento
  **nunca** debe quedar sin dueño: sin owner sólo lo alcanza el staff de Alista.
- **`guests.payment_status` es la única fuente de verdad para la decisión de acceso.** Un `notes`
  corrupto con `"Pago: approved"` NO puede otorgar acceso si la columna dice `pending`. Está
  cubierto por tests fail-closed. `parseInvitationDetails(notes)` se usa SOLO para
  DNI/menú/acompañantes/observaciones.
- **El pago no va en RLS.** La habilitación es estado, no permiso. La dueña entra a sus datos
  siempre, haya pagado o no.
- **Nunca commitear secretos.** `.env.local` no va al repo.
- **El panel admin usa `service_role`** (`getSupabaseAdminClient`), que saltea RLS. El control
  real está en `ensureAuthorizedApiAccess` / `ensureAuthorizedEventApiAccess`. **RLS es defensa
  en profundidad, no el único candado** — si cambiás autorización, hay que cambiar los dos lados.
- **La puerta manda sobre la prolijidad.** Recepción/check-in tiene que seguir siendo rápida y
  resistente a conectividad mala. Nada de evaluaciones de policy anidadas por fila.
- **Después de tocar auth, RLS o pagos:** `npx tsc --noEmit` y `npm test` (285 tests hoy).

---

## 4. Trabajar con varios motores sin perder el hilo

- **Repartí por lo que está en juego, no por lo disponible:**
  - Delicado (auth, RLS, pagos, integridad del dato, la puerta) → **el motor más fuerte**.
  - Mecánico (boilerplate, renombres, andamiaje de tests, UI directa, docs) → motores gratuitos.
- **Un solo motor por frente.** Dos motores sobre los mismos archivos = conflictos y drift.
- Al cerrar un frente: actualizá la §6 de este archivo **en el mismo commit**.

---

## 5. Flujo de trabajo

### La única memoria durable es el repo
Los docs del repo son lo ÚNICO que cruza de un motor a otro y de una máquina a otra. La memoria
interna de cualquier motor es efímera y **no es un puente**.

### Mantener los docs frescos sin que sea carga
Se actualiza **al CERRAR un frente**, no mientras trabajás, y **en el MISMO commit**. Normalmente
sólo cambia la §6. Actualizar de más = churn y tokens.

### Mantener Estado ALISTA actualizado
`lib/alista-changelog.ts` es la fuente del listado visible en `/admin/estado`. Todo commit que
cambie producto, experiencia o estabilidad debe agregar en el mismo commit una entrada con hash,
fecha, área e impacto sintetizado. El texto visible se escribe para entender el cambio, no para
repetir el título técnico del commit. Los comentarios, tests y diagnósticos internos que no ve el
usuario permanecen en el código o en esta continuidad; no se copian al panel.

### Ahorrar tokens (en orden de impacto)
1. **Sesiones cortas, una por frente.** Cerrás → actualizás docs → **sesión nueva**. Palanca #1.
2. Traé la función puntual, no el archivo entero.
3. Filtrá volcados grandes con script; pedí sólo lo necesario.
4. Pedí respuestas cortas cuando alcanza.

---

## 6. Estado HOY

**Fecha de este estado:** 2026-09-05.
**Rama de trabajo:** `main`.

### Versión autorizada para Git y publicación (05/09/2026)

- Admin móvil aprobado e implementado en Invitados (<768 px): Hoy / Invitados /
  Invitaciones / Más, menú de cuenta plegado, búsqueda por titular/acompañante,
  respuestas y pagos separados, edición breve de contacto/mesa. Invitaciones:
  preparar mensaje → abrir WhatsApp personal → marcado manual con reintento;
  sin teléfono permite elegir contacto en WhatsApp. Contexto de ficha/grupo de
  envío se conserva en la pestaña; no persiste mensajes, teléfonos ni tokens.
  Importación, tipos y demás gestión avanzada siguen disponibles desde Más.
  Reutiliza hooks/APIs/permisos actuales. La vista con permisos restringidos de
  la hija queda fuera de esta etapa. Sin escrituras reales en QA.

- Aviso de cupo autorizado por el owner: amarillo con 3/2/1 lugares restantes,
  rojo al completar. Visible en puerta móvil y panel; consulta de actividad cada
  5 segundos sin bloquear escaneo, además del refresco tras una validación en
  el celular. El límite estricto y los grupos completos no cambian. Sin alertas
  operativas en el recibidor decorativo. Conteo desconocido no inventa lugares.

El owner aprobó el plan de personalización y acompañamiento y autorizó corregir
web y plataforma. El 05/09 autorizó subir todos los cambios y confirmó el uso del
material Dharma en la web. Se versiona esta entrega para publicación desde main.
No se modificaron datos de eventos reales. El protocolo específico y su PDF
permanecen locales porque contienen datos operativos privados; el repositorio
es público. La plantilla genérica y el presupuesto modelo sí se versionan.

- Web: servicio acompañado por presupuesto y autogestión ARS 89.000 separados;
  entregables visibles, madre/hija con envíos personales, profesionales como
  colaboradores, recepción de la organización y recibidor opcional. No cambia
  checkout, imágenes ni autorizaciones del caso Dharma.
- Reformulación editorial completa: inicio, producto, proceso, contratación,
  profesionales, caso, consulta, contacto, seguridad, privacidad y términos;
  también FAQ, navegación, demos y metadatos. `/precios` ahora es «Cómo contratar».
  Nueva `/autogestion`: única página comercial que muestra ARS 89.000, desde la
  misma fuente del checkout. Ejemplos ficticios separados del único evento real;
  preparación sin porcentajes inventados y recepción del grupo completo.
- Recepción: `lib/server-checkin.ts` unifica escaneo y acción manual de la tarjeta.
  Verifica la columna `payment_status`, grupo completo, PIN dentro de la petición
  de ingreso, y agenda en hora argentina. Pago y aforo no admiten excepción. La
  edición de datos no registra ingresos como efecto secundario.
- Migración **APLICADA POR EL OWNER Y VERIFICADA EN BASE (05/09/2026)**:
  `supabase/migrations/20260905162449_guard_guest_checkin_integrity.sql`.
  Agrega snapshot de personas admitidas y RPC guarded con locks por evento,
  mantiene reversión/activación y restringe escrituras directas del navegador en
  invitados, checkins y QR/tokens. SELECT y RLS disponibles. Verificación posterior:
  tres cuerpos de función idénticos al archivo local; permisos de tablas/columnas
  correctos; columna, constraint e índice válidos; 104 snapshots sin nulos/negativos.
  Data API reconoce RPC y deniega al rol público, probado con GET sin mutaciones.
- **No desplegar la API nueva antes de aplicar y verificar la migración.** No hay
  fallback al RPC sin controles. El archivo `docs/CHECKIN_INTEGRIDAD_MIGRACION.md`
  detalla contrato, auditoría aplicada, ensayo y orden de salida. Esquema y grants
  ya verificados. El owner confirma recepción con dos celulares probada y
  funcionando, y cobros de Alfonsina llegando a la cuenta de la madre. También
  confirma que repetir un QR en pruebas preliminares avisaba que el invitado ya
  estaba registrado como ingresado. No pedir
  repetir esos circuitos como si faltara evidencia. El ensayo técnico específico
  de contención por último cupo tras la migración no está documentado; distinguirlo
  del uso normal con dos celulares. No hay fallo observado. No se publicó la API.
- El conteo histórico al migrar es una estimación basada en grupos actuales.
  No acredita métricas comerciales. No se implementaron ingresos parciales de
  acompañantes, egresos ni modo offline.
- Validación local: 288 tests pasan en 29 archivos; 137 aserciones SQL sintéticas
  pasan en PGlite. Tras la reformulación, doce páginas y Open Graph responden 200;
  páginas verificadas a 390/1440 px sin errores de JS ni desbordes. Demos, formulario
  sin envío y enlaces pasan; precio sólo en autogestión. Header a 1024 px sin
  colisiones. `tsc`, lint y build pasan. La compilación se ejecutó fuera del
  sandbox tras detener la fase compile que no avanzaba dentro de éste.
  `vitest.config.ts` limita el descubrimiento al checkout para
  no ejecutar copias de tests de `.kilo`.
- Vista local: `http://127.0.0.1:3000`. Pendientes de publicación del material
  Dharma siguen regidos por `docs/DHARMA_CASE_PRIVACY.md`.

### Fechas claras al cruzar medianoche (05/09/2026)

- Pedido explícito del owner: Alfonsina comienza el 03/10 y continúa el 04/10;
  corregir formularios y representaciones de esa información.
- Crear/editar evento muestra «Fecha de inicio de la fiesta». `ClockInput`
  fuerza elección de horas 00-23 y minutos; identifica medianoche y mediodía.
- Cuatro formularios de tipos reutilizan `AccessWindowFields`: fechas reales,
  resumen del intervalo y advertencia si el cierre no es posterior. Persisten
  los offsets existentes; no agrega columnas ni requiere migración nueva.
- `lib/event-schedule.ts` concentra fechas e inferencia heredada; POST/PATCH de
  tipos validan orden, relojes y días. PATCH parcial se compara con lo guardado.
  Cambios de otros campos no quedan bloqueados por horarios antiguos inválidos.
- Resumen, listado, inicio, sidebar y recepción muestran fechas de accesos. No
  marcan la fiesta pasada al cambiar de día si aún hay accesos programados.
- Las dos plantillas de invitación, countdown y Agendar usan la fecha de ingreso
  del invitado. Calendario ya no inventa duración de cuatro horas. Cierre de
  ingreso no se presenta como fin de fiesta: no hay un campo global de fin.
- El panel ya no deduce «falta enviar» a partir de una respuesta pendiente.
- Verificado: 356 tests / 33 archivos, tsc, lint y build pasan. QA con fixtures,
  16 escenarios a 390/1440 px, sin errores ni desbordes y sin escrituras reales;
  fixtures retiradas. Lectura del resumen y edición reales de Alfonsina por UI
  autenticada confirma inicio03/10 y accesos04/10. Evidencia visual en
  `/private/tmp/alista-schedule-qa`.
- **No cambió ningún horario guardado, QR, pago ni invitación enviada.** La hora
  12:00 de los trasnoches sigue pendiente de confirmación/corrección por el owner.
  El código sigue local, sin publicación. Después de este frente el owner aplicó
  la migración previa y se verificó su instalación; ver sección anterior.

### Oferta y operación de Alfonsina (05/09/2026)

- Presupuesto reutilizable: `docs/comercial/PRESUPUESTO_MODELO_ACOMPANAMIENTO.md`
  y `output/pdf/alista-presupuesto-modelo.pdf`. Cantidades y condiciones son una
  base propuesta para futuras ventas, no cambios al contrato vigente.
- Protocolo y evidencia: `docs/operacion/PROTOCOLO_EVENTO_Y_EVIDENCIA.md`
  y `output/pdf/alista-protocolo-alfonsina.pdf`. Datos consultados en sólo lectura
  a las 14:10 Argentina; sin cambios de base, código ni publicación en este frente.
- El owner confirma todas las invitaciones del evento en preparación enviadas.
  Datos operativos, importes por invitado, conteos y ubicación: consultar el
  protocolo interno local o Alista con sesión autorizada, no este repositorio público.
- Pendientes: confirmar la ventana exacta del trasnoche y el referente/equipo.
  No cambiar horarios ni reenviar invitaciones a partir de una suposición.
- Conector Supabase no devolvió proyectos; lectura específica realizada con la
  conexión configurada del repo y después contrastada con el panel autenticado.

### En producción, funcionando
- Admin de eventos, invitados y tipos de acceso; carga masiva con plantilla.
- Invitaciones con QR único; check-in manual y por QR; vistas `admin`, `puerta` y `totem`.
- Autenticación operativa con Supabase Auth (email/contraseña y Google para clientas).
- Checkout Pro por cuenta receptora del evento: pago, conciliación y habilitación del QR.
- Activación automática del evento mediante cobro propio de Alista por $89.000 ARS.
- Propiedad transferible y sidebar contextual con selector de eventos.
- Envío por email y WhatsApp manual desde el teléfono propio.

### Cerrado en esta sesión (01/09/2026)
- **Editor de personalización de invitaciones reorganizado.** Plantilla, identidad, contenido y orden, interacción y publicación quedan separados. El orden de módulos se guarda en `event_branding.config`, la cuenta regresiva tiene un único control, se eliminó el copy duplicado de invitación especial y se agregó una marca textual configurable como alternativa al logo. Compatible con configuraciones existentes; sin migración SQL nueva.

### Cerrado en esta sesión (02/09/2026)
- **Ritmo vertical de la invitación ajustado.** Se amplió la separación entre módulos en los templates Viaje y Noche, manteniendo sin cambios el espacio interno de formularios y tarjetas.
- **Separación uniforme entre bloques.** La transición de Invitación especial a Fecha, hora y lugar ahora usa el mismo ritmo que los demás módulos mediante un gap común en el contenedor.

### Cerrado anteriormente (28/08/2026)
- **Migración `20260828120000_add_event_admin_assignments.sql` APLICADA.** Propiedad del evento
  como primitiva de autorización. Verificado contra la base: columna `owner_user_id` creada, los
  2 eventos existentes (DRM, Alfonsina) asignados al Superadmin, tabla
  `event_admin_assignments` creada, funciones `is_alista_staff()` y `can_manage_event()` vivas,
  y la cara pública (anon lee `events` y `event_branding`, no lee `guests`) intacta.
- `app/api/events/route.ts` graba `owner_user_id` al crear: no se pueden crear eventos huérfanos.
- `lib/operator-auth.ts`: el guard de tabla faltante ahora tolera `PGRST205` además de `42P01`
  (PostgREST corta antes de llegar a Postgres; el chequeo viejo nunca se activaba y volteaba
  todo `/admin` con un runtime error).
- **Frente 1 CERRADO — "cliente" es una identidad válida.**
  - `lib/event-access.ts` (nuevo): la decisión de acceso, pura y sin red. **Espeja
    `can_manage_event()` de la base.** Si tocás una, tocá la otra: el panel usa `service_role`
    y saltea RLS, así que si divergen el candado real deja de ser el que creemos.
  - `lib/operator-auth.ts`: `getCurrentAuthState()` ahora resuelve una **cuenta** —
    `operatorProfile` en `null` significa cliente— y calcula `manageableEventIds`
    (propios ∪ asignados). `ensureAuthorizedEventApiAccess` y
    `requireAuthorizedEventPageAccess` **autorizan por acceso al evento, no por rol**.
    Nuevo `ensureAuthenticatedApiAccess()` para listar/crear eventos propios.
  - `app/api/events/route.ts`: el `GET` filtra por `manageableEventIds`; el `POST` ya no exige
    rol `admin` (quien crea queda como dueño).
  - `components/admin/AdminAccessContext.tsx`: tolera perfil nulo (antes tiraba excepción).
  - `lib/event-access.test.ts`: 16 tests sobre los 5 criterios de aceptación. Total 301.
  - Verificado: `tsc` limpio, `eslint` sin warnings, `npm run build` OK.

- **Frentes 1b y 2 CERRADOS — registro con Google y panel para clientes.**
  - `app/acceso/callback/route.ts` (nuevo): intercambio del código en el servidor. Funciona
    porque `lib/supabase.ts` usa `createBrowserClient` de `@supabase/ssr`, que guarda el
    verificador PKCE **en cookie** y no en localStorage. Si algún día se cambia ese cliente,
    esto se rompe en silencio.
  - `components/auth/AccessLoginForm.tsx`: botón "Continuar con Google".
  - `app/admin/layout.tsx`: usa `requireAuthenticatedPageAccess`. El panel ya no pide rol.
  - `app/admin/page.tsx`: filtra por `manageableEventIds`; el staff sigue viendo todo.
  - `app/admin/events/new/layout.tsx`: sin `GlobalAdminGuard` — crear evento es de cualquiera.
  - Los botones "Crear evento" dejaron de estar detrás de `isGlobalAdmin`.
  - El menú lateral **no necesitó cambios**: ya ocultaba `Configuración` y `Estado ALISTA` a
    quien no es admin global, así que una clienta ve exactamente `Inicio` + `Eventos`.

> ✅ **Google configurado y verificado en producción.** El acceso con Google usa el callback
> `/acceso/callback` y mantiene el verificador PKCE en cookie.

- **Frente del muro CERRADO — el evento nace sin activar y el pago lo activa.**
  - **No existe un "evento demo" aparte.** Es *su* evento, sin activar. Es la decisión B
    llevada hasta el final, y por eso los tres frentes que quedaban eran uno solo.
  - `supabase/migrations/20260828160000_add_event_activations.sql` (**pendiente de aplicar**):
    una fila por evento. **Incluye backfill**: los eventos que ya existen quedan activados,
    porque si no el muro cortaría invitaciones en fiestas que están operando.
  - `lib/event-activation.ts` + 13 tests: decisión pura (nunca activado / cortesía / manual /
    dado de baja / vencido). Una fecha ilegible se trata como vencida: no habilita por error.
  - **El muro está en un solo lugar:** `app/api/guest-access/issue/route.ts`, que es el único
    punto de todo el código que inserta en `invitation_tokens`. Responde **402** con un mensaje
    que encuadra como *"activá tu evento"*, no *"pagá para enviar"*.
  - `app/api/events/[id]/activation/route.ts` + `components/admin/EventActivationCard.tsx`:
    el staff otorga la activación a mano (`manual` o `cortesia`) o la da de baja.
  - `app/admin/page.tsx`: primer ingreso de una clienta sin eventos → `/admin/events/new`.

> ⚠️ `events.status` ('draft'/'active'/…) es **operativo** y gobierna la visibilidad pública de
> la invitación. La activación es **comercial**. No mezclarlas: es el booleano en `events` que
> se descartó a propósito.

- **El muro no se muestra como error.** El 402 vuelve por su propio canal desde
  `lib/hooks.ts` y tiene cartel propio (ámbar) en `EventGuestsManager`, con dos salidas:
  *Quiero activar mi evento* y *Seguir cargando invitados*. El botón abre un mail a
  `hola@alista.com.ar` con el evento precargado (`buildActivationRequestHref`) — **una
  conversación, no un checkout**: es así como se valida el precio que sigue sin cerrar.
  **No hay otros puntos que cubrir** (se verificó): `/api/guest-access/issue` es el único
  que emite, `issueGuestAccess` su único llamador. El envío por WhatsApp necesita un token
  que ya exista, y las acciones masivas (estado, tipo, importación) no emiten.
- **La tarjeta de activación le da salida a la clienta.** Sin activar y sin ser staff,
  muestra *Quiero activar mi evento* con el mismo link. Así lo ve en la ficha del evento y
  no recién al chocar contra el muro después de cargar 200 invitados.

- **Frente cerrado — transferencia de propiedad desde el panel Superadmin.**
  `components/admin/EventOwnershipCard.tsx` agrega la tarjeta en el detalle del evento y
  `app/api/events/[id]/transfer/route.ts` valida en servidor que el email exista en Supabase
  Auth antes de cambiar `events.owner_user_id`. La acción sólo está disponible para el rol
  `admin`, confirma evento y destinatario, y no modifica `created_by_user_id`, invitados,
  colaboradores ni la cuenta de Mercado Pago. La tarjeta se muestra arriba de las páginas
  públicas, usa “cuenta responsable” como lenguaje visible y deja claro que la transferencia es
  inmediata y no requiere aceptación. La vinculación de Mercado
  Pago vive dentro de la misma tarjeta, con su estado y acciones según permisos. No requiere
  migración. Tests: 327; `tsc`, lint y build OK.

- **Frente cerrado — sidebar contextual por evento.** `components/admin/AdminEventSidebar.tsx`
  agrega selector de eventos, estado comercial (`Sin activar` / `Activado`) y accesos directos
  a Resumen, Invitación, Invitados, Tótem, Check-in y Puerta. La barra conserva Inicio, Mis
  eventos y Nuevo evento como navegación global, y mantiene la cuenta logueada abajo. No se
  agregó una sección de “Tickets”: el producto opera con invitaciones, invitados y accesos QR.
  La lista se alimenta de los eventos que ya autoriza `/api/events`; no requiere migración. El
  refinamiento visual posterior dejó un único scroll para toda la navegación, redujo el aire entre
  links y reemplazó los marcos de los botones por una barra lateral celeste para identificar el
  activo. La scrollbar queda integrada al fondo navy y la cuenta y el cierre de sesión quedan en
  un footer compacto con menú de tres puntos.

- **Frente cerrado — Estado ALISTA.** `/admin/estado` dejó de funcionar como tablero de MVP y
  ahora presenta un log cronológico de cambios sintetizados desde Git, con fecha, área, tipo,
  hash e impacto. Las decisiones abiertas quedan en una lista breve y separada. La fuente es
  `lib/alista-changelog.ts`, que debe actualizarse junto con cada cambio funcional.

### ✅ Circuito verificado de punta a punta (28/08/2026, en local contra la base real)
Registro con Google (`hugojaviermanso@gmail.com`, sin perfil de operador) → panel → creó
"XV Peteca" y quedó como dueña → cargó un invitado → intentó emitir y **el muro cortó**
(`tokens: 0`) → el staff activó desde la tarjeta → **emitió** (`tokens: 1`).
La fila de activación guardó `granted_by_user_id` y `activated_at`: el rastro funciona.
Los eventos reales (DRM 287 tokens, Alfonsina 2) no se vieron afectados, gracias al backfill.

> 🧹 **XV Peteca es un evento de prueba en la base de producción.** Borrarlo cuando ya no
> haga falta (arrastra en cascada su invitado, token y activación).

### Registro de cambios cerrado (01/09/2026)

- **Regalo por tipo de invitado.** `guest_types.show_gift_info` permite decidir por tipo si la
  invitacion muestra el bloque de regalo/alias/CBU. El checkbox aparece debajo del importe cuando
  es mayor que cero, queda activado por defecto y se conserva al duplicar eventos. La migracion
  `20260901090000_add_guest_type_gift_visibility.sql` fue aplicada en Supabase; los tipos
  existentes conservan el comportamiento anterior.

### Registro de cambios cerrado (01/09/2026)

- **Leyenda editorial por tipo de acceso.** `guest_types.invitation_message` permite escribir una
  frase contextual propia para cada tipo (por ejemplo, el trasnoche). Se muestra una sola vez en
  la invitación pública y no se mezcla con la etiqueta operativa del horario. La migración
  `20260901120000_add_guest_type_invitation_message.sql` fue aplicada en Supabase.

### Registro de cambios cerrado (01/09/2026)

- **Franja superior de acceso.** La leyenda editorial del tipo de acceso ahora aparece antes del
  resto de la invitación en una banda de ancho completo, sin repetirse debajo del nombre. La
  aclaración queda visible tanto para accesos normales como pagos.

### Frentes abiertos, en orden de dependencia
1. **Cobro de los $89.000 a Alista.** **CERRADO (29/08/2026).** La migración
   `20260829010000_add_event_activation_payments.sql` fue aplicada en Supabase y el flujo está
   desplegado en producción. Usa la cuenta propia de Alista, concilia por referencia/importe/
   moneda y solo entonces escribe `event_activations` con `source: 'payment'`.
2. **Política de retención del evento sin activar.** Con Google abierto entran datos reales
   —teléfonos de menores— de cuentas que quizá nunca paguen. Ver decisiones §5.
3. **Revisar qué ve una clienta en `/admin`.** El panel funciona, pero su copy y jerarquía
   fueron escritos para el equipo operativo, no para una madre organizando su fiesta.
4. **Consumir la activación con el check-in.** Decidido el 29/08/2026, todavía sin
   implementar: hoy una activación habilita para siempre y todo lo que identifica la
   fiesta es editable, así que se puede reutilizar el evento para una segunda fiesta sin
   pagar. Falta `event_activations.consumed_at` escrito por `register_guest_checkin`, la
   lectura en `resolveActivation()` y la oferta de duplicar en vez de bloquear. Ver
   decisiones §4 bis.
5. **Revisión editorial del panel para clientas.** El panel funciona, pero todavía hay que
   detectar y simplificar copy escrito para el equipo operativo cuando no aporta valor a una
   madre organizando su fiesta.

### Hilos sueltos anotados
- **Fiesta sin puerta:** si nadie escanea nada no hay check-ins y la activación nunca se
  consume. Propuesta anotada (fecha vencida hace +30 días, con salida por soporte), sin decidir.
- **Retención de datos del demo:** cargar invitados sin pagar guarda datos reales de menores.
  Necesita política explícita (ver `ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` §5).
- **Operadores de puerta y Realtime:** desde la migración, un rol `door` que no esté en
  `event_admin_assignments` deja de recibir eventos Realtime en modo tótem. Hoy no afecta (el
  único perfil es `admin`), pero hay que asignarlos antes de un evento real con recepción propia.
- **`docs/ALISTA_ESTRATEGIA_NUEVA_WEB.md`** está escrito para un comprador B2B2C
  (planner/salón). Hay que revisarlo contra la decisión de comprador antes de rehacer la web.

### Decisiones cerradas (NO reabrir como pendientes)
- **Comprador y dueño = la responsable del evento (la madre).** El planner es colaborador
  invitado, no dueño ni comprador. Motivo: MP trata el cobro como pago por servicio, retiene
  ~30 días y convierte al colector en vendedor a efectos fiscales.
- **Sin capa de organización.** Precio por evento, cuenta personal.
- **El demo y el evento real son la misma fila.** El pago cambia el estado.
- **El pago desbloquea los links de invitación, no "el envío".** Alista no envía: la invitación
  sale del WhatsApp personal. Lo bloqueable es la emisión/activación de `invitation_tokens`.
- **El pago no va en RLS.** Es estado, no permiso.
- **Soporte de Alista: acceso total, permanente y sin registro.** Deliberado. `is_alista_staff()`
  es el único lugar a tocar si algún día se acota.
- **MP sólo en eventos con entrada paga.** Una fiesta privada nunca toca MP.
- **Un evento es una fiesta que ocurrió, y el check-in es la marca** (29/08/2026). Postergar
  es gratis mientras no haya ingresos; con el primer check-in la activación queda consumida y
  la próxima fiesta es un evento nuevo. Decidido, pendiente de implementar. Ver §4 bis.
- Todo el detalle y el porqué: `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md`.

---

## 7. Datos de entorno (hechos, no secretos)

- **Supabase** (base + auth + storage), proyecto ref `ntpybhadcpaendjtkhib`.
  **No hay CLI enlazado**: no existe `supabase/config.toml`. Las migraciones se aplican a mano
  en el SQL Editor. El repo guarda el archivo; la base es la que manda.
- **Hosting:** Vercel. **Mercado Pago** para cobro de entradas (OAuth por evento).
  **Resend** (email) y **Twilio** (WhatsApp) para envíos.
- **Stack:** Next.js 16.3.2 (Turbopack) · React 19 · TypeScript estricto · Tailwind v4 · Vitest.
- **Comandos:** dev `npm run dev` · build `npm run build` · tests `npm test` ·
  typecheck `npx tsc --noEmit` · lint `npm run lint`.
- **Bloque de Next.js en `CLAUDE.md`:** lo reescribe `next dev` automáticamente. Si aparece como
  cambio sin commitear, no lo borres — commitealo junto con tu trabajo.

---

## 8. Trabajar desde otra máquina

**La idea:** git es el puente. La nube no se sincroniza, se accede.

### Rutina de CIERRE — cada vez que parás, aunque sea a mitad
```
git add -A && git commit -m "wip: en que estaba" && git push
```
Si cerraste un frente, actualizá la §6 en el mismo commit.

### Rutina de ARRANQUE en la otra compu
```
git pull && npm install
```
Y `git status` para confirmar que no quedó nada colgado.

### 📍 Al retomar (estado al 2026-08-28, cambio de máquina)

El código de registro con Google, propiedad de evento, muro de activación y transferencia desde
el panel Superadmin ya está desplegado en producción. El deployment publicado quedó `Ready` y
aliased a `https://www.alista.com.ar` y `https://alista.com.ar`.

Ya está hecho y no hay que rehacerlo:
- Las dos migraciones **están aplicadas** en Supabase (propiedad + activaciones).
- Google habilitado como proveedor, y las Redirect URLs cargadas con `http://localhost:3000/**`
  y `https://www.alista.com.ar/**`.

Falta, y no viaja por git:
- **`.env.local`** → copiarlo de `.env.example` y completarlo desde los paneles.
  `NEXT_PUBLIC_APP_URL` va con **`https://www.alista.com.ar`** (con `www`: el apex redirige 308).
- `NEXT_PUBLIC_APP_URL` **ya fue actualizado en Vercel** y el deployment de producción fue
  verificado con respuesta HTTP 200 en el dominio público.
- Las cuatro variables de producción para vinculación OAuth de Mercado Pago también están
  cargadas en Vercel: `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET`,
  `MERCADOPAGO_OAUTH_REDIRECT_URI` y `ALISTA_PAYMENT_CREDENTIALS_ENCRYPTION_KEY`.

Al probar el login con Google en producción, si termina en la home pública, revisar primero las
Redirect URLs de Supabase: la callback debe aceptar el host y la query `?next=...`.

### Reponer una vez por máquina (NO está en git, a propósito)
- **Dependencias** → `npm install`.
- **`.env.local`** → copiar de `.env.example` y completar desde el panel de Supabase, Vercel,
  Mercado Pago, Resend y Twilio.
- **Auth de git / `gh`** → con la cuenta del owner.

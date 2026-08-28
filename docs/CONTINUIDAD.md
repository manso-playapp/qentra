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

### Ahorrar tokens (en orden de impacto)
1. **Sesiones cortas, una por frente.** Cerrás → actualizás docs → **sesión nueva**. Palanca #1.
2. Traé la función puntual, no el archivo entero.
3. Filtrá volcados grandes con script; pedí sólo lo necesario.
4. Pedí respuestas cortas cuando alcanza.

---

## 6. Estado HOY

**Fecha de este estado:** 2026-08-28.
**Rama de trabajo:** `main`.

### En producción, funcionando
- Admin de eventos, invitados y tipos de acceso; carga masiva con plantilla.
- Invitaciones con QR único; check-in manual y por QR; vistas `admin`, `puerta` y `totem`.
- Autenticación operativa con Supabase Auth (email/contraseña, cuentas creadas por admin).
- Checkout Pro por cuenta receptora del evento: pago, conciliación y habilitación del QR.
- Envío por email y WhatsApp manual desde el teléfono propio.

### Cerrado en esta sesión (28/08/2026)
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
  - El menú lateral **no necesitó cambios**: ya ocultaba `Configuración` y `Estado del MVP` a
    quien no es admin global, así que una clienta ve exactamente `Inicio` + `Eventos`.

> ⚠️ **BLOQUEANTE — falta configurar Google en el panel de Supabase.** El código está listo,
> pero el botón no va a funcionar hasta que estén: el proveedor Google habilitado, el Client
> ID/Secret desde Google Cloud Console, y las Redirect URLs con `/acceso/callback` (local y
> producción). Detalle en la respuesta del 28/08 o en la doc de Supabase.

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
  colaboradores ni la cuenta de Mercado Pago. No requiere migración. Tests: 327; `tsc`, lint y
  build OK.

### ✅ Circuito verificado de punta a punta (28/08/2026, en local contra la base real)
Registro con Google (`hugojaviermanso@gmail.com`, sin perfil de operador) → panel → creó
"XV Peteca" y quedó como dueña → cargó un invitado → intentó emitir y **el muro cortó**
(`tokens: 0`) → el staff activó desde la tarjeta → **emitió** (`tokens: 1`).
La fila de activación guardó `granted_by_user_id` y `activated_at`: el rastro funciona.
Los eventos reales (DRM 287 tokens, Alfonsina 2) no se vieron afectados, gracias al backfill.

> 🧹 **XV Peteca es un evento de prueba en la base de producción.** Borrarlo cuando ya no
> haga falta (arrastra en cascada su invitado, token y activación).

### Frentes abiertos, en orden de dependencia
1. **Cobro de los $89.000 a Alista.** Deliberadamente postergado: el precio de lanzamiento
   sigue sin validar (§42 del canónico), y el muro ya funciona con activación manual. Cuando
   se automatice, el webhook escribe la misma fila con `source: 'payment'`.
2. **Política de retención del evento sin activar.** Con Google abierto entran datos reales
   —teléfonos de menores— de cuentas que quizá nunca paguen. Ver decisiones §5.
3. **Revisar qué ve una clienta en `/admin`.** El panel funciona, pero su copy y jerarquía
   fueron escritos para el equipo operativo, no para una madre organizando su fiesta.

### Hilos sueltos anotados
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

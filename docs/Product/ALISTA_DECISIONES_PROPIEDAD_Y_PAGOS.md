# ALISTA — PROPIEDAD DEL EVENTO, COMPRADOR Y PAGOS

**Fecha:** 28 de agosto de 2026
**Estado:** DECISIONES CERRADAS. No reabrir sin evidencia nueva o decisión explícita del owner.
**Complementa:** `ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md` (sigue siendo el canónico de producto).

---

## 0. Por qué existe este documento

`ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md` dejó abierto en su §42 el modelo comercial
y el onboarding de Mercado Pago. Este archivo cierra esa parte y, al hacerlo,
**corrige la jerarquía de comprador** que estaba escrita en los archivos de agente
(`CLAUDE.md`, `GEMINI.md`, `GLM.md`) y en el `README.md`.

Donde este documento contradiga a los anteriores en materia de **propiedad, comprador
o pagos**, manda este.

---

## 1. Comprador y dueño: la responsable del evento

### Modalidad acompañada aprobada el 05/09/2026

El owner aprobó priorizar comercialmente personalización y acompañamiento para
fiestas de 15 con trasnoche, acompañantes y pagos. Convive con la plataforma
autogestiva por evento; no cambia propiedad, permisos ni cuenta receptora.

- La familia contrata un alcance escrito de diseño, configuración, seguimiento,
  capacitación y soporte en horarios acordados. La activación se incluye en el
  servicio acompañado y no se factura dos veces.
- La referencia cercana a USD 1.000 es una hipótesis comercial para validar con
  nuevas contrataciones y costos; no reemplaza automáticamente el precio de
  activación autogestiva ni constituye una tarifa pública cerrada.
- Personal de recepción y referente operativo provistos por la organización.
  Equipos y recibidor digital pueden cotizarse aparte con terceros. Alista
  prepara y acompaña; no incorpora personal propio de recepción.
- El celular confirma el ingreso. El recibidor es una bienvenida opcional
  posterior al control y no debe condicionar el paso a una animación.
- Desarrollo de funciones nuevas no forma parte automática de personalización.
  Se acuerdan entregas y revisiones antes de contratar.
- La web presenta el servicio acompañado como oferta principal. `/precios`
  conserva su URL y se presenta como «Cómo contratar», con presupuesto por fiesta.
  La autogestión se explica en `/autogestion`, alternativa secundaria con ARS
  89.000 visibles antes de crear la cuenta. El checkout conserva su importe;
  esa tarifa no representa el servicio personalizado.

Evidencia: relato del owner sobre un primer evento Dharma exitoso y una próxima
contratación cercana a USD 1.000. No se asume demanda regional validada ni margen
demostrado. Plan comercial de 90 días aprobado en la conversación del 05/09/2026.

### DECISIÓN CERRADA

El producto es **personal y autogestivo**. La dueña de la cuenta y del evento es la
**responsable de la fiesta** (típicamente la madre), no el planner ni el salón.

El planner sigue existiendo y sigue siendo importante — **pero como colaborador
invitado al evento, no como dueño ni como comprador de la cuenta.**

### Por qué (el argumento decisivo es Mercado Pago)

Mercado Pago trata el cobro de entradas como **pago por servicio**, no como
transferencia entre personas. Consecuencias reales observadas:

- retiene el dinero cerca de **30 días**;
- lo libera de forma **escalonada y en momentos poco predecibles**.

Quien conecta la cuenta de MP no es sólo quien recibe la plata: **es el vendedor de
las entradas a efectos fiscales.** Si ese fuera el planner, en un año con varios
quinces estaría:

- recibiendo en su cuenta ingresos que no son suyos, con hecho imponible propio;
- consumiendo límites de monotributo y disparando retenciones e ingresos brutos
  sobre plata ajena;
- prestándole plata a la familia, o explicándole por qué no aparece;
- absorbiendo el riesgo de contracargos de invitados que ni conoce.

Eso es intermediación financiera. La §20 del documento canónico dice que Alista no
debe hacerlo — **y tampoco tiene sentido empujárselo al planner.**

La variante inversa (la madre cargando sus datos de MP en la cuenta del planner) no
existe como opción: el OAuth de MP autentica al titular contra MP. O la cuenta es de
una, o es del otro.

### Consecuencia sobre la jerarquía de audiencia

La sección *"Primary commercial buyer: planners, event producers, venues, agencies"*
de los archivos de agente **queda corregida**:

| Rol | Qué es ahora |
|---|---|
| **Compradora / dueña** | la responsable del evento (familia) |
| **Colaborador** | planner, salón, productora — invitados por la dueña |
| **Operativo** | recepción, puerta, equipo — invitados por la dueña |
| **Héroe narrativo** | la quinceañera / la familia |
| **Beneficiario final** | el invitado |

Esto **no** borra al planner de la comunicación ni de la web: sigue siendo un canal
de adquisición legítimo. Lo que cambia es **quién abre la cuenta, quién es dueño de
los datos y quién paga.**

---

## 2. Sin capa de organización

### DECISIÓN CERRADA

No se construye una capa `organizations` / `accounts` por encima de los eventos.
Precio **por evento**, cuenta personal.

### Por qué

La capa de organización sirve para dos cosas: facturarle a un planner como unidad, y
que un planner posea activos como unidad. La primera queda descartada por la §1.

Y para lo operativo **no hace falta**: `event_admin_assignments` ya es una relación
muchos-a-muchos. Un planner con 6 quinces son 6 filas de asignación, y ve sus 6
eventos al entrar. La reutilización de plantillas se resuelve más simple como "mis
plantillas" por usuario.

### El seguro que sí se tomó

Para que agregar packs más adelante no sea una migración cara, la habilitación de un
evento **no se modela como un booleano en `events`**, sino como una fila propia
(`event_activations`, ver §4). Si algún día hay un pack, es una compra que produce N
filas de activación y la tabla `events` no se toca.

---

## 3. Propiedad del evento como primitiva de autorización

### DECISIÓN CERRADA — YA IMPLEMENTADA

Migración `supabase/migrations/20260828120000_add_event_admin_assignments.sql`,
**aplicada el 28/08/2026**.

Tres vínculos distintos, que antes estaban colapsados en uno solo:

| Vínculo | Quién | Cómo se obtiene |
|---|---|---|
| **Dueño** | la responsable | `events.owner_user_id` — creó el evento, o se lo transfirieron |
| **Equipo** | recepción, puerta, planner | `event_admin_assignments` — **el dueño lo invita** |
| **Soporte** | equipo interno de Alista | `is_alista_staff()` |

Reglas:

- **La propiedad es transferible.** El planner puede crear y configurar, y después
  entregarle la propiedad a la responsable. Es un momento obligatorio del recorrido,
  no un caso borde: sólo la dueña puede conectar Mercado Pago.
- **Crear un evento está abierto** a cualquier usuario autenticado que se ponga a sí
  mismo como dueño. Esa policy es lo único que habilita el self-serve.
- **`event_admin_assignments` apunta a `auth.users`, no a `operator_profiles`.** Un
  colaborador invitado por la dueña no tiene por qué ser operador de Alista.
- **Borrar el evento es sólo del dueño.** Un colaborador no puede borrar la fiesta de
  otra persona.
- Un evento **nunca** debe quedar sin dueño: sin `owner_user_id` sólo lo alcanza el
  staff de Alista.

### Soporte de Alista: acceso total y silencioso

**DECISIÓN CERRADA.** `is_alista_staff()` da acceso total, permanente y sin registro
a todos los eventos. **Es deliberado, no un descuido** — el soporte tiene que poder
entrar a resolver un problema la noche anterior a la fiesta.

Si alguna vez hace falta acotarlo (registro de accesos, o sesiones de soporte con
vencimiento visibles para el dueño), **esa función es el único lugar a tocar.**

### Nota técnica: `SECURITY DEFINER`

`is_alista_staff()` y `can_manage_event()` son `SECURITY DEFINER` a propósito.
`can_manage_event()` lee `public.events` para resolver la propiedad; con
`SECURITY INVOKER`, evaluar la policy de `events` llamaría a una función que vuelve a
consultar `events` → **recursión infinita**. `DEFINER` corta el ciclo y evita una
evaluación de policy anidada por fila, que es justo lo que no se puede pagar en la
puerta.

Es seguro: ambas resuelven siempre contra `auth.uid()` y devuelven un booleano sobre
el acceso de quien llama. No sirven para inspeccionar permisos ajenos.

Las policies de `events` **no** llaman a `can_manage_event()`: sobre la propia fila
`owner_user_id` ya está disponible, y evitarlo mantiene el grafo de policies sin ciclos.

---

## 4. El muro de pago

### DECISIÓN CERRADA — el pago desbloquea los links, no "el envío"

**No se puede bloquear el envío**, y es importante entender por qué: la §12 del
documento canónico establece que la invitación sale del **WhatsApp personal** de la
quinceañera. Alista prepara el texto y el link, y abre WhatsApp. **Alista no envía
nada** — el envío ocurre afuera. Si el link ya está generado, se puede copiar y
mandar por cualquier lado.

Lo que **sí** es bloqueable y además honesto es la **emisión/activación de los
`invitation_tokens`**. Sin activación, los tokens no se emiten (o se emiten
inactivos), y quien abra un link ve *"esta invitación todavía no está activa"*.

Esto cambia el copy: no es *"pagá para enviar"*, es más cerca de **"activá tu
evento"**.

### El pago NO va en RLS

**DECISIÓN CERRADA.** La habilitación se modela como estado, no como permiso.

- RLS responde *"¿quién puede tocar esta fila?"*.
- El pago responde *"¿en qué estado está este evento?"*.

Si se mezclan: cada prueba de precio se vuelve una migración, y un bug de facturación
deja a una familia sin acceso a su propia lista de invitados dos días antes de la
fiesta.

**La dueña entra y edita siempre, haya pagado o no.** Lo que se bloquea es una
acción, nunca el acceso a los datos propios.

### Forma: `event_activations`

Fila propia, no booleano en `events`:

```
event_activations
  event_id, status, source, activated_at,
  payer_user_id, amount_cents, mp_payment_id
```

Tres razones:
1. da el rastro de quién pagó qué y cuándo;
2. **las cortesías entran por la misma puerta** (`source: 'cortesia'`), cumpliendo la
   §22 del canónico —"sin inventar un pago de $0"—;
3. si aparecen packs, son N filas de activación sin tocar `events`.

---

## 4 bis. Qué cuenta como un evento: la activación se consume

### DECISIÓN — 29/08/2026

**Un evento es una fiesta que ocurrió, y el check-in es la marca.**

Hasta hoy la activación era permanente (`expires_at` en `null` en las tres filas
existentes) y todo lo que identifica *qué fiesta es* —nombre, fecha, salón, lista de
invitados— es editable desde el panel. La consecuencia: después de la fiesta se puede
cambiar la fecha, borrar la lista, cargar otra, re-emitir los links y correr una
segunda fiesta sin volver a pagar. Los tokens nuevos se emiten con vencimiento
calculado sobre la fecha nueva, así que ni siquiera hace falta forzar nada.

Lo grave no es que sea posible: es que **no se siente como una trampa**. El panel dice
"este es tu evento, editalo", y eso es exactamente lo que la responsable hace.

Las reglas:

1. **Mientras no haya ningún check-in registrado, mover la fecha es libre y gratis.**
   Eso es postergar, y una fiesta de 15 se posterga por lluvia, por una internación o
   por lo que sea. Cobrar de nuevo ahí sería abusivo, y es el peor momento posible
   para pedirle plata a esa familia.
2. **Con al menos un ingreso registrado, la activación queda consumida.** La fiesta
   ocurrió; esa activación ya hizo su trabajo.
3. **Consumida, la activación deja de habilitar la emisión de nuevos
   `invitation_tokens`**, igual que un evento nunca activado. No se bloquea editar
   nada: sigue siendo estado, no permiso (§4). La dueña llega a todos sus datos, ve
   su fiesta anterior entera y puede corregir lo que quiera.
4. **En ese momento el panel ofrece duplicar, no bloquear**: diseño, tipos de invitado
   y textos se copian a un evento nuevo sin activar. La familia que organiza los 15 de
   la segunda hija es el mejor cliente recurrente que Alista puede tener; hoy el
   producto la empuja a pisar el recuerdo de la primera.

### Por qué el check-in y no la fecha

La fecha sola no distingue postergar de reutilizar, y las dos cosas se parecen
demasiado como para arriesgarse a cobrarle a quien postergó. El check-in sí:

- **no se puede falsear hacia atrás** —es un hecho registrado en la puerta—;
- **una fiesta postergada nunca tuvo ingresos**, por definición;
- y es la única prueba que Alista tiene de que la fiesta efectivamente sucedió.

### Forma técnica propuesta (todavía NO implementada)

`event_activations.consumed_at`, escrito por la misma transacción que registra el
primer check-in (`register_guest_checkin`). `resolveActivation()` pasa a devolver
`{ activated: false, reason: 'consumed' }` cuando hay `consumed_at` y la fecha del
evento cambió después de esa marca.

### Caso borde sin resolver

**Una fiesta que ocurrió sin usar la puerta.** Si nadie escaneó nada, no hay check-ins
y la activación nunca se consume. Opción propuesta: considerar la fiesta ocurrida
cuando la fecha pasó hace más de 30 días, con salida por soporte para el caso legítimo.
Queda anotado, no decidido.

### El disuasivo real no es técnico

Si Alista conserva la fiesta anterior viva y útil —quiénes vinieron, cómo llegaron, las
fotos— borrarla para ahorrarse una activación deja de ser gratis emocionalmente. Esa
reja la construye el producto, no una validación.

---

## 5. El evento demo

### DECISIÓN CERRADA

El evento demo y el evento real son **la misma fila**. El pago le cambia el estado.

### Por qué

El motor de conversión es el esfuerzo ya invertido: configuró, cargó invitados,
personalizó. Un sandbox que se descarta destruye exactamente lo que hace que pague.

### Contrapartida pendiente de resolver

Cargar invitados sin límite y sin pagar significa guardar datos personales reales
—incluidos teléfonos de menores— de alguien que quizá nunca pague. Con el criterio ya
establecido en `docs/DHARMA_CASE_PRIVACY.md` sobre minimización y menores, **esto
necesita una política de retención explícita.** No debe quedar por omisión.

---

## 6. Mercado Pago: consecuencias operativas

### 6.1 La retención choca con la fecha de la fiesta

Si las entradas se venden 3 semanas antes y el dinero se libera escalonadamente a los
~30 días, **la familia no dispone de esa plata hasta después del evento** — justo
cuando muchas veces la esperaba para pagar la fiesta.

Alista debe decirlo de frente al conectar la cuenta:

> Mercado Pago libera este dinero de forma escalonada, en general hasta ~30 días
> después de cada pago. **No cuentes con esta plata para pagar la fiesta.**

**Cuidado:** los plazos varían por cuenta y perfil. Antes de mostrar una fecha
concreta hay que verificar si la API de MP expone el período de liberación de esa
cuenta. Si no lo expone, va una advertencia honesta y genérica — **nunca un número
inventado.**

Esto es coherente con la §24 (Centro de Preparación) y con el principio de
anticipación sobre emergencia.

### 6.2 MP sólo aparece en eventos con entrada paga

El esquema ya lo soporta: `guests.payment_status` arranca en `'not_required'` y el
precio vive en `guest_types.payment_amount_cents`. **Una fiesta privada no toca MP en
ningún momento.**

Que quede así. Si la mayoría de los 15 son fiestas privadas, obligar a conectar MP en
el onboarding sería una fricción enorme y sin beneficiario.

### 6.3 La cuenta de cobro es del evento, no del usuario

`event_payment_accounts` está indexada por `event_id`. La cuenta de cobro pertenece a
*la fiesta*, no a la cuenta que la conectó. Esto es correcto y hace que transferir la
propiedad no rompa el cobro.

### 6.4 Alternativa evaluada y NO adoptada

Se evaluó ofrecer **transferencia directa** (alias/CVU) como segundo riel: instantáneo
y sin retención, a cambio de conciliación manual ("marcar como pagado", con el mismo
patrón honesto de la §14). **No se adoptó** — queda registrada como opción si la
retención se vuelve una objeción real de ventas.

---

## 7. Qué falta para llegar al destino

Recorrido objetivo: **registro con Google → evento demo propio → configuración y
carga de invitados → muro de activación → links activos.**

En orden de dependencia:

1. ~~**"Cliente" como identidad válida.**~~ **HECHO (28/08/2026).** "Autenticado sin perfil de
   operador" es un cliente válido, y lo autoriza **la propiedad**, no un rol.
   `operator_profiles` queda siendo lo que su nombre dice: el equipo de Alista.
   La decisión de acceso vive en `lib/event-access.ts`, que **espeja
   `can_manage_event()`** de la base. Si tocás una, tocá la otra.
2. **El panel `/admin` para clientes.** `app/admin/layout.tsx` sigue exigiendo rol y su UI
   asume operador. Una clienta está autorizada en el núcleo pero todavía no tiene panel.
3. **Registro con Google.** Hoy sólo hay email/contraseña con cuentas creadas por un
   admin (`auth.admin.createUser`). No existe puerta de entrada.
4. **Evento demo al registrarse** (§5).
5. **`event_activations`** (§4).
6. **Muro de activación sobre los `invitation_tokens`** (§4).

---

## 8. Efecto en la puerta que hay que recordar

`components/admin/EventCheckinManager.tsx` se suscribe por Realtime a `checkins` con
la sesión del usuario, y **Realtime respeta RLS**. Desde esta migración, un operador
con rol `door` deja de recibir esos eventos **salvo que esté en
`event_admin_assignments`**.

No es caída total (el canal `broadcast` y el refresco manual siguen), y sólo aplica en
modo tótem. Pero **antes de un evento real hay que asignar a los operadores de puerta
a su evento.**

Al 28/08/2026 no hace falta: el único perfil existente es `admin`, y `is_alista_staff()`
le da acceso.

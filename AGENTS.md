# AGENTS.md — Alista

> Punto de entrada para Codex y cualquier motor que lea `AGENTS.md`.
> **Antes de tocar nada, leé `docs/CONTINUIDAD.md`.** Ahí está el estado de hoy, los frentes
> abiertos y el orden de lectura. Este archivo es el resumen mínimo.

---

## Qué es Alista

Producto en construcción y validación en eventos reales. **Especializado en cumpleaños de 15.**

No reposicionarlo como plataforma genérica de eventos. La tecnología puede ser horizontal; el
producto percibido, la comunicación y las prioridades de UX son verticales sobre 15s.

Alista prepara cada llegada para que el anfitrión pueda estar presente y cada invitado se sienta
esperado.

---

## Fuente de verdad (en este orden)

1. `docs/Product/ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md` — canónico de producto y UX.
2. `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` — propiedad del evento, comprador, muro
   de pago, Mercado Pago. **Cierra la §42 del anterior.** En propiedad/comprador/pagos, manda este.
3. `docs/DHARMA_CASE_PRIVACY.md` — privacidad y menores.
4. `docs/CONTINUIDAD.md` — estado de hoy.

Si el código, un README o un copy viejo contradice estos documentos, **no sigas la implementación
vieja en silencio.** Marcá el conflicto y proponé la corrección más chica que sea coherente.

---

## Decisiones cerradas — NO reabrir

- **Comprador y dueño del evento = la responsable (la madre).** El planner es colaborador
  invitado, no dueño ni comprador. Motivo: Mercado Pago trata el cobro de entradas como pago por
  servicio, retiene ~30 días y convierte al colector en vendedor a efectos fiscales.
- **Sin capa de organización.** Precio por evento, cuenta personal.
- **La propiedad del evento es la primitiva de autorización** (`events.owner_user_id`), y es
  transferible. Un evento nunca debe quedar sin dueño.
- **El demo y el evento real son la misma fila.** El pago cambia el estado.
- **El pago desbloquea los links de invitación, no "el envío".** Alista no envía: la invitación
  sale del WhatsApp personal de la quinceañera. Lo bloqueable es la emisión/activación de
  `invitation_tokens`.
- **El pago no va en RLS.** Es estado, no permiso. La dueña entra a sus datos siempre.
- **Soporte de Alista: acceso total, permanente y sin registro.** Deliberado.
- **Mercado Pago sólo aparece en eventos con entrada paga.** Una fiesta privada nunca lo toca.

Sólo se reabren con evidencia de usuarios, de producto, comercial, restricción legal,
imposibilidad técnica o decisión explícita del owner.

---

## Reglas de ingeniería

- Inspeccioná la implementación existente antes de cambiar arquitectura. No reescribas de cero.
- Cambios chicos y revisables. Preservá el comportamiento que funciona salvo razón documentada.
- TypeScript estricto. Validá entradas. Respetá los límites de Supabase/RLS. No expongas secretos.
- **Las migraciones no se aplican solas.** Se escriben en `supabase/migrations/`, se proponen, y
  las aplica el dueño en el SQL Editor. No hay CLI de Supabase enlazado.
- **`guests.payment_status` es la única fuente de verdad para la decisión de acceso.** Un `notes`
  corrupto no puede otorgar acceso. Cubierto por tests fail-closed.
- **El panel admin usa `service_role` y saltea RLS.** El control real está en
  `ensureAuthorizedApiAccess` / `ensureAuthorizedEventApiAccess`. Si cambiás autorización, hay que
  cambiar los dos lados.
- Recepción/check-in debe seguir siendo rápida y resistente a mala conectividad.
- Verificá comportamiento mobile en todo lo que ve el invitado.
- Después de tocar auth, RLS o pagos: `npx tsc --noEmit` y `npm test`.

Al proponer un cambio significativo, indicá: problema · usuario · razón estratégica ·
incertidumbre que reduce · criterio de aceptación · verificación.

---

## Filtro antes de agregar una feature

1. ¿Qué problema real resuelve y para quién?
2. ¿Qué incertidumbre reduce?
3. ¿Qué información pide, y es proporcional?
4. ¿Hace al equipo más autónomo?
5. ¿Devuelve más atención de la que consume?
6. ¿Fortalece la especialización en 15s?
7. ¿El producto actual puede demostrar la promesa con honestidad?

No agregues features sólo porque son comunes en software de eventos.

---

## Estilo de trabajo

El owner es diseñador/director creativo, no programador.

- Explicá consecuencias en castellano llano.
- Hacé visibles las decisiones y los tradeoffs; no los escondas detrás de jerga.
- Preferí próximas acciones concretas.
- Sé autónomo al codear, pero **no cambies la estrategia en silencio.**

---

## Comandos

```
npm run dev          # local
npm run build        # build
npm test             # vitest (285 tests)
npx tsc --noEmit     # typecheck
npm run lint         # eslint
```

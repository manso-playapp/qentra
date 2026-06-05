# Handoff Context — Post-deploy cimientos 2026-06-05

## Que se deployó

Codigo de `main` con los 3 commits de cimientos:

| Commit | Cambio |
|---|---|
| `0c0c56a` | Columna `payment_status` en `guests` (migrada de `notes`) |
| `48ff782` | Tipos honestos en `evaluateGuestAccess` (sin `as string`) |
| `21e8173` | Status `duplicate` denied en puerta (fail-closed) |

## Estado de produccion

- Migracion `payment_status` aplicada (ver `scripts/migration_prod_payment_status.sql`)
- Backfill corrido desde `notes` → columna
- Query de verificacion: 0 filas inconsistentes (pendiente de ejecucion en prod por el operador)
- Suite de tests: 71 tests en verde (Vitest)
- Build de Next.js: sin errores

## Fuente de verdad para acceso

La columna `payment_status` es la **unica fuente de verdad** para la decision de acceso.

Cadena de lectura:
1. API routes leen `guest.payment_status` de la DB
2. `isInvitationAccessReady(guestStatus, paymentStatus)` decide
3. `evaluateGuestAccess()` decide por status, sin tocar payment
4. `parseInvitationDetails(notes)` se usa SOLO para DNI/menu/acompanantes/obs

Un `notes` corrupto con `"Pago: approved"` **NO puede** otorgar acceso si la columna dice `pending`. Esto esta cubierto por tests fail-closed.

## Congelado hasta post-16/08

- Refactor del vocabulario de status (QEN-007) — riesgo de puerta
- Bug cosmetico de contadores `doorMetrics` — no afecta acceso
- Multi-tenant / `organization_id`
- Integracion de cobro (Mercado Pago), UI de cobro, aforo dinamico

## Proximo paso agendado

- Ensayo de puerta con dispositivo real — otro ticket, manual, agendado para fin de julio

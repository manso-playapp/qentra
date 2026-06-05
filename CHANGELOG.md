# Changelog

Todas las entradas relevantes al entorno de produccion del cliente.

## [2026-06-05] Deploy cimientos pre-16/08

### Added
- Columna `payment_status` en tabla `guests` (`not_required` | `pending` | `approved`) con CHECK constraint — reemplaza la lectura desde el campo serializado `notes`.
- Test fail-closed: `notes` corrupto con `"Pago: approved"` + columna `pending` ⇒ deny. Fija que la columna es la unica fuente de verdad para decision de acceso.
- Suite de Vitest con 71 tests en verde (access-policy + invitation-response + fail-closed).
- Script SQL de migracion, backfill y verificacion en `scripts/migration_prod_payment_status.sql`.

### Fixed
- Invitados con status `duplicate` ahora son denied en puerta (fail-closed, commit `21e8173`).
- Tipos de `evaluateGuestAccess` honestos — eliminados casts `as string` inseguros (commit `48ff782`).

### Changed
- La decision de acceso (`isInvitationAccessReady`) lee exclusivamente de la columna `payment_status`, no de `parseInvitationDetails(notes)`.
- `parseInvitationDetails` sigue usandose para extraer DNI, menu, acompanantes y observaciones de `notes`, pero ya no para `paymentStatus` en la cadena de acceso.

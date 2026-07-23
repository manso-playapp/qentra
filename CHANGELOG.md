# Changelog

Todas las entradas relevantes al entorno de produccion del cliente.

## [0.7.0] - 2026-07-23

### Added
- Organizador de mesas y destinos: muestra confirmados, cuenta titular y acompañantes, permite asignar destinos y los resume por sector.
- Plantilla CSV descargable para cargar invitados (`Nombre, Apellido, Email, Telefono, Destino`). La importación ignora su encabezado automáticamente.
- El Tótem muestra el destino del invitado cuando existe, y recibe la actualización de check-in mediante un aviso Realtime inmediato con sondeo de respaldo.
- Experiencia de invitación con música, 60 partículas animadas tipo luciérnagas y atribución enlazada a la web de Alista.

### Changed
- La pantalla de Puerta muestra “Procesando…” mientras valida o registra un acceso.
- El proyecto opera sobre Supabase Pro/Micro tras la migración desde el plan Free; se redujo el sondeo continuo para no volver a agotar recursos.

### Next
- La próxima integración de producto es Mercado Pago. La conciliación manual actual se mantiene como respaldo hasta que esa integración esté lista.

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

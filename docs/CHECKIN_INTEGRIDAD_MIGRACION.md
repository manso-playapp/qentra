# Integridad del ingreso: migración aplicada

Estado al 05/09/2026: **aplicada por el owner y verificada en la base configurada
por Alista** mediante consultas de sólo lectura. Archivo aplicado:
`supabase/migrations/20260905162449_guard_guest_checkin_integrity.sql`.
La API nueva sigue pendiente de publicación. El owner confirma recepción con dos
celulares funcionando y cobros de Alfonsina llegando a la madre. La contención
simultánea por el último cupo es un caso técnico específico aún no documentado.

## Verificación posterior a la aplicación

Proyecto: `ntpybhadcpaendjtkhib`. El listado de proyectos del conector devolvió
vacío, pero `execute_sql` funcionó con la referencia de la conexión del repo.
No se ejecutaron INSERT/UPDATE/DELETE, DDL ni ingresos de invitados en esta auditoría.

| Comprobación | Resultado |
| --- | --- |
| Columna `checkins.admitted_people` | Existe, integer |
| Restricción no negativa | Existe y validada: `admitted_people >= 0` |
| Índice de aprobados por evento/invitado | Existe y válido |
| Cuerpos de las tres funciones | Coinciden exactamente con los cuerpos del SQL local por MD5 |
| Ejecución de las tres funciones | Denegada a anon/authenticated; permitida a service_role |
| Escritura directa de las cuatro tablas protegidas | Sin INSERT/UPDATE/DELETE/TRUNCATE para anon/authenticated |
| Grants adicionales por columna | Sin INSERT/UPDATE para anon/authenticated |
| Lectura y RLS | SELECT disponible y RLS habilitada en las cuatro tablas |
| Acceso de la API | service_role conserva SELECT/INSERT/UPDATE/DELETE en las cuatro tablas |
| Backfill observado | 104 registros; 0 snapshots nulos, 0 negativos |
| Reconocimiento por Data API | GET con parámetros inválidos devuelve `22023 invalid_parameters` con service_role; anon recibe `42501 permission denied` |

Huellas de los cuerpos de función (`md5(pg_proc.prosrc)`), comparadas con el
contenido entre delimitadores del archivo local; se usan para verificar igualdad,
no como firma de seguridad:

- `register_guest_checkin_guarded`: `5683c5634a960df578200ab7b0516cf9`.
- `register_guest_checkin`: `60034722c36d99cce5e78ac01bcefe6b`.
- `revert_guest_checkin`: `9b6f861929e6863d9a7a5f334ffa2145`.

El agregado observado contiene 102 check-ins aprobados y suma 102 personas
estimadas históricas. **No acredita asistencia real ni ausencia de cambios respecto
del estado previo**, porque no se dispone aquí de una captura anterior comparable.
Tampoco se compararon las definiciones históricas de policies.

La comprobación de Data API usó GET (transacción de lectura), IDs nulos sintéticos
y un método inválido, rechazado antes de buscar eventos o invitados. Confirma firma,
permisos y reconocimiento del RPC; no sustituye el ensayo de un ingreso válido.

**Evidencia del owner (05/09/2026):** recepción con dos celulares ya probada y
funcionando; pagos de Alfonsina recibidos por la madre, responsable de cobros.
El owner también confirma que en pruebas preliminares el segundo escaneo avisaba
que el invitado ya estaba registrado como ingresado (texto recordado, no literal
verificado). El control de repetición tiene evidencia funcional.
No queda pendiente demostrar esos circuitos generales. No se confirmó que ese
ensayo incluyera, tras esta migración, dos admisiones compitiendo exactamente por
el último cupo o por un mismo QR. Son escenarios de borde, no incidentes detectados.
El ensayo específico de locks descrito abajo sigue sin evidencia multiconexión;
no restaurar permisos de escritura del navegador para realizarlo.
Los PDF y el protocolo creados antes de esta aplicación reflejan aquel corte; este
apartado y `docs/CONTINUIDAD.md` son la referencia del estado técnico actual.

## Problema y criterio de aceptacion

Para la responsable y el equipo de recepcion, un comprobante reenviado o una
peticion manipulada no deben habilitar un pago pendiente. El grupo completo debe
caber antes de registrar su ingreso. Dos puestos no deben ocupar el ultimo lugar
simultaneamente. Estas condiciones sostienen la promesa de preparacion y
acompanamiento del servicio, y reducen la incertidumbre sobre lo que se autoriza
en la puerta.

La API verifica sesion, permiso al evento y PIN de supervisor. PostgreSQL vuelve
a comprobar pago, estado, token, horario y aforo en la misma transaccion que
registra el ingreso. Una denegacion no modifica token, QR, invitado ni activacion.

## Contrato con la API

RPC `public.register_guest_checkin_guarded`:

| Parametro | Tipo | Default |
| --- | --- | --- |
| p_event_id | uuid | requerido |
| p_guest_id | uuid | requerido |
| p_invitation_token_id | uuid | null |
| p_method | text: manual / qr | manual |
| p_reason | text | null |
| p_override_code | text | null |

Resultado: `{ checkin_id, checked_in_at, admitted_people }`. El ultimo campo es
la cantidad incorporada en este registro, no la ocupacion acumulada del evento.

Errores de negocio tienen SQLSTATE `P0001` y mensaje estable:
`payment_required`, `not_ready`, `cancelled`, `duplicate`, `expired`,
`invalid_token`, `already_checked_in`, `outside_window`, `event_full`.
`invalid_parameters`, `guest_event_mismatch` y `guest_type_event_mismatch` usan
`22023`; `event_not_found` y `guest_not_found` usan `P0002`.

- Admitir solo `payment_status = approved / not_required`. NULL y valores
  desconocidos bloquean. `notes` nunca decide el pago.
- Admitir solo `status = enabled / confirmed / checked_in`; el ultimo necesita
  resolver la advertencia de reingreso.
- Override acepta solo `already_checked_in` o `outside_window`, con motivo no
  vacio. **La funcion no recibe ni verifica el PIN**: exclusivamente la API con
  `service_role` puede invocarla despues de verificarlo y autorizar el evento.
- Ni pago pendiente ni aforo lleno admiten excepcion. QR consumido/inactivo,
  vencido o con vencimiento NULL tampoco. Vencimiento exacto al momento de uso
  esta vencido.
- Reingreso con historial aprobado es manual y suma cero personas. Mantiene la
  prioridad de la advertencia de reingreso; no vuelve a evaluar la ventana de
  primera admision. Un `checked_in` sin historial aprobado es inconsistente:
  requiere revisar/corregir su registro y la primera admision real cuenta cupo.
- Horarios se interpretan en `America/Argentina/Buenos_Aires`; offsets explicitos
  mandan, y sin offset se infiere dia siguiente si la hora es anterior al inicio
  del evento. El reloj se lee despues de adquirir los locks.
- El wrapper `register_guest_checkin` de seis argumentos conserva la firma para
  clientes viejos, pero delega a las mismas reglas. `p_allow_duplicate=true`
  corresponde a `already_checked_in` y requiere motivo. No restaura bypasses.
- La API nueva **no debe volver al RPC viejo si falta esta migracion**: informar
  que falta preparar el servidor y no registrar un ingreso por otro camino.

## Cupo, historial y reversion

El lock de `events` ocurre antes del lock de `guests`, tanto al ingresar como al
revertir. Asi el chequeo del cupo se hace despues de la transaccion anterior del
mismo evento. Se cuentan titular + `plus_ones_confirmed`; solo si este ultimo
campo es NULL se recurre a `companion_names`. Cero confirmado sigue siendo cero.

`checkins.admitted_people` guarda el tamano del grupo de primera admision. Cada
reingreso agrega cero. Cambiar los acompanantes despues no reescribe cuantas
personas ingresaron. La ocupacion suma snapshots aprobados; la funcion agrupa el
fallback historico sin snapshot por invitado para no duplicar reingresos.

**Limitacion historica:** antes no existia snapshot. El backfill asigna al primer
check-in aprobado de cada invitado el grupo disponible al aplicar la migracion;
los restantes reciben cero. Esto es una estimacion si el grupo fue editado
despues de aquella fiesta. No debe presentarse como conteo historico certificado.
Registros sin invitado relacionado se consideran individualmente.

Revertir marca todos los aprobados del invitado como rechazados y libera su cupo;
restaura su ultimo token usado y el QR visual correspondiente, conservando el
comportamiento anterior. La validacion de vencimiento sigue vigente al usarlo.
No borra `event_activations.consumed_at`: revertir no vuelve una fiesta celebrada
a una activacion nueva.

Este modelo admite al grupo completo. No implementa llegada parcial ni conteo de
personas actualmente dentro del salon: no hay un circuito nuevo de egresos.

## Permisos y superficie de escritura

Funciones guarded, wrapper y reversion: EXECUTE solo para `service_role`.
Se revocan INSERT/UPDATE/DELETE/TRUNCATE de `PUBLIC`, `anon` y `authenticated`
en `checkins`, `guests`, `invitation_tokens` y `guest_qr_codes`. Esto impide usar
REST directo para fabricar un ingreso, modificar un pago o reactivar un QR.

Se preservan SELECT, RLS y policies existentes: Realtime puede seguir leyendo
los registros autorizados. La aplicacion inspeccionada escribe estas tablas por
APIs de servidor, no desde los componentes. No se cambian propiedad, comprador,
activacion comercial ni el acceso permanente de soporte.

Antes de aplicarla, comprobar que produccion no tenga integraciones externas ni
grants de columnas adicionales que dependan de escritura directa con una sesion
de navegador. El fixture local no prueba esos consumidores ni la configuracion
real de Realtime.

## Verificacion reproducible

Pruebas reales SQL/PLpgSQL sobre un fixture sintetico en PGlite 0.5.8; no datos
personales, no URL de Supabase y no conexiones remotas. No agrega dependencias al
proyecto. Instalar el motor en una carpeta temporal separada y ejecutar:

```sh
PGLITE_MODULE_PATH=/private/tmp/alista-sql-tests/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-checkin-migration.mjs
```

La suite verifica pagos nulos/desconocidos/pendientes pese al override; estados;
9 + 2 denegado y 8 + 2 permitido con cupo 10; reingreso sin duplicar; snapshots;
reversion; consumo de activacion; tokens vencidos, nulos, inactivos y consumidos;
QR visual; horario; wrapper; permisos y ausencia de mutaciones ante rechazos.

**Limite de la prueba:** PGlite tiene un solo backend PostgreSQL. Dos promesas
simultaneas se encolan: prueban el ultimo lugar pero no contencion entre dos
conexiones. Falta ensayo en PostgreSQL de staging con dos sesiones: sesion A
abre transaccion y admite un invitado con cupo restante uno; B intenta admitir
otro y debe esperar el lock; A confirma; B debe terminar con `event_full`.
Repetir con A haciendo ROLLBACK: B debe poder ingresar. Probar tambien reversion
simultanea e ingreso, y dos escaneos del mismo QR.

## Aplicacion por el owner y orden de salida

1. Leer el archivo SQL completo. Confirmar existencia de columnas de invitados,
   ventanas de tipos y `event_activations.consumed_at/consumed_for_date` utilizadas
   en migraciones anteriores. `supabase-schema.sql` es referencia reconstruida,
   no prueba del estado actual de la base.
2. Guardar definiciones vigentes de las tres funciones con `pg_get_functiondef`,
   permisos de tablas/columnas y funciones, y conteos de check-ins aprobados.
   No hace falta exportar nombres, contactos ni datos de menores. Esta migracion
   no elimina policies. Mantener una copia de respaldo de la base segun la
   operacion habitual antes de cualquier cambio de esquema.
3. Ensayar en staging la migracion, permisos de lectura y API completa. Verificar
   los escenarios de concurrencia anteriores y la suscripcion de recepcion.
4. El owner aplica el SQL en una ventana sin recepcion activa; el archivo tiene
   BEGIN/COMMIT para que un error no deje la mitad del cambio. Despues se publica
   la API preparada para el RPC guarded. La transicion afecta excepciones de
   clientes viejos: coordinar ambos pasos y no hacerla durante un ingreso real.
5. Verificar con invitados sinteticos dedicados al ensayo, sin alterar los eventos
   reales. No habilitar la promesa comercial de controles verificados hasta cerrar
   este ensayo completo. No hay aplicacion ni despliegue automatico desde esta tarea.

Si la migracion falla, la transaccion revierte. Si luego aparece un problema,
mantener la puerta cerrada a escrituras inseguras mientras se diagnostica; no
restaurar automaticamente grants publicos ni la funcion que omitia los controles.

Referencias: documentos canonicos de producto y propiedad/pagos del repo;
[Supabase, funciones y privilegios](https://supabase.com/docs/guides/database/functions).
La consulta del changelog Markdown no estuvo disponible desde el navegador ni
el sandbox de red; la documentacion oficial de funciones si pudo verificarse.

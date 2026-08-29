# Alista

Alista es una plataforma web que vincula invitacion, pago y acceso en fiestas
privadas con cupo limitado (fiestas de 15, egresados y celebraciones juveniles).
La cuenta y el evento son de la **responsable de la fiesta** (habitualmente la madre);
planners, salones y productoras participan como colaboradores invitados al evento.
Ver `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md`.

Estado actual de Alista 1.0.0:

- admin de eventos, invitados y tipos de invitado
- invitaciones con QR unico por invitado
- carga masiva con plantilla descargable y asignacion de mesas/destinos
- check-in manual y por QR
- vistas separadas de `admin`, `puerta` y `totem`, con destino visible al ingresar
- autenticacion operativa con Supabase Auth
- envio por email como alternativa y WhatsApp manual desde el telefono propio
- Checkout Pro por cuenta receptora del evento: pago, conciliación y habilitación automática del QR

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase

## Desarrollo local

Instala dependencias:

```bash
npm install
```

Crea tu archivo de entorno a partir de [`/.env.example`](./.env.example).

Corre el proyecto:

```bash
npm run dev
```

Verificaciones:

```bash
npm run lint
npm run build
```

## Variables de entorno

Las variables esperadas estan documentadas en [`/.env.example`](./.env.example).

Entre las mas importantes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ALISTA_EMAIL_FROM`

### Mercado Pago

Los invitados pagan el importe definido en su **tipo de invitado** en la cuenta
Mercado Pago que la responsable vincula para **ese evento**. Alista no retiene
ni recibe ese dinero.
El pago del servicio de Alista es un flujo comercial separado y se cobra en la
cuenta de Alista; su importe y periodicidad todavía deben definirse antes de
crear ese checkout.

La cuenta propia se configura con `MERCADOPAGO_ALISTA_ACCESS_TOKEN` (Production)
y `MERCADOPAGO_ALISTA_TEST_ACCESS_TOKEN` (Preview). Estas variables son
server-only y no se guardan en el evento ni se muestran al responsable.

Para habilitar cobros de invitados, aplicá las migraciones
`20260723162321_add_mercadopago_payments.sql` y
`20260825025825_add_event_payment_oauth_states.sql`, registrá exactamente
`MERCADOPAGO_OAUTH_REDIRECT_URI` como URL de redirección HTTPS de la aplicación
de Mercado Pago y configurá `MERCADOPAGO_CLIENT_ID`,
`MERCADOPAGO_CLIENT_SECRET` y una clave Base64 aleatoria de 32 bytes en
`ALISTA_PAYMENT_CREDENTIALS_ENCRYPTION_KEY`. Desde el detalle del evento, una
persona administradora inicia la vinculación y la responsable autoriza su
cuenta. Los tokens OAuth y verificadores PKCE se cifran antes de guardarse.

Configurá también `MERCADOPAGO_WEBHOOK_SECRET` y el webhook HTTPS
`/api/mercadopago/webhook` con el evento **Pagos**. La preferencia incluye la
transacción esperada, por lo que webhook y conciliación consultan la cuenta del
evento y validan importe y moneda antes de habilitar el QR.

`MERCADOPAGO_ALISTA_ACCESS_TOKEN` y `MERCADOPAGO_ALISTA_TEST_ACCESS_TOKEN`
son las credenciales server-only de la cuenta propia de Alista: se reservan
para el cobro del servicio y para conciliar intentos históricos creados antes
de esta migración. Los nombres anteriores
(`MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_TEST_ACCESS_TOKEN`) se aceptan como
alias legacy. Ninguna de estas credenciales es fallback para pagos nuevos de
invitados: esos pagos usan exclusivamente el token OAuth cifrado de la cuenta
receptora del evento.

Los deploys Preview bloquean la vinculación de cuentas y los cobros de invitados
para no reutilizar una cuenta receptora real. La validación de dinero se realiza
en producción controlada con una cuenta externa de prueba.

## Notas

- Este repo publico no incluye playbooks internos ni handoff operativo.
- Algunas capacidades dependen de configuracion real de proveedores y de tablas/policies existentes en Supabase.

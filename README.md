# Alista

Alista es una plataforma web que vincula invitacion, pago y acceso en fiestas
privadas con cupo limitado (fiestas de 15, egresados y celebraciones juveniles).
Se ofrece a salones, productores y organizadores.

Estado actual del MVP:

- admin de eventos, invitados y tipos de invitado
- invitaciones con QR unico por invitado
- carga masiva con plantilla descargable y asignacion de mesas/destinos
- check-in manual y por QR
- vistas separadas de `admin`, `puerta` y `totem`, con destino visible al ingresar
- autenticacion operativa con Supabase Auth
- envio por email y WhatsApp segun configuracion del entorno
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
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

### Mercado Pago

Los invitados pagan sus entradas o aportes en la cuenta Mercado Pago que la
responsable vincula para **ese evento**. Alista no retiene ni recibe ese dinero.
El pago del servicio de Alista es un flujo comercial separado y se cobra en la
cuenta de Alista; su importe y periodicidad todavía deben definirse antes de
crear ese checkout.

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

`MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_TEST_ACCESS_TOKEN` permanecen sólo
para los cobros propios de Alista que se incorporen a futuro y para conciliar
intentos históricos creados antes de esta migración; no son fallback para pagos
nuevos de invitados.

Los deploys Preview bloquean la vinculación de cuentas y los cobros de invitados
para no reutilizar una cuenta receptora real. La validación de dinero se realiza
en producción controlada con una cuenta externa de prueba.

## Notas

- Este repo publico no incluye playbooks internos ni handoff operativo.
- Algunas capacidades dependen de configuracion real de proveedores y de tablas/policies existentes en Supabase.

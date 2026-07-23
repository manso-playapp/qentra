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

## Notas

- Este repo publico no incluye playbooks internos ni handoff operativo.
- Algunas capacidades dependen de configuracion real de proveedores y de tablas/policies existentes en Supabase.

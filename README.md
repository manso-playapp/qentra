# Qentra

Qentra es una plataforma web para gestion de eventos, invitados y control de acceso.

Estado actual del MVP:

- admin de eventos
- gestion de invitados y tipos de invitado
- emision de invitaciones con QR
- check-in manual y por QR
- vistas separadas de `admin`, `puerta` y `totem`
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
- `QENTRA_EMAIL_FROM`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

## Notas

- Este repo publico no incluye playbooks internos ni handoff operativo.
- Algunas capacidades dependen de configuracion real de proveedores y de tablas/policies existentes en Supabase.

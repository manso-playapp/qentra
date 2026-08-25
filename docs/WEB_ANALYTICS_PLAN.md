# Alista — Plan de analítica web

**Fecha:** 24 de agosto de 2026
**Ticket:** `WEB-040`
**Estado:** Vercel Web Analytics integrado y desplegado para la web pública, pero apagado por la compuerta `ALISTA_WEB_ANALYTICS_ENABLED`. Habilitación del dashboard y revisión legal pendientes.

## 1. Decisión que debe soportar

La medición debe permitir decidir si la nueva web:

1. atrae a familias y profesionales correctos;
2. explica el producto mediante las demos;
3. genera una intención de contacto suficientemente fuerte como para abrir el correo;
4. lo hace sin degradar rendimiento ni recolectar datos personales innecesarios.

No se fijan objetivos numéricos hasta contar con una línea de base estable y tráfico suficiente.

## 2. KPIs recomendados

### KPI principal — tasa de intención de contacto

Sesiones de la web pública con `contact_email_opened` divididas por sesiones de la web pública.

Es el punto observable más cercano a una consulta real con el flujo actual. No equivale a un email enviado: el envío ocurre fuera de Alista y debe interpretarse como intención, no como lead confirmado.

### KPI principal — tasa de finalización de demo

Sesiones que completan `invitation_demo_completed` o `checkin_demo_completed` divididas por sesiones que inician la demo correspondiente.

Permite evaluar si la interacción ayuda a entender el producto o introduce fricción.

### KPI principal — selección de recorrido comercial

Sesiones con `cta_clicked`, segmentadas por `audience`, divididas por sesiones que alcanzan el placement correspondiente.

Permite comparar el interés de familias y profesionales sin inferir la identidad de la persona.

## 3. Drivers y diagnóstico

- CTR de los dos CTAs del hero.
- Preparación del formulario versus apertura del correo.
- Inicio y finalización de invitación/check-in demo.
- Interacción con personalización, WhatsApp y Centro de Preparación.
- Alcance de secciones mediante `marketing_section_viewed`.
- Diferencias por placement y audiencia con categorías cerradas.

## 4. Guardrails

- LCP, INP y CLS no deben empeorar al incorporar el proveedor.
- El proveedor no se carga antes de resolver consentimiento y base legal.
- Ningún evento incluye nombre, email, teléfono, organización, mensaje, token, ID de invitado o parámetros de URL.
- No se crea un identificador persistente ni una cookie desde la capa local.
- Las propiedades usan valores enumerados de baja cardinalidad.
- No se interpreta `contact_email_opened` como envío confirmado.

## 5. Catálogo de eventos

| Evento | Momento | Propiedades permitidas |
|---|---|---|
| `cta_clicked` | CTA comercial activado | `placement`, `audience`, `destination` |
| `contact_form_prepared` | El formulario arma el mailto | `source`, `audience` |
| `contact_email_opened` | La persona abre su cliente de correo | `source`, `audience` |
| `invitation_demo_started` | Abre la invitación demo | ninguna |
| `invitation_demo_completed` | Confirma el grupo demo | `attendee_count`, `restriction_selected` |
| `whatsapp_demo_previewed` | Ve cómo recibe el mensaje Martina | `customized` |
| `persona_preview_changed` | Cambia “Ver como” | `persona` |
| `visual_style_changed` | Cambia universo visual | `style` |
| `preparation_item_viewed` | Abre un pendiente | `item` |
| `preparation_item_resolved` | Resuelve un pendiente demo | `item`, `resolved_count` |
| `checkin_demo_started` | Escanea el acceso demo | ninguna |
| `checkin_demo_completed` | Registra el ingreso grupal | `group_size` |
| `marketing_section_viewed` | Una sección cruza la franja central del viewport | `section` |

El contrato TypeScript vive en `lib/marketing-analytics.ts` y debe seguir siendo la fuente de verdad para nombres y propiedades.

## 6. Arquitectura de privacidad

La instrumentación interna emite eventos sólo dentro del navegador mediante `alista:marketing-analytics`. El adaptador de Vercel Web Analytics se monta únicamente en `app/(marketing)/layout.tsx`: no cubre Admin, check-in, tótem ni rutas de invitación que puedan contener tokens. En desarrollo el paquete no envía datos.

Los eventos personalizados se reenvían desde el contrato tipado y sólo contienen propiedades planas de baja cardinalidad. No se crean cookies ni identificadores persistentes desde la capa de Alista.

Antes de habilitar la recepción en producción se debe confirmar:

1. finalidad, base legal y si la modalidad sin cookies puede operar sin consentimiento previo;
2. retención, exclusión de tráfico interno y acceso a los reportes;
3. política de privacidad actualizada;
4. comportamiento ante rechazo o retiro del consentimiento, si legal lo requiere;
5. activación de Web Analytics en el proyecto de Vercel de producción.

## 7. Decisiones pendientes

- Confirmar la activación de Vercel Web Analytics en el proyecto de producción.
- Definir si la medición cookieless puede operar sin consentimiento previo según revisión legal aplicable.
- Confirmar que el plan de Vercel contratado admite eventos personalizados y la cantidad de propiedades que usa el catálogo.
- Decidir si el formulario debe evolucionar desde `mailto:` a un envío verificable del lado servidor.
- Establecer línea de base y objetivos después del primer período de tráfico confiable.

## 8. Verificación técnica — 24 de agosto de 2026

- El directorio está vinculado a `mansos-projects-7d8ae3d2/alista`. La producción `dpl_EYJt18GaAd9DdYFfs6kH1tGseiJy` quedó `Ready` el 24 de agosto de 2026; su URL técnica está protegida por Deployment Protection, mientras que `alista.com.ar` redirige a `www.alista.com.ar` y ambas respuestas públicas devolvieron HTTP 200 con la web.
- La comprobación del dominio público sobre home, Dharma, demo y profesionales devolvió HTTP 200, sin errores de consola ni overflow móvil. No se cargó script, vista ni evento de Insights porque `ALISTA_WEB_ANALYTICS_ENABLED` no está configurada como `1`.
- La habilitación no se realiza sólo desde el código: luego de contar con aprobación legal y comercial, abrir **Alista → Analytics → Enable** en el dashboard de Vercel, configurar `ALISTA_WEB_ANALYTICS_ENABLED=1` sólo para Production y desplegar. Mientras la variable no sea `1`, el componente no carga Insights.
- Después del despliegue, verificar con `vercel curl / --deployment <url>` que se publica el script de Insights y, en una sesión de marketing, que se emite la solicitud de vista/evento sin query parameters ni propiedades personales.
- Vercel indica que los eventos personalizados y el número de propiedades disponibles dependen del plan; comprobar el límite vigente antes de activar el catálogo completo.

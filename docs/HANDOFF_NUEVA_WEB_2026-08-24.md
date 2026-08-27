# Alista — Handoff de nueva web

**Fecha:** 24 de agosto de 2026  
**Rama:** `main`  
**Objetivo:** permitir retomar el trabajo en otra computadora sin reconstruir decisiones ni estado.

## 1. Estado general

La nueva web pública está implementada hasta `WEB-033`. La home, la demo, el caso Dharma, el recorrido para familias, la página para profesionales y las páginas secundarias ya usan la nueva dirección verticalizada en cumpleaños de 15.

El siguiente bloque es la calidad de lanzamiento:

1. `WEB-040` — Vercel Web Analytics integrado y desplegado, pero apagado hasta la activación y revisión legal;
2. `WEB-041` — performance y optimización 4G; línea de base local medida, validación en dispositivo/red real pendiente;
3. `WEB-042` — auditoría automatizada lista; dispositivo real, Safari/VoiceOver y contraste sobre frames pendientes;
4. `WEB-043` — auditoría técnica lista; crítica y aprobación visual final pendientes.

`WEB-033` completó una recorrida técnica y visual en Chrome sobre 320, 390, 768, 1024 y 1440 px. Queda la aprobación visual final del owner en dispositivo real.

## 2. Decisiones cerradas durante esta implementación

- La web habla específicamente desde el mundo de los cumpleaños de 15.
- Hay dos entradas comerciales: familias y profesionales recurrentes.
- La tipografía de títulos es **Inter Tight**, servida localmente desde `app/fonts/InterTight-Variable-Latin.woff2`.
- Nunito se mantiene como tipografía editorial/cuerpo y también se sirve localmente en WOFF2 latino.
- Los títulos grandes redujeron su escala aproximadamente 25–30 % y usan interletrado moderado (`-0.005em` a `-0.01em`), sin compresión extrema.
- El hero usa variantes adaptativas de 3,3 MB/1,0 MB y un poster de 184 KB. El caso Dharma difiere la carga del video hasta acercarse al viewport.
- El logo y el header crecieron aproximadamente 20 % respecto de la primera versión.
- El CTA **Quiero Alista** usa fondo azul corporativo y texto blanco.
- El caso Dharma usa material real y no publica métricas sin fuente.
- La captura de “Alista ya está pasando” se muestra completa con `object-contain`, sin recortar sus bordes.
- En Profesionales, las fechas de eventos separan día y mes dentro de una caja fija de 56 × 56 px para evitar desplazamientos.
- `/precios` publica el precio de lanzamiento familiar ($89.000, 50% sobre una lista de $178.000) y mantiene los packs profesionales bajo consulta hasta cerrarlos.
- Los legales siguen marcados como versiones base: requieren revisión profesional antes de publicación definitiva.

## 3. Trabajo implementado

### Web pública

- Home editorial con video real, timeline invertido y navegación por momentos.
- Demo interactiva de invitación y transición al lado operativo.
- Momento WhatsApp personal.
- Recorrido Invitá → Confirmá → Conocé → Prepará → Cobrá → Recibí.
- Vista por persona y personalización guiada.
- Centro de Preparación interactivo.
- Check-in grupal.
- Caso editorial Dharma con video, captura de acceso y secuencia interactiva.
- Recorrido de cierre para familias.
- Página `/profesionales` con workspace, preparación y formulario específico.
- Página `/demo` con formulario separado del título para evitar superposición.
- Páginas `/producto`, `/como-funciona`, `/seguridad`, `/casos`, `/precios`, `/contacto`, `/privacidad` y `/terminos` alineadas con el nuevo sistema visual.
- FAQ reescrita con afirmaciones verificables.
- Header, footer, metadata, Open Graph, sitemap, icono y logos actualizados.

### Formularios y conversión

- Los formularios preparan la consulta y dejan que la persona confirme el envío.
- Hay fuentes y audiencias diferenciadas para familia y profesional.
- No se crea un evento ni se inicia un pago al solicitar una demo.

### Runtime público y Supabase

- `proxy.ts` evita refrescar la sesión de Supabase en rutas públicas.
- `lib/supabase-proxy-paths.ts` concentra las rutas protegidas.
- Esto desacopla home, marketing, invitaciones públicas y webhook de fallas transitorias de Supabase Auth.
- Hay tests para rutas públicas, privadas y prefijos parecidos.

### Vigencia de invitaciones

- `isInvitationExpired` unifica la comparación de vencimiento.
- La invitación dinámica vuelve a evaluar la hora en cada request mediante `connection()`.
- Un acceso vencido deja de mostrar o generar el QR y presenta un estado específico.
- Admin, puerta e invitación usan el mismo criterio de vencimiento.
- Los casos de borde están cubiertos por tests.

### Templates de invitación

- `Viaje` conserva exactamente la estética actual de boarding pass y es el valor por defecto, también para eventos anteriores.
- `Noche` suma una alternativa editorial oscura, con la misma lógica de RSVP, QR, calendario y contacto.
- La elección se guarda por evento en `event_branding.config.template` desde el editor de invitación.
- Antes de usarla en un ambiente conectado hay que aplicar `supabase/migrations/20260826134930_add_invitation_template_config.sql`.
- Para comparar sin guardar: desde Admin → Invitación usar **Comparar template Noche**, o abrir `/invitacion/preview/<eventId>?template=midnight`.

### Performance web

- El video original de 40,4 MB fue sustituido por variantes desktop/mobile y poster que suman 4,7 MB, una reducción del 88,4 % en assets audiovisuales disponibles.
- El video del caso Dharma se carga de forma diferida y `prefers-reduced-motion` conserva sólo el poster.
- Nunito e Inter Tight se sirven localmente como WOFF2 latinos y suman aproximadamente 82 KB.
- Las imágenes editoriales usan `next/image` con dimensiones y `sizes` explícitos.
- En build productivo local, Chromium móvil 390 × 844 / DPR 2 / 4× CPU / 150 ms RTT / 1,6 Mbps, las cargas frías de la home registraron FCP entre 1,080 y 2,592 s, LCP entre 2,388 y 3,004 s (poster del hero), CLS 0 y 503 KB transferidos en la muestra de red. Es una línea de base de laboratorio, no datos de campo.
- El caso Dharma no descarga su poster hasta aproximarse al bloque; en la misma emulación, `/casos` tuvo FCP y LCP de 1,076 s (H1) y CLS 0,000012. El QR de Dharma dejó de precargarse en la home.

### Analítica web

- `lib/marketing-analytics.ts` define eventos y propiedades de baja cardinalidad.
- CTAs comerciales, formularios, invitación demo, WhatsApp, personalización, preparación, check-in y alcance de secciones ya emiten eventos locales.
- `@vercel/analytics` recibe pageviews y eventos personalizados sólo dentro de `app/(marketing)`. Quedan excluidos Admin, check-in, tótem e invitaciones para no medir identificadores ni tokens.
- La capa de Alista no instala cookies ni persiste identificadores; en desarrollo, el paquete de Vercel no envía datos.
- KPIs, caveats y guardrails están documentados en `docs/WEB_ANALYTICS_PLAN.md`.
- La producción ya contiene la integración, pero Insights está apagado por `ALISTA_WEB_ANALYTICS_ENABLED`; falta habilitar Web Analytics en Vercel y resolver consentimiento/base legal aplicable.

### Accesibilidad web

- El shell público tiene enlace de salto al contenido y navegación móvil operable con teclado.
- Header, footer, CTAs y controles interactivos tienen foco visible reforzado y targets táctiles suficientes.
- `prefers-reduced-motion` cubre animaciones, transiciones, scroll suave y la carga/reproducción de video, incluso si la preferencia cambia durante la sesión.
- Axe no encontró infracciones en las once rutas públicas a 390 px; el texto emulado al 200 % y 400 % no produjo overflow a 320 px.
- `docs/WEB_ACCESSIBILITY_AUDIT.md` documenta la evidencia automática y la matriz manual todavía pendiente.

### Auditoría técnica de lanzamiento

- Las once rutas públicas, metadata, canonicals, sitemap, robots, anchors e iconos fueron verificados.
- `robots.txt` bloquea también las raíces exactas de admin, API, test y demás superficies operativas.
- Demo y contacto ya no conservan metadata genérica; privacidad y términos tienen canonical.
- Se agregó Apple touch icon de 180 × 180 y una prueba de regresión para indexación/sitemap.
- `docs/WEB_LAUNCH_AUDIT.md` separa lo técnicamente verificado de las aprobaciones todavía pendientes.

## 4. Mapa de tickets

| Ticket | Estado | Nota |
|---|---|---|
| WEB-001 a WEB-005 | Implementados | Assets, arquitectura, copy, sistema visual y motion base. |
| WEB-010 a WEB-012 | Implementados | Shell, hero audiovisual y timeline. |
| WEB-013 | Cumplido de forma iterativa | El owner revisó y corrigió tipografía, escala, hero, logos, header y assets durante la implementación. |
| WEB-020 a WEB-026 | Implementados | Demos y recorridos de producto en la home. |
| WEB-030 | Implementado | Caso Dharma. Publicación final sujeta a validar consentimiento de imagen. |
| WEB-031 | Implementado | Página y bloque para profesionales. |
| WEB-032 | Implementado | Recorrido familia y CTA final. |
| WEB-033 | Implementado y verificado en navegador; aprobación final pendiente | Precios y páginas secundarias. |
| WEB-040 | Integración desplegada, apagada y pendiente de activación | Vercel Web Analytics sólo cubre marketing. Falta habilitarlo en dashboard, configurar la compuerta y completar revisión legal. |
| WEB-041 | Línea de base local lista; validación de campo pendiente | Video adaptativo, poster, lazy load y fuentes locales. Falta INP representativo y medición en dispositivo/red real. |
| WEB-042 | Auditoría automatizada lista; validación manual pendiente | Falta dispositivo real, Safari/VoiceOver, orientación y contraste sobre frames reales. |
| WEB-043 | Auditoría técnica lista; aprobación pendiente | Falta crítica visual, matrices manuales y decisiones legal/comercial. |

## 5. Próximos pasos concretos

### Primero: aprobación visual de WEB-033

Recorrer en desktop y mobile:

- `/precios`
- `/producto`
- `/como-funciona`
- `/seguridad`
- `/casos`
- `/contacto`
- `/privacidad`
- `/terminos`

La pasada automatizada no encontró overflow ni errores de render y corrigió el panel móvil y el reflow de CTAs con texto al 200 %. El owner debe confirmar especialmente ritmo, saltos de título, altura de tarjetas y criterio visual en dispositivo real.

### WEB-040 — Analítica

- Tras la aprobación legal, habilitar Web Analytics en el dashboard del proyecto de Vercel, configurar `ALISTA_WEB_ANALYTICS_ENABLED=1` en Production y volver a desplegar.
- Resolver consentimiento/base legal aplicable a la medición sin cookies.
- Confirmar que el plan admite eventos personalizados y sus propiedades; validar en preview que sólo lleguen rutas y propiedades públicas, sin datos personales ni parámetros de URL.

### WEB-041 — Performance

- Verificar visualmente las variantes adaptativas y el poster en navegador real.
- Repetir LCP, INP y CLS en preview remoto o dispositivo real con red 4G; la línea de base local está documentada arriba.
- Confirmar el presupuesto final de JavaScript con el analizador de Next antes del lanzamiento.

### WEB-042 — Accesibilidad y responsive

- Ejecutar el guion de `docs/WEB_ACCESSIBILITY_AUDIT.md`.
- Validar teclado y VoiceOver en Safari.
- Medir contraste sobre video y fondos de color.
- Mobile angosto, mobile grande, tablet y desktop.
- Zoom de texto y orientación.

### WEB-043 — Cierre

- Tomar `docs/WEB_LAUNCH_AUDIT.md` como checklist de salida.
- Recorrido visual completo con el owner.
- Corregir ritmo, crop, tipografía, spacing y motion.
- Confirmar que no queden claims no demostrables.
- Registrar aprobación final mobile y desktop.

## 6. Decisiones todavía abiertas

- Precio por evento, packs, suscripción o inclusión dentro del servicio profesional.
- Alcance real de pagos y conciliación; no convertir Alista en fintech sin decisión de negocio y revisión legal.
- Revisión legal final de privacidad, términos, imágenes de menores, pagos y analítica.
- Consentimiento y alcance de publicación del material real de Dharma.
- Métricas y testimonios: no publicar hasta contar con fuente, fecha y definición verificables.

## 7. Validación realizada antes del handoff

- `npm run lint` — OK.
- `npm test` — **18 archivos y 259 tests aprobados**.
- `npm run build` — OK con Next.js 16.3.2 y Turbopack.
- `npm audit --omit=dev` — 0 vulnerabilidades conocidas después de actualizar `ws` a 8.21.3.
- El build ya no necesita red para resolver fuentes.
- Las rutas públicas modificadas respondieron HTTP 200 en desarrollo local.

## 8. Cómo retomar en otra computadora

```bash
git pull origin main
npm install
npm run dev
```

Abrir `http://localhost:3000`.

`.env.local` no se versiona. Copiar o recrear las variables necesarias de forma segura antes de probar Supabase, admin, pagos o invitaciones reales.

Leer en este orden:

1. `docs/HANDOFF_NUEVA_WEB_2026-08-24.md`
2. `docs/ALISTA_ESTRATEGIA_NUEVA_WEB.md`
3. `docs/ALISTA_WEB_ART_DIRECTION.md`
4. `docs/Product/ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md`
5. `docs/PLAN_TICKETS_NUEVA_WEB.md`

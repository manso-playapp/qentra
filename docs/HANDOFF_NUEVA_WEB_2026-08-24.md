# Alista — Handoff de nueva web

**Fecha:** 24 de agosto de 2026  
**Rama:** `main`  
**Objetivo:** permitir retomar el trabajo en otra computadora sin reconstruir decisiones ni estado.

## 1. Estado general

La nueva web pública está implementada hasta `WEB-033`. La home, la demo, el caso Dharma, el recorrido para familias, la página para profesionales y las páginas secundarias ya usan la nueva dirección verticalizada en cumpleaños de 15.

El siguiente bloque es la calidad de lanzamiento:

1. `WEB-040` — instrumentación de conversión;
2. `WEB-041` — performance y optimización 4G;
3. `WEB-042` — accesibilidad WCAG 2.2 AA y responsive;
4. `WEB-043` — crítica y pulido visual final.

`WEB-033` está técnicamente completo, pero sus páginas secundarias nuevas todavía necesitan una recorrida visual final del owner en mobile y desktop.

## 2. Decisiones cerradas durante esta implementación

- La web habla específicamente desde el mundo de los cumpleaños de 15.
- Hay dos entradas comerciales: familias y profesionales recurrentes.
- La tipografía de títulos es **Inter Tight**, servida localmente desde `app/fonts/InterTight-Variable.ttf`.
- Nunito se mantiene como tipografía editorial/cuerpo mediante `next/font/google`.
- Los títulos grandes redujeron su escala aproximadamente 25–30 % y usan interletrado moderado (`-0.005em` a `-0.01em`), sin compresión extrema.
- El hero usa `public/hero.mp4` como fondo. Se eliminó la imagen anterior superpuesta o translúcida.
- El logo y el header crecieron aproximadamente 20 % respecto de la primera versión.
- El CTA **Quiero Alista** usa fondo azul corporativo y texto blanco.
- El caso Dharma usa material real y no publica métricas sin fuente.
- La captura de “Alista ya está pasando” se muestra completa con `object-contain`, sin recortar sus bordes.
- En Profesionales, las fechas de eventos separan día y mes dentro de una caja fija de 56 × 56 px para evitar desplazamientos.
- No se publican precios, packs ni planes comerciales no confirmados. `/precios` explica el modelo de propuesta acompañada y deriva según audiencia.
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
| WEB-033 | Implementado; revisión visual final pendiente | Precios y páginas secundarias. |
| WEB-040 | Pendiente | Analítica y consentimiento. |
| WEB-041 | Pendiente | Performance, video, imágenes, fuentes y 4G. |
| WEB-042 | Pendiente | WCAG 2.2 AA y matriz responsive. |
| WEB-043 | Pendiente | Crítica final y aprobación. |

## 5. Próximos pasos concretos

### Primero: revisión visual de WEB-033

Recorrer en desktop y mobile:

- `/precios`
- `/producto`
- `/como-funciona`
- `/seguridad`
- `/casos`
- `/contacto`
- `/privacidad`
- `/terminos`

Revisar especialmente saltos de título, altura de tarjetas, contraste, foco y CTAs.

### WEB-040 — Analítica

- Definir herramienta y consentimiento antes de instalar scripts.
- Documentar eventos para hero, demo, “Ver como”, preparación, check-in, interés familia/profesional, WhatsApp y formularios.
- Medir profundidad y abandono sin registrar datos personales innecesarios.

### WEB-041 — Performance

- `public/hero.mp4` pesa aproximadamente **40,4 MB**: generar versiones web adaptativas, poster y fallback.
- Evaluar carga diferida del caso Dharma, que reutiliza el video.
- Convertir/optimizar imágenes y revisar `sizes`.
- Medir LCP, INP y CLS en build productivo y red 4G.
- Nunito se descarga en build desde Google Fonts; considerar alojarla localmente para builds reproducibles/offline.

### WEB-042 — Accesibilidad y responsive

- Teclado, foco, landmarks, labels y lector de pantalla.
- Contraste sobre video y fondos de color.
- `prefers-reduced-motion` en todas las interacciones.
- Mobile angosto, mobile grande, tablet y desktop.
- Zoom de texto y orientación.

### WEB-043 — Cierre

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
- `npm test` — **16 archivos y 253 tests aprobados**.
- `npm run build` — OK con Next.js 16.2.1 y Turbopack.
- El build necesita red mientras Nunito siga configurada mediante `next/font/google`.
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


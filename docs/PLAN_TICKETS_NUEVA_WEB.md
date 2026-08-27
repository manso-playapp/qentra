# Alista — Tickets para la nueva web

**Fecha:** 24 de agosto de 2026  
**Fuentes obligatorias:** `ALISTA_WEB_ART_DIRECTION.md` y `ALISTA_ESTRATEGIA_NUEVA_WEB.md`  
**Apoyo funcional:** `Product/ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md`  
**Alcance:** diseño, contenido, interacción y frontend de la web pública. El backlog general de producto queda separado en `PLAN_DE_TICKETS.md`.

## Estado de implementación — 24 de agosto de 2026

- `WEB-001` a `WEB-032`: implementados y revisados iterativamente con el owner.
- `WEB-033`: implementación y recorrida Chrome en cinco viewports completas; falta aprobación final del owner en dispositivo real.
- `WEB-040`: Vercel Web Analytics desplegado sólo en rutas públicas y apagado por variable; activación y revisión legal pendientes.
- `WEB-041`: optimización técnica y línea de base móvil local completadas; falta medición en dispositivo/red real e INP representativo.
- `WEB-042`: auditoría automatizada sin infracciones; faltan dispositivo real, Safari/VoiceOver, orientación y contraste sobre frames reales.
- `WEB-043`: auditoría técnica de lanzamiento lista; crítica visual y aprobaciones pendientes.
- Handoff detallado: [`HANDOFF_NUEVA_WEB_2026-08-24.md`](./HANDOFF_NUEVA_WEB_2026-08-24.md).

---

## 1. Resultado esperado

La web debe producir dos sensaciones consecutivas:

1. **“Quiero esto para mis 15.”**
2. **“Además, esto me resuelve un montón de cosas.”**

No se planifica como una landing SaaS compuesta por hero, bento y cards repetidas. Se planifica como una secuencia que cambia de lenguaje:

```text
Campaña editorial y evento real
              ↓
Demostración interactiva
              ↓
Producto operativo y evidencia
              ↓
Recorrido familia / profesionales
              ↓
Conversión
```

---

## 2. Estado actual que se puede reutilizar

### Conservar como base técnica

- Next.js App Router, layout, metadata, sitemap y robots.
- Componentes UI primitivos y estilos globales.
- Rutas existentes de producto, contacto, demo, casos, precios y legales.
- Superficies reales de invitación, panel, pagos, QR y puerta como fuente de fidelidad visual.
- Formularios y componentes de navegación, si se reestilizan dentro del nuevo sistema.

### Replantear o reemplazar

- home orientada a eventos genéricos, egresados, control y cupo;
- `FestiveBackdrop` y recursos decorativos que se alejen del material real;
- hero en dos columnas con panel SaaS;
- grillas repetidas de capacidades/cards;
- metadata y páginas que comunican una plataforma horizontal;
- números de ejemplo que parezcan evidencia real;
- página de precios: publicar el precio de lanzamiento familiar y mantener la propuesta profesional bajo consulta hasta cerrar los packs.

---

## 3. Prioridad y tamaño

- **P0:** necesario para validar dirección o lanzar sin contradicciones.
- **P1:** necesario para la versión completa de la nueva web.
- **P2:** mejora posterior basada en uso.
- **S:** acotado; **M:** varias piezas; **L:** slice transversal.

Cada ticket visual se considera terminado solo después de revisar mobile y desktop en navegador real. No se aprueban secciones únicamente desde código o capturas estáticas.

---

## 4. Fase 0 — Insumos y decisiones creativas

### WEB-001 — Inventario de assets reales y caso Dharma

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ninguna

**Objetivo:** saber con qué material auténtico se puede construir hero, transiciones y caso real.

**Criterios de aceptación:**

- inventario de videos y fotos con resolución, orientación, duración y momento mostrado;
- derechos/consentimientos confirmados, especialmente por imágenes de menores;
- selección de tomas de llegada, amigas/os, familia, baile, acceso y energía;
- métricas de Dharma con fuente verificable;
- lista de faltantes que requieran edición, nueva captura o recurso conceptual.

### WEB-002 — Arquitectura narrativa y mapa de conversión

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ninguna

**Objetivo:** cerrar el recorrido antes de diseñar componentes.

**Criterios de aceptación:**

- orden definitivo de secciones y propósito de cada una;
- transición explícita campaña → demo → producto → evidencia → conversión;
- recorrido familia y recorrido profesional identificados;
- CTA primario/secundario y destino real definidos;
- se decide qué páginas actuales se reescriben, redirigen o eliminan;
- cada sección responde qué debe entender, sentir o hacer el visitante.

### WEB-003 — Copy deck vertical para toda la web

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** WEB-002

**Objetivo:** reemplazar el lenguaje genérico antes de maquetar.

**Criterios de aceptación:**

- hero, timeline, demos, WhatsApp, preparación, pagos, llegada, Dharma, profesionales y cierre tienen copy aprobado;
- lenguaje natural de 15: cena, trasnoche, familia, amigas/os, entrada y esa noche;
- estructura problema → mecanismo → resultado → emoción;
- no usa “plataforma definitiva”, “360”, jerga SaaS ni seguridad como territorio central;
- claims de producto clasificados como real, próximo o conceptual.

### WEB-004 — Sistema visual base de Alista web

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** WEB-001, WEB-003

**Objetivo:** traducir la dirección de arte a reglas implementables.

**Criterios de aceptación:**

- familias tipográficas y licencias definidas, con escala fluida mobile/desktop;
- base cromática neutral y reglas para que “la fiesta coloree”;
- grilla, espacios, radios, capas, crops y densidades definidos;
- patrones editoriales asimétricos que evitan repetir “título + tres cards”;
- tokens implementables en CSS sin heredar el look shadcn por defecto;
- ejemplos de convivencia entre video, fotografía y UI real;
- prueba de contraste WCAG 2.2 AA para combinaciones funcionales.

### WEB-005 — Lenguaje de motion y prototipo de transición

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** WEB-002, WEB-004

**Objetivo:** validar el movimiento como narrativa antes de distribuir animaciones por toda la web.

**Criterios de aceptación:**

- reglas de duración, easing, entrada, salida y cambio de estado;
- prototipo de antes → esa noche o timeline invertido;
- propuesta de freeze/reanudación de video y revelado de producto;
- comportamiento alternativo con `prefers-reduced-motion`;
- no hay scroll hijacking, partículas, blobs ni parallax indiscriminado;
- presupuesto de JS y librerías acordado.

---

## 5. Fase 1 — Primer slice visual validable

### WEB-010 — Shell global, navegación y SEO vertical

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** WEB-002, WEB-004

**Objetivo:** preparar el marco de la nueva experiencia sin conservar el posicionamiento anterior.

**Criterios de aceptación:**

- header y footer responden a familia/profesionales y no a categorías genéricas;
- navegación usable con teclado y móvil;
- títulos, descriptions, OG, canonical, sitemap y schema hablan de cumpleaños de 15;
- rutas retiradas tienen redirect definido;
- legales y privacidad siguen accesibles;
- el shell no introduce fondos AI, glassmorphism o estética SaaS genérica.

### WEB-011 — Hero audiovisual full-bleed

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** WEB-001, WEB-003, WEB-004, WEB-005, WEB-010

**Objetivo:** detener, identificar la categoría y generar deseo en un gesto.

**Criterios de aceptación:**

- video real full-bleed con poster inmediato y fallback;
- headline, bajada, CTA familia y CTA profesional visibles y legibles;
- comunica 15, autenticidad, preparación y existencia de producto;
- composición diseñada primero para móvil y reinterpretada para desktop;
- video no funciona como decoración genérica;
- autoplay, mute, pausa y reduced motion resueltos correctamente;
- LCP no depende de descargar el video completo.

### WEB-012 — Timeline invertido “Pero esto no empezó acá”

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** WEB-005, WEB-011

**Objetivo:** conectar la energía de esa noche con todo lo preparado antes.

**Criterios de aceptación:**

- recorrido desde la fiesta hacia 2/7/12/20/30 días antes;
- confirmaciones, restricciones, grupos, pagos y accesos se entienden sin definición abstracta;
- motion muestra anticipación y estados que se completan;
- scroll sigue siendo natural y controlable;
- alternativa estática clara para reduced motion;
- funciona con touch y conserva ritmo editorial en desktop.

### WEB-013 — Hito de crítica visual con el owner

**Prioridad:** P0 · **Tamaño:** S · **Dependencias:** WEB-010, WEB-011, WEB-012

**Objetivo:** validar identidad y ritmo antes de construir el resto de la home.

**Criterios de aceptación:**

- preview navegable compartida en móvil y desktop;
- revisión usando las diez preguntas del filtro visual del documento de arte;
- comentarios clasificados en bloqueante, importante y pulido;
- dirección aprobada o iterada antes de WEB-020 en adelante;
- se conserva un registro corto de decisiones para evitar regresiones estéticas.

---

## 6. Fase 2 — La web como demo

### WEB-020 — Escenario de teléfono reutilizable

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** WEB-004, WEB-013

**Objetivo:** usar el teléfono como objeto narrativo para varias situaciones sin caer en el mockup flotante permanente.

**Criterios de aceptación:**

- contenedor flexible para invitación, WhatsApp, RSVP, pago, QR y personalización;
- se integra en composiciones distintas, no siempre centrado;
- gestos y estados accesibles con touch, teclado y lector;
- no imita una marca/modelo de teléfono de forma innecesaria;
- UI mostrada es real o fiel al producto.

### WEB-021 — Demo invitación → RSVP → “el otro lado”

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** WEB-020

**Objetivo:** demostrar temprano cómo una interacción prepara la llegada.

**Criterios de aceptación:**

- “Dharma te invita a sus 15” inicia una interacción breve;
- Familia Pérez puede confirmar integrantes y una restricción;
- la transición revela confirmados, acceso, restricción, invitación y QR;
- no persiste datos personales ni toca un evento real;
- se puede reiniciar y completar con teclado/touch;
- la experiencia está presente antes del tercer viewport o su equivalente narrativo.

### WEB-022 — Momento WhatsApp personal

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** WEB-003, WEB-020

**Objetivo:** presentar el envío personal como ventaja humana.

**Criterios de aceptación:**

- secuencia Dharma → WhatsApp → Martina → Alista;
- contacto conocido, texto editable, preview y link personalizado visibles;
- copy “La invitación sale de quien tiene que salir”;
- no representa a Alista como bot ni promete tracking inexistente;
- animación explica la relación entre remitente y plataforma.

### WEB-023 — Recorrido Invitá → Confirmá → Conocé → Prepará → Cobrá → Recibí

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** WEB-021, WEB-022

**Objetivo:** presentar situaciones conectadas en lugar de una grilla de features.

**Criterios de aceptación:**

- cada etapa tiene un ejemplo visual concreto y no una card genérica;
- Cena, Trasnoche y Trasnoche con entrada aparecen como lenguaje natural del vertical;
- pago se expresa como resolver comprobantes y habilitar acceso, sin jerga técnica;
- la composición cambia de ritmo entre etapas;
- producto y campaña se mezclan gradualmente, sin corte a dashboard SaaS.

### WEB-024 — Demo “Tus 15. Tu Alista.” / Ver como…

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** WEB-004, WEB-020

**Objetivo:** hacer visible la personalización visual, de contenido y contextual.

**Criterios de aceptación:**

- al menos tres universos creíbles: editorial oscuro, soft contemporáneo y pop/neón controlado;
- cambiar universo modifica color, tipo, media y atmósfera sin alterar la estructura UX;
- selector Martina/Colegio, Familia Pérez/Cena y Tomás/Trasnoche paga cambia la información;
- se muestra una interacción contextual basada en algo aprendido antes;
- ninguna variante cae en princesa, cotillón o saturación permanente.

### WEB-025 — Centro de Preparación como momento protagonista

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** WEB-003, WEB-004

**Objetivo:** revelar la seriedad operativa del producto sin recurrir a dashboards decorativos.

**Criterios de aceptación:**

- interfaz amplia con “¿Está todo listo?”;
- confirmados, pagos, grupos, restricciones, QR, MP y recepción se ven accionables;
- “Necesita tu atención” muestra cambios y CTA concretos;
- si hay porcentaje, sus factores son comprensibles;
- visualmente pertenece a Alista aunque el lenguaje sea más de producto;
- datos de demo están rotulados y no se presentan como métricas Dharma.

### WEB-026 — Check-in grupal como gesto

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** WEB-020, WEB-023

**Objetivo:** explicar el diferencial de grupo sin texto técnico.

**Criterios de aceptación:**

- escaneo seguido de Familia Pérez · 3 personas;
- María, Tomás y Juana visibles;
- acción “Ingresan los 3” y resultado inmediato;
- copy “Llegan juntos. Entran juntos.”;
- estado claro, rápido y legible en móvil;
- no usa un QR gigante como símbolo decorativo.

---

## 7. Fase 3 — Evidencia, audiencias y conversión

### WEB-030 — Caso Dharma editorial

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** WEB-001, WEB-004, WEB-013

**Objetivo:** demostrar que Alista ya opera en eventos reales.

**Criterios de aceptación:**

- combina video/foto, secuencia, producto y métricas comprobables;
- tratamiento editorial, no testimonial card;
- ninguna cifra inventada o extrapolada;
- muestra relación entre preparación y experiencia final;
- assets responsive y con texto alternativo adecuado;
- consentimiento y privacidad documentados.

### WEB-031 — Bloque y página “Alista para profesionales”

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** WEB-002, WEB-003, WEB-013

**Objetivo:** convertir planners, salones y productoras sin romper la identidad de marca.

**Criterios de aceptación:**

- home incluye un bloque B2B fuerte;
- página propia explica recurrencia, múltiples eventos, plantillas, equipo y diferenciación;
- frase “Todos nuestros 15 incluyen Alista” puesta en contexto comercial;
- se usan interfaces o evidencias reales;
- no deriva en estética empresarial gris ni planes por seats;
- CTA profesional tiene destino real y seguimiento.

### WEB-032 — Recorrido familia y CTA final

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** WEB-002, WEB-003, WEB-013

**Objetivo:** cerrar la promesa para familia/quinceañera con una acción honesta.

**Criterios de aceptación:**

- recorrido habla de tranquilidad, identidad, confirmaciones, entradas y llegada;
- CTA final elegido entre las variantes estratégicas y usado consistentemente;
- no obliga a pagar antes de entender el producto;
- si el autoservicio no existe, deriva a demo/contacto sin simular creación de evento;
- estado de formulario y confirmación son verificables.

### WEB-033 — Resolver precios y páginas secundarias

**Prioridad:** P0 de publicación · **Tamaño:** M · **Dependencias:** WEB-002, decisión comercial

**Objetivo:** evitar que el sitio viejo contradiga la nueva home.

**Criterios de aceptación:**

- precio familiar por evento y descuento de lanzamiento están definidos; los packs profesionales se publican cuando queden cerrados;
- producto, cómo funciona, casos, demo, contacto, seguridad y FAQs se reescriben o redirigen;
- egresados y eventos genéricos dejan de ser el mensaje de entrada;
- ninguna página secundaria conserva el look anterior por accidente;
- legales se revisan ante imágenes de menores, pagos y analítica.

---

## 8. Fase 4 — Calidad de lanzamiento

### WEB-040 — Instrumentación de conversión y aprendizaje

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** WEB-021 a WEB-033

**Objetivo:** medir si la nueva narrativa atrae, explica y convierte.

**Estado técnico — 24 de agosto de 2026:** contrato tipado e instrumentación local implementados para CTAs, formularios, demos y alcance de secciones. Vercel Web Analytics está montado exclusivamente en el layout de marketing: recibe pageviews y el contrato local `alista:marketing-analytics`, sin cubrir Admin, invitaciones ni rutas con tokens. La integración ya está en la producción `Ready`, pero no carga Insights hasta que `ALISTA_WEB_ANALYTICS_ENABLED=1` se configure para Production. KPIs, catálogo, guardrails y procedimiento de activación están documentados en [`WEB_ANALYTICS_PLAN.md`](./WEB_ANALYTICS_PLAN.md). Falta habilitar el producto en Vercel, comprobar los límites del plan para eventos personalizados y resolver la revisión legal/base de consentimiento aplicable.

**Criterios de aceptación:**

- CTR de ambos CTAs del hero;
- demo iniciada, pasos y finalización;
- interacción con Ver como, Preparación y check-in;
- interés familia/profesional, WhatsApp y formulario;
- profundidad y abandono por sección;
- privacidad/consentimiento resueltos y nombres de eventos documentados.

### WEB-041 — Presupuesto de performance y optimización 4G

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** WEB-011, WEB-021, WEB-024, WEB-030

**Objetivo:** mantener impacto visual sin convertirlo en peso.

**Estado técnico — 24 de agosto de 2026:** video adaptativo, poster, carga diferida del caso Dharma y fuentes locales implementados. El payload audiovisual disponible bajó de 40,4 MB a 4,7 MB sumando ambas variantes y el poster. Presupuestos actuales: hasta 3,5 MB para video desktop, 1,1 MB para video mobile, 200 KB para poster y 100 KB combinados para las dos fuentes latinas. En build productivo local, Chromium 390 × 844 / DPR 2 / 4× CPU / 150 ms RTT / 1,6 Mbps, las cargas frías de la home registraron FCP entre 1,080 y 2,592 s, LCP entre 2,388 y 3,004 s (poster) y CLS 0; una muestra transfirió 503 KB. El caso Dharma difiere poster y video hasta acercarse al bloque, y el QR no se precarga en la home. Falta contrastar la línea de base contra dispositivo/red real y medir INP en una interacción representativa.

**Criterios de aceptación:**

- budgets para JS, video, imágenes y fuentes;
- video adaptativo, poster y fallback probados;
- responsive images, lazy load y preload selectivo;
- animaciones no bloquean main thread;
- medición móvil de LCP, INP y CLS en build productivo;
- recorrido útil con red lenta y video deshabilitado.

### WEB-042 — Auditoría WCAG 2.2 AA y responsive

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** WEB-021 a WEB-033

**Objetivo:** asegurar que la dirección editorial no sacrifique uso real.

**Estado técnico — 24 de agosto de 2026:** implementados enlace de salto, navegación móvil operable con teclado, foco reforzado, targets táctiles, contraste de textos críticos y cobertura global/dinámica de `prefers-reduced-motion`. Chrome + Axe no informaron infracciones en las once rutas públicas a 390 px; las once soportan texto emulado a 200 % y 400 % a 320 px sin overflow, y los controles de home superan 24 × 24 px en móvil y desktop. La auditoría y el guion manual están en [`WEB_ACCESSIBILITY_AUDIT.md`](./WEB_ACCESSIBILITY_AUDIT.md). Falta ejecutar la matriz en dispositivo real, Safari/VoiceOver, orientación y contraste sobre frames reales antes de declarar conformidad o cerrar el ticket.

**Criterios de aceptación:**

- teclado, foco, landmarks, labels y lector de pantalla;
- contraste y legibilidad sobre video/fotografía;
- reduced motion cubre toda interacción relevante;
- touch targets y bottom sheets revisados;
- pruebas en móviles angostos, móviles grandes, tablet y desktop;
- zoom de texto y orientación no rompen el contenido.

### WEB-043 — Loop final de crítica, pulido y aprobación

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** WEB-040, WEB-041, WEB-042

**Objetivo:** cerrar la web mediante evaluación visual real con el owner.

**Estado técnico — 24 de agosto de 2026:** auditoría de rutas, metadata, canonicals, sitemap, robots, anchors e iconos completada; resultados en [`WEB_LAUNCH_AUDIT.md`](./WEB_LAUNCH_AUDIT.md). Se corrigieron las raíces privadas de `robots.txt`, metadata genérica de demo/contacto, canonicals legales, sitemap y Apple touch icon. Falta la crítica visual real, la matriz manual de accesibilidad/performance y las aprobaciones legal/comercial; el ticket no se considera cerrado.

**Criterios de aceptación:**

- revisión completa en preview productiva;
- cada sección pasa el filtro de diez preguntas de arte;
- inconsistencias de tipografía, crop, ritmo, spacing y motion corregidas;
- no quedan bento genérico, gradients AI, glass excesivo, iconos protagonistas ni shadcn default;
- claims contrastados con el producto real;
- aprobación final mobile y desktop registrada.

---

## 9. Orden recomendado de ejecución

### Primer corte: validar que “se siente Alista”

1. WEB-001 — assets Dharma.
2. WEB-002 — arquitectura narrativa.
3. WEB-003 — copy deck.
4. WEB-004 — sistema visual.
5. WEB-005 — motion.
6. WEB-010 — shell.
7. WEB-011 — hero.
8. WEB-012 — timeline.
9. WEB-013 — crítica con owner.

### Segundo corte: demostrar el producto

10. WEB-020 a WEB-026.

### Tercer corte: evidencia y conversión

11. WEB-030 a WEB-033.

### Cuarto corte: lanzar

12. WEB-040 a WEB-043.

No conviene construir toda la home antes de WEB-013. Si hero + timeline no alcanzan la identidad buscada, se corrige el sistema antes de multiplicarlo por el resto del sitio.

---

## 10. Dependencias externas que pueden bloquear

- material Dharma y autorización de uso;
- métricas reales del caso;
- selección/licencia tipográfica;
- destino de los CTA familia/profesional;
- validación comercial del precio de lanzamiento y definición de packs profesionales;
- definición de qué capacidades son reales, próximas o conceptuales;
- acceso del owner al preview para los hitos WEB-013 y WEB-043.

---

## 11. Fuera de alcance de este backlog

- reconstrucción del modelo de datos del producto;
- implementación completa de grupos, OAuth MP u offline de puerta;
- app nativa;
- editor libre tipo Canva;
- campaña de redes;
- generación masiva de material ficticio para reemplazar evidencia real;
- features de producto que no sean necesarias para una demo fiel.

Esas capacidades están en `PLAN_DE_TICKETS.md`. La web solo puede demostrarlas como disponibles cuando existan; de lo contrario deben identificarse como próximas o conceptuales.

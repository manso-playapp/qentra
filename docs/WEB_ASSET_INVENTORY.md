# Alista — Inventario inicial de assets web

**Fecha de revisión:** 24 de agosto de 2026

## Disponible en el repositorio

| Asset | Uso actual/propuesto | Observación |
|---|---|---|
| `public/hero.mp4` | Video de fondo del hero y material del caso Dharma | MP4 de 40,4 MB y 38 segundos. Integrado sin audio, con reproducción inline y pausa visible en el caso. Resolución/orientación pendiente de registrar. Conviene generar una versión web optimizada antes de producción. |
| `public/portada.jpg` | Invitación Dharma | Pieza vertical 1080×1920. Ya no se usa en el hero de la home. |
| `public/caso-dharma-acceso.png` | Evidencia visual del bloque “Alista ya está pasando” | Captura vertical 488×794 de una validación real de acceso QR durante el evento. Se muestra completa, sin recorte. |
| `public/alista-logo.svg` | Logo sobre fondos claros | Disponible. |
| `public/alista-logo-white.svg` | Header/footer oscuros | Disponible. |
| `public/alista-mark.svg` | Marca reducida | Disponible. |
| `public/Party.mp3` | Invitación existente | No se usa automáticamente en la web pública. Requiere confirmar licencia antes de cualquier uso comercial. |

## No encontrado en `public`

- fotografías documentales de llegada, familia, amigas/os, baile o recepción;
- poster horizontal extraído del video real;
- métricas verificadas del caso Dharma;
- documento de consentimiento/derechos de imagen.

## Decisión de implementación

La home usa `hero.mp4` como fondo audiovisual del hero y como material real dentro del caso editorial. Mientras carga, el fondo permanece oscuro. La interfaz no presenta números de demo como métricas del caso Dharma.

El estado de autorización, las medidas de minimización y los bloqueos previos a producción están registrados en [`DHARMA_CASE_PRIVACY.md`](./DHARMA_CASE_PRIVACY.md).

## Próximo insumo requerido

Completar la entrega audiovisual con:

- autorización de uso;
- versión web comprimida del video;
- poster horizontal extraído del video;
- selección de momentos permitidos;
- métricas con fuente verificable;
- cualquier restricción sobre rostros o menores.

# Alista — Inventario inicial de assets web

**Fecha de revisión:** 24 de agosto de 2026

## Disponible en el repositorio

| Asset | Uso actual/propuesto | Observación |
|---|---|---|
| `public/hero-desktop.mp4` | Video de fondo en pantallas medianas y grandes | MP4 H.264 · 568×320 · 3,3 MB · 38,6 segundos. Se carga después del poster. |
| `public/hero-mobile.mp4` | Variante 4G para mobile | MP4 H.264 · 400×224 · 1,0 MB · 38,6 segundos. Seleccionada con `media` antes de iniciar la descarga. |
| `public/hero-poster.jpg` | Fallback estático y primer render del hero/caso | JPG horizontal · 1280×720 · 184 KB. Permanece visible con movimiento reducido o video no disponible. |
| `public/portada.jpg` | Invitación Dharma | Pieza vertical 1080×1920. Ya no se usa en el hero de la home. |
| `public/caso-dharma-acceso.png` | Evidencia visual del bloque “Alista ya está pasando” | Captura vertical 488×794 de una validación real de acceso QR durante el evento. Se muestra completa, sin recorte. |
| `public/alista-logo.svg` | Logo sobre fondos claros | Disponible. |
| `public/alista-logo-white.svg` | Header/footer oscuros | Disponible. |
| `public/alista-mark.svg` | Marca reducida | Disponible. |
| `public/Party.mp3` | Invitación existente | No se usa automáticamente en la web pública. Requiere confirmar licencia antes de cualquier uso comercial. |

## No encontrado en `public`

- fotografías documentales de llegada, familia, amigas/os, baile o recepción;
- métricas verificadas del caso Dharma;
- documento de consentimiento/derechos de imagen.

## Decisión de implementación

La home usa variantes adaptativas del material real como fondo audiovisual del hero y dentro del caso editorial. El hero habilita el video después del primer render; el caso Dharma lo difiere hasta acercarse al viewport. Si la persona prefiere movimiento reducido, sólo se muestra el poster. La interfaz no presenta números de demo como métricas del caso Dharma.

El estado de autorización, las medidas de minimización y los bloqueos previos a producción están registrados en [`DHARMA_CASE_PRIVACY.md`](./DHARMA_CASE_PRIVACY.md).

## Próximo insumo requerido

Completar la entrega audiovisual con:

- autorización de uso;
- selección de momentos permitidos;
- métricas con fuente verificable;
- cualquier restricción sobre rostros o menores.

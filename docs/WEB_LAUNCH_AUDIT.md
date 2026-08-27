# Alista web — auditoría técnica de lanzamiento

**Fecha:** 24 de agosto de 2026
**Ticket:** WEB-043
**Alcance:** cierre técnico verificable sin reemplazar la crítica visual del owner

## Verificado

- Las once rutas públicas canónicas responden HTTP 200: home, producto, cómo funciona, casos, profesionales, precios, seguridad, demo, contacto, privacidad y términos.
- `alista.com.ar` redirige correctamente a `www.alista.com.ar`; ambas direcciones públicas devuelven la home sin requerir login de Vercel.
- La producción actual `dpl_EYJt18GaAd9DdYFfs6kH1tGseiJy` respondió HTTP 200 en home, Dharma, demo y profesionales, sin errores de consola ni overflow en móvil.
- Cada ruta pública tiene título y descripción propios.
- Todas las rutas públicas tienen canonical absoluto bajo `https://alista.com.ar`.
- El sitemap contiene exactamente esas once rutas y no publica fechas sintéticas que cambiarían en cada generación.
- `robots.txt` permite la web pública y bloquea desde la raíz admin, API, acceso, invitaciones, puerta, links operativos, test y tótem.
- Las superficies no públicas principales también declaran `noindex, nofollow` mediante metadata.
- Open Graph responde correctamente y la app expone favicon SVG y Apple touch icon PNG de 180 × 180.
- Los anchors usados por header y CTAs existen en sus páginas de destino.
- La metadata de demo y contacto usa voseo y el posicionamiento vertical de cumpleaños de 15.
- Las ocho páginas secundarias pasaron una matriz Chrome de cinco viewports sin overflow ni errores de render; el menú móvil y el texto al 200 % conservan las acciones visibles.
- ESLint, 259 tests unitarios y build productivo pasan con Next.js 16.3.2.
- La auditoría de dependencias de producción informa 0 vulnerabilidades conocidas.

## Pendiente antes de publicar

- Ejecutar los pendientes manuales de `WEB_ACCESSIBILITY_AUDIT.md`: dispositivo real, Safari/VoiceOver, orientación y contraste sobre frames reales.
- Repetir LCP, INP y CLS en preview remoto o dispositivo móvil real con 4G: ya existe una línea de base local de la home (FCP 1,080–2,592 s, LCP 2,388–3,004 s y CLS 0 bajo 1,6 Mbps / 150 ms RTT / CPU 4×), pero no reemplaza datos de campo ni INP representativo.
- Hacer la crítica visual final con el owner: ritmo, crops, títulos, spacing y estados interactivos.
- Validar consentimiento para publicar el material real del caso Dharma.
- Obtener revisión legal profesional de privacidad, términos, menores, pagos y analítica.
- Habilitar Vercel Web Analytics después de resolver consentimiento/base legal, configurar `ALISTA_WEB_ANALYTICS_ENABLED=1` en Production, volver a desplegar y confirmar que el plan admite el catálogo de eventos personalizados.
- Verificar la publicación del precio de lanzamiento ($89.000, 50% sobre lista de $178.000) y el alcance real de pagos antes de cerrar la auditoría comercial.

## Criterio de salida

La web no debe declararse aprobada para publicación sólo con esta auditoría técnica. WEB-043 se cierra cuando las validaciones visuales/manuales no tengan bloqueantes y las decisiones legales/comerciales estén registradas.

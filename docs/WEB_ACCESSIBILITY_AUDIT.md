# Alista web — auditoría de accesibilidad y responsive

**Fecha:** 24 de agosto de 2026
**Ticket:** WEB-042
**Referencia:** WCAG 2.2 nivel AA

## Estado

La pasada estática, la auditoría automatizada en Chrome y las correcciones de código están implementadas. Esto no constituye todavía una declaración de conformidad WCAG: falta la validación manual en dispositivo real, Safari/VoiceOver, orientación y contraste sobre frames reales de video o fotografía.

## Cubierto por código

- Landmarks de `header`, navegación, `main` y `footer`, con enlace visible al foco para saltar al contenido principal.
- Navegación principal disponible también en móvil mediante controles HTML nativos; se opera con teclado, se cierra con `Escape` y devuelve el foco al disparador.
- Indicadores de foco explícitos en navegación, CTAs, formularios y demos interactivas.
- Botones y acciones principales con targets de al menos 44 px; la revisión automatizada no encontró controles visibles por debajo del mínimo WCAG 2.2 de 24 × 24 px en móvil ni desktop.
- Formularios con labels programáticos, mensajes de estado y campos nativos.
- Demos con botones reales, estados `aria-pressed`, regiones `aria-live` y foco programático para anunciar cambios relevantes.
- Video decorativo oculto a tecnología asistiva y video del caso Dharma con nombre y control de reproducción accesible.
- `prefers-reduced-motion` desactiva animaciones y transiciones, evita el scroll suave y descarga/reproduce el video solamente cuando la preferencia lo permite. Los cambios de preferencia se escuchan en tiempo real.
- Se reforzó el contraste de navegación, footer y textos secundarios claramente tenues. Axe no detectó infracciones en las rutas públicas; falta medir las capas sobre los frames reales de video o fotografía.
- Todas las páginas públicas tienen un `h1` y metadata descriptiva; Next.js puede anunciar las transiciones de ruta a partir del título.
- No hay bottom sheets en el alcance actual de la web pública.

## Matriz de validación

| Prueba | Viewport / entorno | Estado |
|---|---|---|
| Mobile angosto | 320 × 568 | Chrome automatizado OK; texto 200 % y 400 % sin overflow; dispositivo real pendiente |
| Mobile habitual | 390 × 844 | Chrome + Axe automatizados OK; dispositivo real pendiente |
| Tablet vertical | 768 × 1024 | Chrome automatizado OK; dispositivo real pendiente |
| Tablet horizontal | 1024 × 768 | Chrome automatizado OK; dispositivo real pendiente |
| Desktop | 1440 × 900 | Chrome automatizado, capturas y targets OK; aprobación owner pendiente |
| Reflow | zoom 200 % y 400 % | 320 px con texto 200 % y 400 % sin overflow; zoom real pendiente |
| Texto ampliado | tamaño de texto del sistema/navegador | Emulación de texto 200 % y 400 % OK; ajuste real del sistema pendiente |
| Orientación | portrait y landscape | Pendiente |
| Teclado | Safari y Chrome, recorrido completo | Skip link, menú, primer enlace y Escape OK en Chrome; recorrido Safari pendiente |
| Lector de pantalla | VoiceOver + Safari | Pendiente |
| Contraste | texto, foco, controles, video y fondos con alpha | Axe sin infracciones en 11 rutas a 390 px; frames reales pendientes |
| Movimiento reducido | carga inicial y cambio en vivo | Chrome automatizado OK: poster estable, sin MP4 y pausa ante cambio en vivo; plataforma real pendiente |

## Guion de verificación manual

1. Recorrer header, navegación móvil, contenido, demos, formularios y footer usando sólo `Tab`, `Shift+Tab`, `Enter`, `Space` y `Escape`.
2. Confirmar que el foco nunca queda oculto detrás del header sticky ni se pierde al cambiar estados de las demos.
3. Comprobar que cada ruta anuncia un título útil con VoiceOver y que el orden de headings describe el contenido.
4. Medir contraste con el frame más claro y el más oscuro del hero, además de todos los fondos con transparencia.
5. Verificar que 320 px y zoom 400 % no produzcan scroll horizontal bidimensional ni oculten acciones.
6. Activar “Reducir movimiento” antes de cargar y durante la sesión; confirmar poster estable, video detenido y ausencia de desplazamientos animados.
7. Probar orientación horizontal, teclado virtual en formularios y targets táctiles con un dispositivo real.

## Evidencia automatizada — 24 de agosto de 2026

- Las once rutas públicas respondieron HTTP 200 y Axe no informó infracciones en Chrome móvil 390 × 844.
- Todas las rutas evaluadas tienen un único `main` y `h1`, contenido visible, cero errores de consola y cero overflow horizontal.
- El menú móvil queda dentro del viewport en 320 y 390 px; `Escape` lo cierra y devuelve el foco al disparador.
- El enlace de salto recibe foco, lleva a `#contenido-principal` y los controles visibles de home miden al menos 24 × 24 px en 390 × 844 y 1440 × 900.
- El formulario de contacto se opera con labels nativos y anuncia la consulta preparada mediante `role="status"`.
- El texto emulado al 200 % y al 400 % no produjo overflow horizontal en las once rutas a 320 px.
- Con `prefers-reduced-motion`, la home conserva el poster, no solicita MP4 y pausa/retira la fuente del video si la preferencia cambia durante la sesión.

## Criterio de cierre

WEB-042 queda listo para cierre cuando la matriz manual no tenga bloqueantes, las incidencias se corrijan y se registre evidencia breve de mobile, desktop, teclado y VoiceOver.

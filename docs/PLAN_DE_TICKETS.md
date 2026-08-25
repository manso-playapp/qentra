# Alista — Plan de tickets

**Fecha:** 24 de agosto de 2026  
**Fuentes:** `ALISTA_ESTRATEGIA_NUEVA_WEB.md` y `Product/ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md`  
**Alcance:** producto, operación, nueva web pública y preparación de lanzamiento.

> La planificación detallada de arte, UX y frontend de la nueva web vive en
> `PLAN_TICKETS_NUEVA_WEB.md`. Este archivo queda como backlog maestro de producto
> y dependencias funcionales.

---

## 1. Resultado del relevamiento

El repositorio no parte de cero. Ya existe una base funcional para crear eventos, cargar invitados, enviar invitaciones, recibir RSVP, cobrar con Mercado Pago, emitir QR, operar la puerta y auditar ingresos. El trabajo debe evolucionar esa base, no reescribirla.

La brecha principal no es visual: el producto actual modela principalmente **un registro de invitado con acompañantes serializados**, mientras que la nueva definición canónica exige **grupo de invitación como unidad operativa y personas individuales dentro del grupo**. Esa migración condiciona RSVP, pagos, QR, check-in, preparación, personalización y demos de la web.

### Inventario resumido

| Frente | Estado actual | Brecha contra Docs |
|---|---|---|
| Evento | CRUD, fecha, venue, capacidad y tipos de evento existentes | Falta modalidad privada/abierta/mixta y una configuración vertical por defecto para 15 |
| Invitados | Un `guest` principal con acompañantes guardados parcialmente en `notes` | Falta entidad de grupo, integrantes reales y separación entre grupo, persona y segmento |
| Accesos | Tipos configurables con horario y precio | Falta convertirlos en plantillas Cena/Trasnoche/Trasnoche con entrada y separar reglas de pago, horario y cupo |
| Invitación/RSVP | Link sin cuenta, sí/no, acompañantes y restricciones | Es individual y el formulario no se configura por segmento/modalidad; falta continuidad por grupo |
| WhatsApp | Envío manual desde teléfono propio y automatización Twilio | Falta Centro de invitaciones, estados honestos y modo reducido para la quinceañera; el número Twilio productivo no es prioridad estratégica |
| Pagos | Checkout, webhook, conciliación y QR luego de aprobación | OAuth por receptor real implementado en código; falta prueba externa real, cortesías y cierre/cupo de venta |
| Puerta | QR, búsqueda, validaciones, override, historial y reversión | Falta check-in real por integrantes del grupo, alta excepcional completa y modo degradado con cola/sincronización |
| Preparación | Primer porcentaje y lista de invitaciones/confirmaciones/pagos pendientes | Falta definición transparente, pendientes más ricos, cambios y acciones específicas |
| Roles | Admin, puerta y supervisor globales | Falta alcance por evento y UX diferenciada para quinceañera, familia y profesional |
| Personalización | Colores, imágenes, mensajes y preview básico | Falta sistema curado de universos, contenido por segmento, contexto y “Ver como…” |
| Importación | CSV tolerante a algunos encabezados y exportación CSV | Falta XLSX, mapeo asistido, validación previa, duplicados y fusión |
| Web pública | Sitio completo, pero orientado a eventos genéricos/egresados y control de puerta | Debe reconstruirse alrededor de 15, preparación, demos reales, dos recorridos y caso Dharma |

### Conflictos que deben corregirse

1. `Docs/README_AGENT_CONTEXT.md` y los archivos de contexto raíz esperan documentos y rutas en minúscula que no existen en esta estructura.
2. La web y el SEO actuales siguen hablando de eventos genéricos, egresados y software de acceso; contradicen la verticalización cerrada en cumpleaños de 15.
3. `lib/mvp-status.ts` propone como siguiente paso un número productivo de Twilio. La decisión canónica prioriza el envío personal y prohíbe convertir un sender central en requisito.
4. El flujo de nuevos pagos de invitados ya usa `event_payment_accounts`; falta aplicar la migración de estado OAuth, configurar la aplicación de Mercado Pago y probar una acreditación real al receptor correcto.
5. La web tiene una página de precios aunque el modelo comercial todavía no está cerrado.

---

## 2. Cómo leer el backlog

### Prioridad

- **P0:** bloquea el próximo evento, la verdad del producto o un lanzamiento seguro.
- **P1:** necesario para la primera versión vertical completa.
- **P2:** segunda ola; se inicia solo con evidencia de uso.

### Tamaño

- **S:** cambio acotado.
- **M:** varias piezas coordinadas.
- **L:** slice transversal que requiere datos, UI, API y pruebas.

Los tamaños sirven para ordenar y dividir trabajo; no son compromisos de calendario. Todo ticket L debe implementarse en PRs pequeños y conservar compatibilidad con los eventos actuales.

### Definición de terminado común

Todo ticket funcional debe incluir:

- validación de entradas y respeto de RLS/permisos;
- estados vacío, carga, error y éxito;
- comportamiento mobile cuando la superficie sea de invitado o puerta;
- pruebas automáticas sobre reglas críticas;
- una verificación manual del recorrido afectado;
- telemetría cuando cambie una conversión o una operación crítica;
- documentación del cambio si modifica una decisión o un flujo.

---

## 3. Orden de entrega

```text
Decisiones y evidencia
        ↓
Grupo + personas + accesos + estados
        ↓
Invitación / pagos / check-in por grupo
        ↓
Centro de Preparación + roles + personalización
        ↓
Demos fieles y nueva web vertical
        ↓
Ensayo de evento + lanzamiento
```

La web puede avanzar en copy, sistema visual y assets en paralelo, pero no debe publicar como disponible una función que el producto todavía no sostiene.

---

## 4. Fase 0 — Alinear verdad, riesgo y alcance

### ALI-001 — Canonizar documentación y tablero de producto

**Prioridad:** P0 · **Tamaño:** S · **Dependencias:** ninguna

**Objetivo:** hacer que agentes y equipo lean la misma fuente de verdad y que el tablero interno deje de responder al MVP anterior.

**Criterios de aceptación:**

- las rutas y nombres de documentos coinciden entre `Docs`, `CLAUDE.md`, `GEMINI.md` y `GLM.md`;
- se declara cuál documento manda ante contradicciones;
- `lib/mvp-status.ts` refleja el backlog vertical o deja de presentarse como fuente de verdad vigente;
- el número Twilio productivo no aparece como próximo paso obligatorio.

### ALI-002 — Definir corte del próximo evento real

**Prioridad:** P0 · **Tamaño:** S · **Dependencias:** ninguna

**Objetivo:** identificar qué capacidades deben estar listas para el próximo evento confirmado y evitar que el rediseño web desplace el riesgo operativo.

**Criterios de aceptación:**

- se registra fecha, modalidad, volumen esperado, si cobra entradas, cantidad de operadores y conectividad prevista;
- se marca cada ticket como “antes del evento”, “después del evento” o “no aplica”;
- existe un responsable de decisión para producto, contenido, pagos y operación.

### ALI-003 — Cerrar alcance de personalización V1

**Prioridad:** P0 · **Tamaño:** S · **Dependencias:** ninguna

**Objetivo:** definir límites concretos sin construir un editor tipo Canva.

**Criterios de aceptación:**

- se eligen los universos/templates iniciales y qué puede cambiar el usuario;
- se define el contenido configurable por segmento;
- se separa claramente V1, conceptual para demo y segunda ola;
- el alcance permite estimar ALI-029 y WEB-006 sin supuestos abiertos.

### ALI-004 — Especificar Centro de Preparación e inbox

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ALI-002

**Objetivo:** convertir “¿Está todo listo?” en reglas explicables y accionables.

**Criterios de aceptación:**

- catálogo de pendientes con fuente de datos, severidad, rol, CTA y condición de resolución;
- fórmula de preparación transparente, o decisión explícita de lanzar sin porcentaje;
- tratamiento de cambios recientes: restricción nueva, acompañante modificado, pago o estado cambiado;
- wireflow validado para familia y profesional.

### ALI-005 — Probar Mercado Pago con receptor externo real

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ALI-002

**Objetivo:** eliminar el mayor riesgo técnico/comercial antes de ampliar el flujo de pagos.

**Criterios de aceptación:**

- prueba documentada del OAuth `authorization_code` vigente con una cuenta externa autorizada;
- confirmación de refresh, revocación, expiración, webhook y acreditación al receptor correcto;
- decisión documentada sobre quién puede ser receptor por modalidad de evento;
- riesgos fiscales/contractuales escalados al owner, sin activar split o comisión por defecto;
- no quedan tokens ni datos sensibles en logs, navegador o tablas expuestas.

### ALI-006 — Cerrar modelo comercial y CTA de entrada

**Prioridad:** P1 · **Tamaño:** S · **Dependencias:** ALI-002, ALI-005

**Objetivo:** definir qué promete y a dónde convierte la web mientras el trial completo no exista.

**Criterios de aceptación:**

- precio por evento y lógica de packs profesionales definidos, o decisión explícita de ocultar precios;
- CTA por audiencia: familia y profesional;
- definición de “evento creado”, “publicado” y momento de pago de Alista;
- la web no muestra seats ni planes SaaS complejos.

### ALI-007 — Auditar material y evidencia del caso Dharma

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** ninguna

**Objetivo:** asegurar que el hero y el caso real se basen en assets y métricas utilizables.

**Criterios de aceptación:**

- inventario de video/fotos con derechos de uso y consentimiento, especialmente por tratarse de menores;
- selección de tomas que demuestren llegada, interacción y fiesta, no solo decoración;
- métricas comprobables con fuente y fecha;
- poster, variantes responsive y fallback definidos;
- ninguna cifra o testimonio inventado.

---

## 5. Fase 1 — Fundaciones del producto vertical

### ALI-010 — Migrar a grupo de invitación + personas

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** ALI-002

**Objetivo:** establecer “grupo para operar, persona para conocer” sin romper eventos existentes.

**Criterios de aceptación:**

- entidades para grupo e integrantes con relación, responsable principal, asistencia y datos individuales;
- estrategia de backfill desde `guests`, `plus_ones_*` y acompañantes serializados;
- lectura compatible durante la migración y rollback documentado;
- un grupo puede tener una o varias personas y conservar una invitación principal;
- restricciones, ingreso e historial pueden asociarse a una persona;
- pruebas de migración con invitado solo, familia, acompañante y registros incompletos.

### ALI-011 — Modelar modalidad y tipos de acceso de 15

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ALI-010

**Objetivo:** soportar fiesta privada, abierta y mixta con las mismas reglas centrales.

**Criterios de aceptación:**

- modalidad explícita por evento;
- plantillas Cena, Trasnoche y Trasnoche con entrada;
- acceso asignado al grupo por defecto;
- atributos separados para horario, pago, precio y cupo;
- se pueden crear accesos adicionales sin sumar enums rígidos;
- la UI oculta atributos que no aplican.

### ALI-012 — Separar segmento, remitente, contacto y responsable

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ALI-010

**Objetivo:** evitar que agrupación, comunicación, acceso y administración se mezclen.

**Criterios de aceptación:**

- segmentos reutilizables por evento y asignables sin alterar el tipo de acceso;
- remitente, contacto visible y responsable administrativo son campos/relaciones distintos;
- familia, colegio, amigos, adultos, especial y proveedores pueden preconfigurarse y editarse;
- las superficies muestran únicamente el rol que corresponde.

### ALI-013 — Unificar estados del recorrido del invitado

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ALI-010, ALI-011

**Objetivo:** representar Preparada → Enviada → Confirmada → Pagada → Ingresó sin estados irrelevantes.

**Criterios de aceptación:**

- máquina de estados y transiciones válidas documentadas por modalidad;
- “marcada como enviada” no se confunde con entrega comprobada;
- pago, RSVP e ingreso mantienen estados independientes pero producen una lectura simple;
- migración desde los siete estados actuales definida;
- auditoría registra actor, fecha y origen de cada transición.

### ALI-014 — Roles por evento y UX progresiva por rol

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** ALI-012

**Objetivo:** dejar de depender únicamente de roles globales y preparar superficies para quinceañera, familia, profesional y recepción.

**Criterios de aceptación:**

- una persona puede tener distinto rol en distintos eventos;
- permisos de lectura/escritura se aplican en servidor y RLS, no solo en navegación;
- quinceañera/familia no acceden a configuración crítica si no corresponde;
- profesional puede operar varios eventos;
- recepción conserva acceso mínimo a buscar, validar y resolver.

---

## 6. Fase 2 — Recorrido operativo completo

### ALI-020 — Invitación por grupo y RSVP progresivo

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** ALI-010, ALI-011, ALI-013

**Objetivo:** confirmar una invitación familiar sin cuenta y pedir solo información útil.

**Criterios de aceptación:**

- un link seguro abre el grupo correcto sin login;
- en fiesta abierta, un enlace general permite iniciar registro/compra y crea el grupo sin duplicar cupo;
- si no asiste, el recorrido termina sin preguntas innecesarias;
- si asiste, puede confirmar/desmarcar integrantes y completar datos condicionales;
- preguntas configurables por segmento/acceso;
- reabrir el link conserva contexto y evita volver a pedir lo ya respondido;
- consentimiento y minimización de datos están contemplados.

### ALI-021 — Centro de invitaciones y WhatsApp personal

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** ALI-012, ALI-013, ALI-020

**Objetivo:** preparar y seguir envíos personales sin simular tracking inexistente.

**Criterios de aceptación:**

- vista por segmento con totales preparada/enviada/confirmada/no asiste;
- cada fila ofrece destinatario, preview, texto editable, link y “Abrir WhatsApp”;
- después de abrir WhatsApp se solicita marcar el envío de forma explícita;
- filtro y continuación desde el siguiente pendiente;
- funciona en móvil y desde el número personal del remitente;
- la automatización Twilio existente queda opcional y claramente separada.

### ALI-022 — Modo reducido “Enviar mis invitaciones”

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** ALI-014, ALI-021

**Objetivo:** permitir que la quinceañera envíe sin recibir acceso administrativo completo.

**Criterios de aceptación:**

- acceso seguro, revocable y limitado al evento;
- puede ver pendientes, editar texto, abrir WhatsApp y marcar enviado;
- no puede cambiar pagos, accesos, configuración, integrantes críticos ni borrar el evento;
- cada acción queda auditada;
- la sesión expira y puede revocarse desde el panel responsable.

### ALI-023 — QR y check-in grupal/individual

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** ALI-010, ALI-011, ALI-013

**Objetivo:** que una familia llegue junta y pueda entrar con un solo QR sin perder identidad individual.

**Criterios de aceptación:**

- un QR identifica la invitación/grupo;
- recepción ve integrantes, acceso, pago y estados antes de aprobar;
- acción “Ingresan todos” con posibilidad de desmarcar ausentes;
- un integrante puede llegar después y registrarse desde el mismo grupo;
- doble ingreso, anulado, pago pendiente y fuera de horario tienen respuesta inmediata;
- reversión e historial guardan integrante, operador y hora;
- búsqueda por nombre, apellido y teléfono encuentra grupo e integrantes.
- walk-in controlado crea el grupo/persona excepcional, registra al operador y aplica las mismas reglas de acceso.

### ALI-024 — Recepción en conectividad degradada

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** ALI-023

**Objetivo:** evitar que una caída breve de red detenga la puerta.

**Criterios de aceptación:**

- precarga/cache local de la lista autorizada para el evento;
- búsqueda y validación básica funcionan temporalmente sin red;
- check-ins quedan en una cola durable y se sincronizan al volver;
- estado de conexión, pendientes de sync y errores son visibles;
- política de conflicto para doble ingreso documentada y probada;
- existe un procedimiento operativo si el dispositivo se pierde o la cola no sincroniza.

### ALI-025 — Mercado Pago OAuth por receptor del evento

**Prioridad:** P0 para eventos pagos · **Tamaño:** L · **Dependencias:** ALI-005, ALI-011, ALI-013

**Estado técnico — 25 de agosto de 2026:** implementado en código: conexión OAuth `authorization_code` con PKCE, estado de un uso, tokens cifrados, refresh, desconexión protegida ante pagos pendientes y resolución de cuenta por evento en checkout, conciliación y webhook. La regla de negocio cerrada es: los invitados pagan a la cuenta de la responsable del evento; Alista cobra su propio servicio de forma separada en su cuenta. Falta aplicar la migración, configurar credenciales/redirect URI y ejecutar ALI-005 con una cuenta externa real antes de habilitarlo en producción.

**Objetivo:** acreditar el dinero directamente en la cuenta autorizada por el evento.

**Criterios de aceptación:**

- “Conectar Mercado Pago” inicia consentimiento y vuelve al evento correcto;
- tokens cifrados, refresh automático, revocación y reconexión;
- checkout, conciliación y webhook resuelven la cuenta del evento, no un token global;
- cada intento y pago queda asociado al grupo/invitación y habilita el acceso correcto de forma idempotente;
- la UI solo muestra nombre/cuenta conectada y estado útil;
- no hay custodia, cuenta puente ni split/comisión implícita;
- prueba end-to-end con pago, rechazo, expiración y webhook repetido.

### ALI-026 — Cortesías, cupos y cierre de venta

**Prioridad:** P0 para eventos abiertos/mixtos · **Tamaño:** M · **Dependencias:** ALI-011, ALI-013, ALI-025

**Objetivo:** completar las reglas comerciales mínimas sin modelar una billetera.

**Criterios de aceptación:**

- cortesía habilita acceso sin crear un pago de $0 y audita actor/fecha/motivo;
- capacidad total y cupo pago configurables;
- cierre por cantidad y por fecha/hora;
- no se inicia una compra por encima del cupo disponible;
- estado agotado/cerrado consistente entre invitación, checkout y panel;
- concurrencia de últimas entradas cubierta por prueba.

### ALI-027 — Centro de Preparación e inbox accionable

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** ALI-004, ALI-013, ALI-021, ALI-023

**Objetivo:** convertir el dashboard actual en asistente operativo.

**Criterios de aceptación:**

- pendientes definidos en ALI-004 calculados desde datos reales;
- cada ítem lleva a una vista filtrada o acción concreta;
- diferencia entre incompleto, bloqueante, cambio reciente y listo;
- preparación explicable por factor, si se conserva porcentaje;
- vistas priorizadas para familia y profesional;
- resolución actualiza el centro sin números decorativos.

### ALI-028 — Importación XLSX/CSV, validación y duplicados

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** ALI-010, ALI-011, ALI-012

**Objetivo:** aceptar listas reales desordenadas sin degradar RSVP, pagos y puerta.

**Criterios de aceptación:**

- carga de XLSX y CSV con preview antes de escribir;
- mapeo asistido de columnas a grupo, integrante, teléfono, segmento y acceso;
- errores por fila y opción de corregir/excluir;
- detección de posibles duplicados por teléfono/nombre/apellido/email;
- fusión revisable que conserva relaciones, pagos, RSVP e historial;
- la importación es idempotente ante reintento del mismo archivo.

### ALI-029 — Universos curados, contenido contextual y “Ver como…”

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** ALI-003, ALI-012, ALI-020

**Objetivo:** implementar la personalización V1 como diferenciador verificable.

**Criterios de aceptación:**

- selección entre universos curados con límites de color, tipografía y media;
- bloques y mensajes configurables por segmento/acceso;
- respuestas previas pueden modificar contenido posterior sin repetir preguntas;
- “Ver como…” usa una persona/grupo real de preview;
- la preview coincide con la invitación publicada;
- toda capacidad conceptual se etiqueta como tal y no se vende como disponible.

### ALI-030 — Reporte operativo y cierre básico del evento

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** ALI-013, ALI-023, ALI-025

**Objetivo:** completar el must-have de exportación y dar evidencia a profesionales sin crear un CRM.

**Criterios de aceptación:**

- exporta grupos, personas, RSVP, pagos, cortesías e ingresos con permisos adecuados;
- resumen de asistencia/no-show, horas de llegada y ventas cuando aplique;
- importes y personas no se duplican por reintentos o reversión;
- datos sensibles se minimizan en la descarga;
- métricas del caso real pueden trazarse a este reporte.

---

## 7. Fase 3 — Nueva web pública

### WEB-001 — Arquitectura, navegación y copy vertical

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ALI-006

**Objetivo:** reemplazar el relato genérico por la tesis de preparación de cumpleaños de 15.

**Criterios de aceptación:**

- home general y recorridos claros “Estoy organizando mis 15” / “Organizo fiestas de 15”;
- hero comunica vertical, preparación y solución profesional en un viewport;
- se eliminan egresados/eventos genéricos de títulos, metadata, OG, navegación y FAQs principales;
- copy sigue problema → mecanismo → resultado → emoción;
- QR, seguridad y control no son el territorio narrativo principal;
- inventario de páginas actuales: conservar, redirigir, reescribir o retirar.

### WEB-002 — Sistema visual editorial y pipeline de media

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** ALI-003, ALI-007

**Objetivo:** construir una identidad joven, premium y humana sin estética SaaS genérica ni princesa/cotillón.

**Criterios de aceptación:**

- tokens, tipografía, grilla, ritmo, color y componentes responsive definidos;
- video con poster inmediato, formatos optimizados, fallback y reproducción respetuosa de preferencias;
- dirección mobile-first validada en anchos críticos;
- motion aporta continuidad y no usa scroll hijacking;
- contraste, foco y reducción de movimiento cumplen accesibilidad.

### WEB-003 — Hero real + narrativa “Esto empezó antes”

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** WEB-001, WEB-002

**Objetivo:** instalar la tesis y explicar preparación con una línea de tiempo hacia atrás.

**Criterios de aceptación:**

- hero usa material aprobado de Dharma o fallback equivalente;
- headline, bajada y dos CTAs visibles sin scroll en móvil y escritorio;
- secuencia 30/20/12/7/2 días → esa noche comprensible sin definición abstracta;
- video no bloquea LCP ni lectura;
- eventos de CTA e interacción instrumentados.

### WEB-004 — Demo interactiva: invitación → “el otro lado”

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** ALI-020, WEB-002

**Objetivo:** demostrar antes del tercer viewport cómo una confirmación se vuelve preparación.

**Criterios de aceptación:**

- mini invitación breve en teléfono realista;
- permite confirmar integrantes y una necesidad sin escribir datos reales;
- transición muestra grupo, acceso, restricción, estado y QR preparado;
- no persiste PII ni afecta eventos reales;
- accesible con teclado/touch y reiniciable;
- representa fielmente el producto disponible o se etiqueta como conceptual.

### WEB-005 — Recorrido, WhatsApp, pagos y llegada

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** ALI-021, ALI-023, ALI-025, WEB-001

**Objetivo:** explicar Invitá → Confirmá → Conocé → Prepará → Cobrá → Recibí mediante situaciones.

**Criterios de aceptación:**

- muestra la invitación saliendo de una persona conocida;
- demuestra Cena/Trasnoche/Trasnoche con entrada sin explicación técnica extensa;
- pagos se cuentan como “cobrar sin perseguir comprobantes” y solo luego de validar OAuth real;
- check-in muestra familia, integrantes y un ingreso conjunto;
- no hay grilla de features genérica ni lenguaje OAuth/API/marketplace.

### WEB-006 — Demos de Preparación, atención y personalización

**Prioridad:** P1 · **Tamaño:** L · **Dependencias:** ALI-027, ALI-029, WEB-002

**Objetivo:** hacer visibles los diferenciadores que justifican la especialización.

**Criterios de aceptación:**

- Centro de Preparación muestra factores reales y acciones, no charts decorativos;
- “Necesita tu atención” presenta ejemplos creíbles;
- cambio entre universos modifica identidad manteniendo estructura UX;
- “Ver como…” cambia contenido según grupo/segmento;
- cada demo indica si es real, próxima o conceptual.

### WEB-007 — Caso Dharma y página para profesionales

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** ALI-007, ALI-030, WEB-001

**Objetivo:** sumar evidencia real y una propuesta B2B2C específica.

**Criterios de aceptación:**

- caso Dharma usa solo métricas verificadas y assets autorizados;
- profesional entiende múltiples eventos, equipo, plantillas y reutilización;
- se demuestra cómo incorporar “Todos nuestros 15 incluyen Alista” al servicio;
- CTA profesional lleva al flujo definido en ALI-006;
- no se publican testimonios o cifras de relleno.

### WEB-008 — Conversión por audiencia, precios y entrada al producto

**Prioridad:** P1 · **Tamaño:** M · **Dependencias:** ALI-006, WEB-001

**Objetivo:** cerrar los recorridos sin prometer un trial inexistente.

**Criterios de aceptación:**

- CTA familia y profesional tienen destino, seguimiento y confirmación claros;
- precios solo se publican si la decisión está cerrada; de lo contrario la página se retira o queda como contacto honesto;
- el flujo “Creá tus 15, pagás al publicar” se muestra únicamente cuando exista;
- formularios tienen validación, anti-spam, privacidad y estado de entrega verificable;
- conversión medible desde landing hasta evento/demo/contacto.

### WEB-009 — Analítica, performance, accesibilidad y SEO de lanzamiento

**Prioridad:** P0 de lanzamiento · **Tamaño:** L · **Dependencias:** WEB-003 a WEB-008

**Objetivo:** lanzar una web medible, rápida y usable en 4G.

**Criterios de aceptación:**

- eventos para CTR hero, demo iniciada/completada, B2B, WhatsApp, evento creado/publicado y abandono por sección;
- consentimiento y política de datos acordes a la medición elegida;
- presupuesto de performance para video, imágenes, JS y fuentes;
- prueba de Core Web Vitals en móvil y fallback de red lenta;
- auditoría WCAG de interacción, foco, contraste, formularios y reduced motion;
- sitemap, robots, metadata, OG, canonical y redirects actualizados al posicionamiento vertical.

---

## 8. Fase 4 — Preparar un lanzamiento operable

### REL-001 — Matriz end-to-end y ensayo de evento

**Prioridad:** P0 · **Tamaño:** L · **Dependencias:** todos los P0 aplicables al evento de ALI-002

**Objetivo:** verificar el recorrido completo con condiciones realistas antes de usarlo en puerta.

**Criterios de aceptación:**

- casos privada/abierta/mixta según alcance real;
- grupo solo, familia, no asistencia, pago pendiente/aprobado, cortesía, QR repetido, integrante tardío y reversión;
- dos o más operadores simultáneos;
- simulación de red lenta, caída y resincronización;
- ensayo con dispositivos reales y tiempos de respuesta registrados;
- lista de bloqueantes cerrada o aceptada explícitamente por el owner.

### REL-002 — Revisión de seguridad, privacidad y pagos

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** ALI-014, ALI-020, ALI-022, ALI-025

**Objetivo:** proteger datos de invitados y dinero antes del lanzamiento.

**Criterios de aceptación:**

- revisión de RLS, service role, tokens públicos, expiración y revocación;
- event-scoped authorization probada en APIs;
- webhook idempotente y con firma; tokens MP cifrados y rotables;
- revisión de datos de menores, fotos, consentimiento, retención y descarga;
- logs sin secretos ni PII innecesaria;
- hallazgos críticos corregidos antes del go-live.

### REL-003 — Observabilidad y runbook operativo

**Prioridad:** P0 · **Tamaño:** M · **Dependencias:** REL-001, REL-002

**Objetivo:** detectar y resolver problemas durante invitaciones, pagos y puerta.

**Criterios de aceptación:**

- métricas/alertas para errores de invitación, checkout, webhook, QR, check-in y sync;
- tablero de salud por evento sin exponer secretos;
- runbook de credenciales, MP desconectado, QR inválido, aforo, caída de red y cola trabada;
- responsables y canal de escalamiento definidos;
- backup/export de lista disponible antes de abrir puerta.

---

## 9. Segunda ola — No incluir en el primer corte

Crear tickets P2 solo cuando exista evidencia de frecuencia y valor:

- seating/mesas sofisticado (preservar lo ya construido, no expandirlo todavía);
- transporte y cupos de combi;
- cambio controlado de asistente;
- agradecimientos y aprendizaje post-evento más avanzado;
- automatización operativa multicanal;
- trial/autoservicio completo si el modelo comercial lo justifica.

Mantener fuera de alcance: marketplace de proveedores, billetera/custodia, split por defecto, agenda integral, contratos, chat, red social, app nativa, editor Canva, CRM genérico, reventa e IA como protagonista.

---

## 10. Corte recomendado para el próximo evento

### Siempre

1. ALI-001 y ALI-002.
2. ALI-010, ALI-011, ALI-013 y ALI-020.
3. ALI-021 y ALI-023.
4. ALI-004 y ALI-027 en una primera versión explicable.
5. ALI-024 si la recepción depende de red móvil/Wi-Fi no controlada.
6. REL-001, REL-002 y REL-003.

### Solo si vende entradas

7. ALI-005, ALI-025 y ALI-026.

### Puede avanzar en paralelo sin bloquear operación

8. ALI-003, ALI-007, WEB-001 y WEB-002.

La nueva home completa debe publicarse después de que sus demos puedan apoyarse en producto real o estén etiquetadas con total claridad.

---

## 11. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Migrar acompañantes serializados a personas | Puede romper RSVP, QR y reportes existentes | Backfill, compatibilidad temporal, fixtures y rollback en ALI-010 |
| Pago con token global | Dinero acreditado al receptor incorrecto | Spike real ALI-005 antes de ALI-025 |
| Offline con múltiples operadores | Doble ingreso o cola inconsistente | Política de conflicto, IDs idempotentes y ensayo REL-001 |
| Web adelantada al producto | Promesa comercial falsa | Dependencias explícitas y etiquetas real/próximo/conceptual |
| Uso de imágenes de menores | Riesgo legal y reputacional | Consentimiento y auditoría de assets ALI-007 |
| Alcance excesivo antes del próximo evento | Retrasa lo operativo | Corte ALI-002 y segunda ola explícita |

---

## 12. Primeros diez tickets para cargar en el gestor

1. ALI-001 — Canonizar documentación y tablero.
2. ALI-002 — Definir corte del próximo evento.
3. ALI-005 — Probar MP con receptor externo si el evento es pago.
4. ALI-010 — Grupo de invitación + personas.
5. ALI-011 — Modalidad y tipos de acceso.
6. ALI-013 — Estados del recorrido.
7. ALI-020 — Invitación por grupo y RSVP.
8. ALI-021 — Centro de invitaciones y WhatsApp personal.
9. ALI-023 — QR/check-in grupal.
10. ALI-004 — Especificación del Centro de Preparación.

Después de estos diez, el orden se recalcula con el evento definido en ALI-002. No conviene cargar toda la segunda ola como trabajo activo.

# Qentra — Brief de Producto y Web
## Guía para diseñar y construir la web pública y la webapp

> Documento operativo para diseñadores, desarrolladores y agentes de código.
>
> Debe leerse junto a `QENTRA_FUNDAMENTOS_ESTRATEGICOS.md`.

---

# 0. Objetivo

Construir un ecosistema digital coherente compuesto por:

1. una web pública de producto;
2. una webapp funcional para organizadores y equipos;
3. una experiencia móvil de invitación, confirmación y acceso;
4. una interfaz de recepción rápida y confiable.

La solución inicial debe servir a eventos sociales y corporativos sin quedar visual ni funcionalmente encerrada en cumpleaños de 15.

El producto debe demostrar desde su primera versión la idea central:

> **Cada interacción previa debe mejorar la llegada.**

---

# 1. Principios rectores

Toda decisión de UX, interfaz, contenido y arquitectura debe respetar:

1. El héroe es el anfitrión.
2. El invitado debe sentirse esperado, no procesado.
3. El sistema debe reducir incertidumbre operativa.
4. Cada dato solicitado debe tener una utilidad visible.
5. La preparación vale más que la reacción.
6. El equipo debe operar sin depender constantemente del anfitrión.
7. Toda función debe devolver más atención de la que consume.
8. La tecnología debe desaparecer detrás de una experiencia clara.
9. La privacidad debe formar parte del diseño.
10. La narrativa nunca debe prometer más de lo que el producto puede demostrar.

---

# 2. Usuarios principales

## 2.1 Anfitrión / responsable

### Necesita

- crear el evento;
- conocer el estado general;
- aprobar criterios;
- ver excepciones;
- delegar;
- mantenerse informado;
- no operar cada detalle.

### No debe necesitar

- vigilar permanentemente;
- responder cada consulta;
- intervenir en cada acceso;
- comprender configuraciones técnicas complejas.

---

## 2.2 Organizador / planner

### Necesita

- gestionar información;
- crear categorías;
- importar invitados;
- segmentar;
- resolver pendientes;
- configurar formularios;
- coordinar equipos;
- acceder a métricas.

---

## 2.3 Operador de acceso

### Necesita

- encontrar personas rápido;
- escanear QR;
- validar permisos;
- registrar acompañantes;
- entender excepciones;
- trabajar con conexión inestable;
- actuar con pocos pasos.

---

## 2.4 Invitado

### Necesita

- entender por qué fue contactado;
- confirmar fácilmente;
- aportar solo información pertinente;
- recibir instrucciones claras;
- acceder sin fricción;
- corregir información;
- sentir que la experiencia fue preparada.

---

## 2.5 Administrador de plataforma

### Necesita

- gestionar cuentas;
- revisar eventos;
- resolver incidencias;
- administrar planes;
- consultar auditoría;
- proteger datos;
- ofrecer soporte.

---

# 3. Arquitectura del ecosistema

## 3.1 Web pública

Objetivo: explicar el producto y convertir visitas en solicitudes de demo o registros.

### Páginas iniciales

- Inicio
- Producto
- Cómo funciona
- Casos de uso
- Para eventos sociales
- Para eventos corporativos
- Seguridad y privacidad
- Precios o solicitar demo
- Acceso a la plataforma
- Contacto

---

## 3.2 Webapp

Objetivo: permitir preparar, coordinar y monitorear la experiencia de invitados.

### Módulos iniciales

- autenticación;
- organizaciones;
- usuarios y roles;
- eventos;
- invitados;
- grupos y categorías;
- importación;
- invitaciones;
- formularios;
- confirmaciones;
- necesidades y preferencias;
- accesos;
- QR;
- check-in;
- incidencias;
- dashboard;
- actividad;
- exportación;
- configuración;
- privacidad.

---

## 3.3 Experiencia del invitado

Debe ser mobile-first y funcionar sin instalar una app.

### Flujo inicial

1. Recibe invitación.
2. Reconoce quién invita.
3. Comprende el evento.
4. Confirma o rechaza.
5. Añade acompañantes, si corresponde.
6. Completa información relevante.
7. Recibe confirmación.
8. Consulta datos del evento.
9. Accede al QR o credencial.
10. Recibe recordatorio.
11. Llega y es validado.
12. Puede recibir comunicación posterior.

---

## 3.4 Modo recepción

Debe estar optimizado para velocidad, baja carga cognitiva y uso con una mano.

### Capacidades

- escaneo rápido;
- búsqueda por nombre, DNI, correo o teléfono;
- estados claros;
- confirmación manual;
- ingreso de acompañantes;
- advertencias;
- acceso por roles o sectores;
- registro de incidencias;
- funcionamiento resiliente;
- sincronización posterior;
- feedback visual y sonoro discreto.

---

# 4. Arquitectura de información de la web pública

## 4.1 Hero

### Objetivo

Explicar la transformación sin ocultar la función actual.

### Mensaje principal recomendado

> **Prepará cada llegada. Viví el momento.**

### Texto de apoyo

> Gestioná invitaciones, confirmaciones y accesos desde un solo lugar. Convertí la información de tus invitados en una recepción más clara, fluida y personal.

### CTA principal

- Solicitar demo
- Crear evento

### CTA secundario

- Ver cómo funciona

### Visual

Mostrar una secuencia conectada:

Invitación → Confirmación → Preparación → Llegada.

Evitar una pantalla genérica con gráficos sin significado.

---

## 4.2 Problema

### Título

> El problema no empieza en la puerta.

### Contenido

La información suele estar distribuida entre planillas, formularios, mensajes y personas.

Cuando esa información no se transforma en preparación, las excepciones aparecen en el peor momento: cuando los invitados ya están llegando.

---

## 4.3 Propuesta de valor

### Título

> Conocé antes. Prepará mejor. Recibí con claridad.

### Bloques

- Conocer.
- Organizar.
- Anticipar.
- Coordinar.

Cada bloque debe mostrar una capacidad real del producto.

---

## 4.4 Flujo

### Título

> Cada interacción mejora la siguiente.

### Etapas

1. Invitá.
2. Confirmá.
3. Conocé.
4. Prepará.
5. Recibí.
6. Aprendé.

---

## 4.5 Beneficio para el anfitrión

### Título

> Todo listo para que puedas estar presente.

### Contenido

Mostrar cómo el sistema reduce:

- consultas;
- improvisación;
- dependencia;
- carga operativa;
- incertidumbre.

No usar promesas absolutas.

---

## 4.6 Beneficio para el invitado

### Título

> Que cada persona sienta que estaba siendo esperada.

### Contenido

- información clara;
- confirmación sencilla;
- accesibilidad;
- menor espera;
- recepción contextual;
- personalización pertinente.

---

## 4.7 Casos de uso

### Eventos sociales

- cumpleaños de 15;
- casamientos;
- celebraciones privadas.

### Eventos corporativos

- lanzamientos;
- convenciones;
- conferencias;
- cenas;
- capacitaciones.

### Eventos de escala

- ferias;
- exposiciones;
- congresos;
- festivales;
- eventos institucionales.

---

## 4.8 Privacidad

### Título

> Conocer lo necesario. Cuidar siempre.

Explicar:

- propósito de los datos;
- minimización;
- consentimiento;
- roles;
- protección;
- retención;
- eliminación;
- trazabilidad.

---

## 4.9 Cierre

### Mensaje

> Recibir mejor empieza mucho antes de la llegada.

### CTA

- Preparar mi próximo evento.
- Solicitar una demostración.

---

# 5. Navegación y estructura de la webapp

## 5.1 Navegación principal

- Inicio
- Eventos
- Invitados
- Invitaciones
- Confirmaciones
- Accesos
- Equipo
- Reportes
- Configuración

Evitar saturar la navegación inicial.

Los módulos no usados pueden aparecer progresivamente según el estado del evento.

---

## 5.2 Dashboard de evento

El dashboard debe responder, sin exploración adicional:

1. ¿Cuántas personas fueron invitadas?
2. ¿Cuántas confirmaron?
3. ¿Cuántas están pendientes?
4. ¿Qué información falta?
5. ¿Qué excepciones requieren atención?
6. ¿Qué tan preparado está el evento?
7. ¿Quién llegó?
8. ¿Qué está ocurriendo ahora?

### Indicador clave recomendado

**Nivel de preparación del evento**

Debe calcularse con factores comprensibles, por ejemplo:

- invitaciones enviadas;
- confirmaciones;
- datos completos;
- excepciones resueltas;
- equipos configurados;
- accesos definidos;
- credenciales listas.

No usar una puntuación opaca.

---

## 5.3 Vista de invitados

### Columnas recomendadas

- nombre;
- grupo;
- estado de invitación;
- confirmación;
- acompañantes;
- información pendiente;
- categoría;
- acceso;
- llegada;
- alertas.

### Acciones rápidas

- editar;
- reenviar invitación;
- confirmar manualmente;
- añadir nota;
- resolver alerta;
- generar QR;
- registrar llegada.

---

## 5.4 Vista de pendientes

Debe ser una de las superficies más importantes del sistema.

### Tipos de pendientes

- invitados sin confirmar;
- datos incompletos;
- duplicados;
- acompañantes sin identificar;
- necesidades sin resolver;
- accesos no asignados;
- errores de contacto;
- invitaciones no entregadas.

### Principio

> Convertir incertidumbre en una lista accionable.

---

## 5.5 Configuración de invitación

Debe permitir definir:

- identidad del evento;
- mensaje;
- canales;
- fecha límite;
- confirmación;
- acompañantes;
- preguntas;
- necesidades especiales;
- políticas de privacidad;
- recordatorios.

Las preguntas deben mostrar por qué se solicitan cuando no sea evidente.

---

## 5.6 Check-in

### Estados básicos

- habilitado;
- ya ingresó;
- pendiente;
- no confirmado;
- acceso restringido;
- requiere atención.

### Regla

Los estados deben comprenderse por texto e iconografía, no solo por color.

### Excepciones

Cada excepción debe ofrecer una acción clara:

- permitir;
- denegar;
- consultar;
- registrar;
- derivar.

---

# 6. MVP recomendado

## 6.1 Debe incluir

- registro e inicio de sesión;
- organización;
- creación de evento;
- importación CSV/XLSX;
- gestión de invitados;
- grupos y categorías;
- invitaciones por enlace;
- formulario RSVP;
- acompañantes;
- preguntas personalizadas;
- QR individual;
- escaneo;
- búsqueda manual;
- check-in;
- panel en tiempo real;
- roles básicos;
- historial de actividad;
- exportación.

---

## 6.2 Debe empezar a demostrar el posicionamiento

Para no quedar en un simple check-in, el MVP debe incluir al menos:

### Pendientes inteligentes

Lista de datos faltantes, inconsistencias y excepciones.

### Resumen de preparación

Estado general del evento antes de la llegada.

### Información útil por invitado

Necesidades, acompañantes, acceso y notas visibles en el momento correcto.

### Delegación

Operadores capaces de trabajar sin acceso a toda la información ni dependencia constante del anfitrión.

---

## 6.3 No incluir todavía

- networking;
- marketplace;
- venta de entradas compleja;
- mapas de calor;
- reconocimiento facial;
- app nativa;
- IA generativa como protagonista;
- automatizaciones excesivas;
- múltiples industrias;
- CRM completo;
- gestión integral de proveedores;
- agenda avanzada;
- programa de fidelización.

Estas capacidades podrán evaluarse después de validar el núcleo.

---

# 7. Roadmap conceptual

## Fase 1 — Preparar la llegada

- invitados;
- RSVP;
- información relevante;
- accesos;
- check-in;
- pendientes;
- coordinación.

## Fase 2 — Mejorar la experiencia previa

- recordatorios;
- segmentación;
- mensajes;
- wallet;
- logística;
- recomendaciones;
- automatizaciones.

## Fase 3 — Acompañar la experiencia

- agenda;
- wayfinding;
- comunicaciones;
- acreditaciones;
- encuestas;
- soporte.

## Fase 4 — Aprender

- analítica;
- patrones;
- comparación;
- insights;
- optimización;
- recurrencia.

Cada fase deberá validarse antes de avanzar.

---

# 8. Sistema visual

## 8.1 Personalidad

La interfaz debe sentirse:

- clara;
- humana;
- precisa;
- contemporánea;
- confiable;
- calmada;
- premium sin lujo;
- tecnológica sin códigos futuristas.

---

## 8.2 Evitar

- estética de seguridad;
- exceso de negro;
- neón;
- gradientes tecnológicos genéricos;
- lenguaje de vigilancia;
- dashboards saturados;
- iconografía agresiva;
- fotos de guardias o molinetes;
- QR como símbolo principal de marca;
- animaciones que retrasen tareas.

---

## 8.3 Dirección

- espacios amplios;
- jerarquía tipográfica fuerte;
- tarjetas simples;
- estados claros;
- microinteracciones útiles;
- lenguaje visual cálido;
- ilustraciones o fotografía centradas en personas;
- datos presentados como preparación y acción.

---

# 9. Tono de voz

## Debe ser

- claro;
- directo;
- sereno;
- humano;
- resolutivo;
- respetuoso.

## No debe ser

- grandilocuente;
- excesivamente emocional;
- técnico sin necesidad;
- infantil;
- corporativo vacío;
- alarmista.

## Ejemplos

### Correcto

> Faltan datos de 12 invitados. Revisalos ahora para evitar consultas durante el ingreso.

### Incorrecto

> ¡Ups! Parece que hay invitados incompletos.

### Correcto

> Esta información se utilizará para preparar la experiencia y atender necesidades de accesibilidad.

### Incorrecto

> Contanos todo sobre vos para personalizar tu evento.

---

# 10. Arquitectura técnica recomendada

## Stack sugerido

- Next.js con App Router;
- TypeScript;
- Tailwind CSS;
- shadcn/ui;
- Supabase;
- PostgreSQL;
- autenticación de Supabase;
- Row Level Security;
- Vercel;
- almacenamiento compatible con Supabase Storage;
- validación con Zod;
- formularios con React Hook Form;
- testing con Vitest y Playwright.

La arquitectura definitiva debe adaptarse al repositorio existente.

No recrear el proyecto desde cero si ya existe una base funcional.

---

# 11. Modelo de datos inicial

## Entidades principales

### organizations

- id
- name
- created_at
- settings

### organization_members

- id
- organization_id
- user_id
- role

### events

- id
- organization_id
- name
- start_at
- end_at
- location
- status
- settings

### guests

- id
- event_id
- first_name
- last_name
- email
- phone
- document_id
- group_id
- category_id
- invitation_status
- confirmation_status
- checkin_status
- metadata

### guest_companions

- id
- guest_id
- name
- status
- metadata

### invitations

- id
- event_id
- guest_id
- token
- sent_at
- opened_at
- responded_at
- channel
- status

### form_questions

- id
- event_id
- label
- type
- required
- purpose
- order

### form_answers

- id
- guest_id
- question_id
- value

### access_rules

- id
- event_id
- name
- zone
- criteria

### checkins

- id
- event_id
- guest_id
- operator_id
- access_rule_id
- checked_in_at
- method
- status
- metadata

### incidents

- id
- event_id
- guest_id
- operator_id
- type
- description
- resolution
- created_at

### audit_logs

- id
- organization_id
- event_id
- actor_id
- action
- target_type
- target_id
- metadata
- created_at

---

# 12. Seguridad y privacidad

Debe incluir desde el inicio:

- RLS;
- separación por organización;
- mínimos privilegios;
- registro de actividad;
- tokens seguros;
- expiración;
- protección contra enumeración;
- validación de archivos;
- límites de importación;
- consentimiento;
- propósito de cada campo;
- eliminación y exportación;
- políticas de retención;
- cifrado disponible;
- backups;
- recuperación.

No implementar biometría sin una evaluación legal, ética y técnica específica.

---

# 13. Accesibilidad

Objetivo mínimo: WCAG 2.2 AA.

### Requisitos

- navegación por teclado;
- foco visible;
- contraste;
- etiquetas;
- mensajes de error comprensibles;
- estados no dependientes solo del color;
- áreas táctiles adecuadas;
- tipografía legible;
- reducción de movimiento;
- compatibilidad con lectores de pantalla;
- lenguaje simple.

---

# 14. Rendimiento y resiliencia

La recepción ocurre en un momento crítico.

### Prioridades

- carga rápida;
- interfaz usable en equipos modestos;
- bajo consumo;
- estados offline o degradados;
- sincronización robusta;
- evitar pérdidas de registros;
- prevención de doble check-in;
- búsqueda rápida;
- feedback inmediato.

### Métricas técnicas

- Core Web Vitals;
- tiempo de respuesta del escaneo;
- tiempo de búsqueda;
- tasa de error;
- sincronizaciones pendientes;
- disponibilidad;
- recuperación.

---

# 15. Métricas de producto

## Activación

- evento creado;
- invitados importados;
- primera invitación enviada;
- primer RSVP;
- primer check-in.

## Preparación

- porcentaje de invitados con información completa;
- porcentaje confirmado;
- pendientes resueltos;
- excepciones detectadas antes del evento;
- equipo configurado;
- accesos preparados.

## Operación

- tiempo medio de check-in;
- tasa de búsqueda manual;
- incidencias;
- consultas al anfitrión;
- autonomía de operadores;
- duplicados;
- ingresos fallidos.

## Experiencia

- claridad percibida;
- espera percibida;
- satisfacción del anfitrión;
- satisfacción del equipo;
- percepción de organización;
- facilidad de confirmación.

---

# 16. Criterios de aceptación de la primera versión

La primera versión está lista cuando:

1. un usuario puede crear un evento;
2. importar invitados;
3. enviar o compartir una invitación;
4. recibir confirmaciones;
5. recopilar información relevante;
6. identificar pendientes;
7. generar QR;
8. operar un ingreso desde móvil;
9. buscar y registrar manualmente;
10. ver llegadas en tiempo real;
11. delegar en operadores;
12. conservar un registro de actividad;
13. aplicar permisos;
14. explicar claramente el uso de datos;
15. completar el flujo principal sin asistencia técnica.

---

# 17. Instrucciones para Codex

Antes de modificar código:

1. Leer este documento completo.
2. Leer `QENTRA_FUNDAMENTOS_ESTRATEGICOS.md`.
3. Inspeccionar la arquitectura existente.
4. Documentar el estado actual.
5. Identificar qué ya funciona.
6. Evitar reescrituras innecesarias.
7. Proponer cambios en etapas pequeñas.
8. Mantener TypeScript estricto.
9. Ejecutar pruebas.
10. Verificar interfaz en navegador.
11. Registrar decisiones en `/docs/decisions`.
12. No introducir dependencias sin justificación.

### Regla principal

> No agregar una función solamente porque es técnicamente posible.

Cada cambio debe indicar:

- problema;
- usuario;
- incertidumbre que reduce;
- pilar que fortalece;
- criterio de aceptación;
- prueba realizada.

---

# 18. Primera secuencia de construcción

## Entrega 1

- auditoría del repositorio;
- mapa de rutas;
- inventario de componentes;
- modelo de datos;
- riesgos;
- backlog priorizado.

## Entrega 2

- nueva arquitectura visual;
- layout;
- navegación;
- dashboard de evento;
- vista de invitados;
- vista de pendientes.

## Entrega 3

- invitación;
- RSVP;
- formulario;
- confirmación;
- acompañantes.

## Entrega 4

- QR;
- scanner;
- búsqueda;
- check-in;
- estados;
- incidencias.

## Entrega 5

- roles;
- permisos;
- actividad;
- exportación;
- seguridad;
- pruebas.

## Entrega 6

- web pública;
- copy;
- SEO;
- formularios comerciales;
- despliegue.

---

# 19. Definición de éxito

La web pública será exitosa si una persona comprende en menos de un minuto:

- qué hace el producto;
- para quién es;
- qué problema resuelve;
- por qué es diferente;
- qué puede hacer a continuación.

La webapp será exitosa si:

- reduce incertidumbre;
- permite anticipar;
- coordina equipos;
- mejora la experiencia;
- devuelve atención al anfitrión.

---

# 20. Frases guía

No son claims definitivos.

Sirven para orientar contenido y producto.

> Prepará cada llegada. Viví el momento.

> Todo listo para que puedas estar presente.

> Otros registran llegadas. Nosotros ayudamos a prepararlas.

> Conocé antes. Prepará mejor. Recibí con claridad.

> Cada interacción debe mejorar la siguiente.

> Que cada persona sienta que estaba siendo esperada.

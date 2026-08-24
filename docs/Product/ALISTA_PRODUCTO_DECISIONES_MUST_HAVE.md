# ALISTA — DECISIONES DE PRODUCTO, REGLAS UX Y MUST-HAVE
## Fuente de verdad para producto, desarrollo, UX/UI y comunicación funcional

**Fecha:** 24 de agosto de 2026  
**Estado:** Documento canónico de producto para la etapa actual  
**Mercado de entrada:** Cumpleaños de 15  
**Principio:** tecnología escalable; producto percibido y comunicación verticalizados.

---

# 0. Cómo usar este documento

Este archivo debe leerse antes de tomar decisiones relevantes sobre:

- modelo de invitados;
- invitaciones;
- RSVP;
- accesos;
- pagos;
- check-in;
- WhatsApp;
- roles;
- personalización;
- dashboard;
- permisos;
- nuevas features;
- UX/UI;
- arquitectura de datos vinculada a la experiencia.

## Jerarquía de decisiones

Las secciones marcadas como **DECISIÓN CERRADA** no deben reabrirse por conveniencia técnica, gusto personal ni aparición de una idea atractiva.

Solo se reabren con:

- evidencia de eventos reales;
- evidencia de usuarios;
- evidencia comercial;
- restricción legal;
- imposibilidad técnica relevante;
- decisión explícita del owner.

## Regla contra scope creep

> **No modelar excepciones remotas como si fueran el caso principal.**

Si un caso poco frecuente puede resolverse después mediante una acción excepcional, no debe contaminar la UX cotidiana.

---

# 1. Principio general del producto

Alista no debe convertirse en un “software de eventos con todo”.

Debe comprender profundamente cómo se prepara y opera un cumpleaños de 15.

La pregunta para cada feature es:

> **¿Esto resuelve una fricción frecuente del mundo real de los 15 o simplemente agrega capacidad de software?**

---

# 2. Modalidad del evento

Alista debe soportar conceptualmente tres modalidades:

## 2.1 Fiesta privada

Solo ingresan personas o grupos previamente invitados.

No requiere pago de entrada.

## 2.2 Fiesta abierta

El acceso se obtiene mediante una entrada paga.

Puede existir compra/registro desde un enlace general del evento.

## 2.3 Fiesta mixta

Conviven invitados de cortesía con invitados que requieren entrada paga.

Este modelo debe resolverse con las mismas entidades y reglas centrales, sin construir tres productos diferentes.

**Estado:** MUST-HAVE

---

# 3. Unidad principal: grupo de invitación

## DECISIÓN CERRADA

La unidad visible principal de invitación y acceso será el **grupo de invitación**.

Ejemplos:

- Familia Pérez
- Sofía + acompañante
- Martina
- Grupo específico definido por el organizador

Un grupo puede contener una o varias personas.

### Objetivo

Resolver naturalmente:

- familias;
- parejas;
- acompañantes;
- menores;
- confirmación conjunta;
- ingreso conjunto;
- una sola invitación;
- un solo QR operativo cuando corresponda.

## Regla

> **El tipo de acceso pertenece por defecto al grupo completo.**

No exponer diferencias de acceso entre integrantes de una misma familia/grupo en la UX normal.

El caso “madre Cena + hijo Trasnoche” se considera demasiado remoto para justificar complejidad visible.

Si en el futuro aparece evidencia real de esta necesidad, puede resolverse mediante una acción avanzada como:

> Separar integrante del grupo

y convertirlo en otra invitación/grupo.

---

# 4. Persona individual

Aunque la UX opere principalmente con grupos, cada integrante debe existir internamente como persona individual.

Esto permite conservar:

- nombre;
- asistencia;
- restricciones;
- observaciones;
- relación con el grupo;
- estado de ingreso;
- historial;
- datos necesarios para personalización.

## Principio

> **Grupo para operar. Persona para conocer.**

No obligar al usuario a administrar individualmente aquello que naturalmente ocurre en conjunto.

---

# 5. Segmento ≠ Grupo

Deben existir dos conceptos separados.

## 5.1 Grupo de invitación

Responde:

> ¿Quiénes están vinculados dentro de esta invitación?

Ejemplo:

**Familia Pérez**
- María
- Tomás
- Juana

## 5.2 Segmento

Responde:

> ¿A qué universo pertenece este grupo/persona?

Ejemplos iniciales posibles:

- Familia
- Amigos
- Colegio
- Adultos
- Especial
- Proveedores

Los segmentos pueden utilizarse para:

- filtrar;
- comunicar;
- personalizar contenido;
- aplicar preguntas;
- ordenar operación.

No confundir segmento con modalidad de acceso.

---

# 6. Tipos de acceso

## DECISIÓN CERRADA

Alista tendrá inicialmente tres tipos de acceso plantillados:

1. **Cena**
2. **Trasnoche**
3. **Trasnoche con entrada**

Estos tres cubren el núcleo esperado de la mayoría de los cumpleaños de 15.

## 6.1 Nombre de la entidad

En UX utilizar preferentemente:

> **Acceso**

o:

> **Tipo de acceso**

Evitar que “tipo de invitado” mezcle identidad de la persona con reglas operativas.

## 6.2 Plantillas, no categorías rígidas

Debe existir:

> **+ Agregar tipo de acceso**

para casos reales adicionales.

Un tipo personalizado podrá definir, progresivamente:

- nombre;
- horario habilitado;
- si requiere pago;
- precio, si corresponde;
- identificador visual;
- cupo/capacidad, si aplica.

## Regla técnica

Aunque la UI muestre un tipo simple, internamente conviene separar atributos como:

- momento/ventana de acceso;
- requiere pago;
- precio;
- cupo.

Esto evita crear infinitos enums rígidos.

## Regla de simplicidad

No mostrar atributos avanzados si no son utilizados.

---

# 7. Check-in grupal

## DECISIÓN CERRADA / MUST-HAVE

Un grupo no debe tener que mostrar QR uno por uno para ingresar junto.

### Caso de referencia real

Una madre llega con dos hijos pequeños.

La experiencia correcta es:

1. muestra un solo QR;
2. Alista identifica el grupo;
3. recepción ve a todos los integrantes;
4. puede ingresar a todos con un toque;
5. puede desmarcar a quien no haya llegado.

### Ejemplo

**Familia Pérez · 3 personas**

- ✓ María Pérez
- ✓ Tomás Pérez
- ✓ Juana Pérez

**[ Ingresan los 3 ]**

Si un integrante llega después, debe poder registrarse individualmente desde el mismo grupo.

## Regla

> Un QR puede representar operativamente una invitación/grupo sin eliminar la identidad individual de sus integrantes.

---

# 8. Check-in: estándar mínimo

El check-in es una función crítica, no una feature secundaria.

Debe incluir como mínimo:

- escaneo QR;
- búsqueda por nombre/apellido/teléfono;
- check-in de grupo;
- check-in individual dentro del grupo;
- estado de pago cuando aplique;
- alerta de “ya ingresó”;
- QR anulado/no válido;
- deshacer check-in;
- historial de operador y hora;
- walk-in / alta excepcional controlada;
- múltiples operadores.

## Respuesta visual

El resultado debe ser inmediato y muy legible:

### Válido
**✓ Entrada válida**

### Ya utilizado
**⚠ Ya ingresó — 22:14**

### Pago pendiente
**⚠ Pago pendiente**

### Anulado
**✕ Acceso no válido**

La operación de puerta debe priorizar velocidad sobre densidad de información.

---

# 9. Conectividad degradada

## MUST-HAVE TÉCNICO

El funcionamiento en recepción no puede depender de una conexión perfecta.

Debe diseñarse una estrategia para:

- lista cacheada/local;
- búsqueda local;
- validación posible sin conectividad completa;
- cola de check-ins;
- sincronización posterior;
- indicador claro de conexión/sincronización;
- resolución de conflictos.

El objetivo no es “offline total” necesariamente en la primera implementación, sino evitar que una caída breve de conectividad detenga la puerta.

---

# 10. Invitación: sin cuenta para el invitado

## DECISIÓN CERRADA

El invitado no debe crear usuario ni contraseña para confirmar o acceder a su experiencia.

### Fiesta privada

Usar link personalizado de grupo/invitación.

Alista ya sabe a quién está recibiendo.

### Fiesta abierta

Puede existir un enlace general para iniciar compra/registro.

## Principio

> Menos identificación repetida; más continuidad de contexto.

---

# 11. RSVP progresivo y condicional

## MUST-HAVE

El RSVP no debe ser un formulario largo universal.

Debe adaptarse según respuestas y contexto.

Ejemplo:

**¿Venís?**

Si NO:
- finalizar o pedir solo información imprescindible.

Si SÍ:
- acompañante, si aplica;
- nombre de acompañante;
- restricciones/necesidades;
- otras preguntas relevantes.

Las preguntas pueden variar por segmento o modalidad.

## Regla de datos

> Pedir únicamente información que vaya a mejorar una decisión o interacción posterior.

---

# 12. WhatsApp — principio central

## DECISIÓN CERRADA

> **Alista no debe sustituir al remitente personal de la invitación. Debe potenciarlo.**

Para adolescentes, el número remitente es parte de la confianza.

La invitación inicial a amigos/colegio debe poder salir desde el WhatsApp personal de la quinceañera.

Familia/adultos puede recibirla desde madre/padre u otro adulto.

## No hacer inicialmente

- no conectar WhatsApp personal mediante APIs no oficiales;
- no automatizar envíos masivos desde el número personal;
- no obligar a migrar el número de la quinceañera a WhatsApp Business;
- no hacer que la invitación inicial salga obligatoriamente desde un número central de Alista.

---

# 13. Remitente ≠ Contacto ≠ Responsable

## DECISIÓN CERRADA

Separar explícitamente tres roles.

### Remitente

Quién envía la invitación.

Ejemplo:
- Dharma.

### Contacto

Quién responde dudas del invitado.

Ejemplo:
- la madre.

### Responsable del evento

Quién administra:

- Alista;
- invitados;
- pagos;
- configuración;
- equipo.

Puede ser:

- madre/padre;
- planner;
- salón;
- productora.

No fusionar estos roles por comodidad técnica.

---

# 14. Centro de invitaciones

## MUST-HAVE / DIFERENCIADOR VERTICAL

Alista debe preparar y organizar el envío personal sin intentar reemplazar WhatsApp.

Ejemplo:

### Colegio
46 invitaciones

- 38 enviadas
- 8 pendientes

**[ Empezar a enviar ]**

Para cada invitación:

- destinatario;
- texto prearmado;
- link personal;
- preview;
- botón **Abrir WhatsApp**.

La persona puede editar el texto antes de enviarlo.

## Seguimiento

Como Alista no puede asumir que un mensaje personal fue efectivamente enviado, el estado debe ser honesto.

Estados posibles:

- Preparada
- Marcada como enviada
- Confirmada
- No asiste

Puede existir una confirmación manual:

> ¿La enviaste?

o:

> Marcar como enviada

No fingir tracking inexistente.

---

# 15. Modo “Enviar mis invitaciones”

## DIFERENCIADOR RECOMENDADO

La quinceañera no necesita acceso completo al dashboard administrativo para enviar sus invitaciones.

El responsable puede preparar todo y habilitar una vista reducida para la quinceañera.

### Acceso

Por link seguro o QR desde el teléfono.

### Puede

- ver pendientes de envío;
- abrir WhatsApp;
- revisar el mensaje;
- marcar envío.

### No puede

- borrar el evento;
- alterar pagos;
- cambiar configuración crítica;
- modificar accesos administrativos.

Esto permite que el vínculo personal permanezca en la invitación sin entregar control operativo completo.

---

# 16. Comunicación: dos capas

## 16.1 Capa personal

Principalmente para la invitación inicial.

Remitentes:

- quinceañera;
- madre/padre;
- persona conocida.

Alista prepara y organiza.

## 16.2 Capa operativa

Después de que el invitado ya interactuó con Alista:

- recordatorios;
- pago aprobado;
- pago pendiente;
- QR;
- horarios;
- ubicación;
- transporte;
- cambios.

Esta capa podrá evolucionar hacia WhatsApp Business Platform, email u otros canales según evidencia y costos.

No convertir WhatsApp Business en requisito para lanzar la experiencia personal.

---

# 17. Estados del recorrido del invitado

La interfaz debe hacer visible el ciclo real.

Dependiendo de la modalidad:

**Preparada → Enviada → Confirmada → Pagada → Ingresó**

No todos los estados aplican a todos.

Ejemplos:

### Cena
Preparada → Enviada → Confirmada → Ingresó

### Trasnoche
Preparada → Enviada → Confirmada → Ingresó

### Trasnoche con entrada
Preparada → Enviada → Confirmada/Registrada → Pagada → Ingresó

Evitar columnas o estados irrelevantes para cada caso.

---

# 18. Pagos — arquitectura de destino

## DECISIÓN CERRADA

Alista no debe utilizar la cuenta de Manso como destino normal de cobros de entradas de terceros.

El objetivo es:

> **el dinero de las entradas se acredita directamente en la cuenta de Mercado Pago del responsable definido para la fiesta.**

Puede ser:

- familia;
- salón;
- planner/organizador, según el modelo real del evento.

## Flujo objetivo

Invitado  
↓  
Alista  
↓  
Checkout Mercado Pago  
↓  
Cuenta MP del receptor del evento

Alista registra el resultado para habilitar la experiencia.

---

# 19. Mercado Pago — onboarding del receptor

## OBJETIVO UX CERRADO

Configurar la cuenta receptora no debe repetir el proceso técnico realizado por Manso para crear la integración.

La experiencia deseada es:

### Cobro de entradas

**¿Dónde querés recibir el dinero?**

**[ Conectar Mercado Pago ]**

Mercado Pago:
- autentica;
- solicita autorización.

Regreso a Alista:

> ✓ Mercado Pago conectado  
> Los cobros se acreditarán en la cuenta de María G.

## Base técnica actual

La integración debe estudiar/implementar el flujo oficial OAuth `authorization_code` de Mercado Pago para operar en nombre del vendedor autorizado.

Mercado Pago documenta que:
- OAuth permite acceso limitado sin pedir las credenciales del vendedor;
- el flujo `authorization_code` requiere consentimiento explícito del vendedor;
- entrega Access Token y Refresh Token;
- los tokens deben almacenarse de forma segura en servidor;
- las integraciones tipo marketplace utilizan el Access Token de cada vendedor para procesar sus pagos.

## Regla

La UX habla de:

> **Cobro de entradas / Conectar Mercado Pago**

No de:

- access token;
- marketplace;
- credenciales;
- API;
- OAuth.

La complejidad técnica debe quedar oculta.

---

# 20. Pagos — qué hace y qué no hace Alista

## Hace

- registra precio;
- inicia checkout;
- conoce estado del pago;
- asocia pago con invitación/grupo;
- habilita acceso cuando corresponde;
- muestra vendido/recaudado según datos disponibles;
- permite cortesías;
- gestiona cupo;
- permite cierre de venta.

## No hace por ahora

- custodiar dinero;
- usar Manso como cuenta puente;
- billetera propia;
- distribuir fondos entre múltiples terceros;
- reventa;
- marketplace financiero;
- adelantos;
- crédito.

## Split/comisión

Mercado Pago posee herramientas de marketplace/split, pero Alista **no debe activar un modelo transaccional por comisión simplemente porque sea técnicamente posible**.

Primero validar:

- modelo comercial;
- impacto fiscal;
- impacto contractual;
- regulación;
- experiencia del cliente.

---

# 21. Pago ≠ acceso individual visible

Aunque técnicamente sea necesario registrar comprador/pago/asistentes, no convertir esta distinción en una complejidad principal para el usuario si los casos reales no lo exigen.

## Regla

> Modelar lo suficiente para conciliar dinero y personas, pero operar desde grupos/invitaciones.

Si una persona paga por su grupo, la familia no necesita administrar “tickets” independientes salvo que el caso realmente lo requiera.

---

# 22. Cortesías

## MUST-HAVE para fiestas abiertas/mixtas

Permitir:

> **Marcar como cortesía**

Sin inventar un pago de $0.

Registrar:

- quién la otorgó;
- fecha;
- motivo opcional.

El acceso se habilita sin pago.

---

# 23. Cupos y cierre de venta

## MUST-HAVE para fiestas abiertas

Alista debe permitir:

- capacidad total;
- cupo de entradas pagas;
- cierre por cantidad;
- cierre por fecha/hora;
- estado “agotado”.

Nunca vender por encima de las reglas configuradas.

---

# 24. Centro de Preparación

## KILLER FEATURE / PRIORIDAD ALTA

El dashboard principal no debe ser un conjunto de gráficos decorativos.

Debe responder:

> **¿Está todo listo?**

Ejemplos:

- 17 grupos sin confirmar
- 2 pagos pendientes
- 3 acompañantes incompletos
- 2 restricciones para revisar
- Mercado Pago conectado
- QR generados
- recepción preparada

Cada pendiente debe ser accionable.

## Principio

> Alista transforma incertidumbre en tareas concretas antes de que se conviertan en problemas.

---

# 25. Nivel de preparación

Puede existir un indicador:

> **Preparación del evento: 92%**

solo si:

- es transparente;
- puede explicarse;
- cada factor es visible;
- no es una puntuación arbitraria;
- conduce a acciones concretas.

No gamificar artificialmente.

---

# 26. Inbox “Necesita tu atención”

## PRIORIDAD ALTA

Ejemplos:

> 17 grupos todavía no confirmaron.  
> **Ver**

> 2 pagos siguen pendientes.  
> **Ver**

> Martina agregó una restricción alimentaria.  
> **Revisar**

> Un acompañante fue modificado.  
> **Ver cambio**

Alista debe evolucionar de base de datos a asistente operativo.

---

# 27. Roles y UX por rol

## MUST-HAVE CON IMPLEMENTACIÓN PROGRESIVA

No todos deben ver el mismo Alista.

### Quinceañera

Prioriza:
- invitaciones;
- envío;
- estética;
- invitados/amigos;
- personalización.

### Familia

Prioriza:
- confirmaciones;
- pagos;
- pendientes;
- restricciones;
- preparación.

### Planner / salón

Prioriza:
- múltiples eventos;
- estado operativo;
- equipo;
- excepciones;
- recepción;
- reutilización.

### Recepción

Prioriza:
- buscar;
- escanear;
- validar;
- resolver.

No reducir esto solamente a permisos. La jerarquía visual debe cambiar por rol.

---

# 28. Personalización — tres niveles

## DECISIÓN DE DIRECCIÓN

La personalización no se limita a colores.

### 28.1 Visual

- colores;
- tipografías;
- fotografía;
- video;
- portada;
- fondos;
- música, si corresponde;
- motion;
- identidad de la fiesta.

### 28.2 Contenido

- mensajes;
- preguntas;
- instrucciones;
- horarios;
- bloques visibles;
- información por segmento.

### 28.3 Contextual

Lo aprendido antes modifica lo que se muestra después.

Ejemplo:

Martina:
- confirmó;
- vegetariana;
- usa transporte.

Las siguientes interacciones pueden:

- no volver a preguntar lo mismo;
- mostrar información relevante;
- preparar al equipo.

## Principio

> **Cada interacción debe mejorar la siguiente.**

---

# 29. No construir un Canva

## DECISIÓN CERRADA

No crear inicialmente un editor libre con:

- drag & drop;
- capas;
- cientos de fuentes;
- libertad total de layout.

Alista debe usar un sistema visual curado.

El usuario personaliza dentro de límites que aseguran calidad.

Posible modelo:

- universos/templates;
- color;
- foto/video;
- tipografía dentro de opciones;
- textos;
- contenido.

---

# 30. Preview por persona

## DIFERENCIADOR RECOMENDADO

En vez de solo “Preview”:

> **Ver como...**

- Martina · Colegio
- Roberto · Familia
- Proveedor

Mostrar exactamente qué verá esa persona/grupo.

Esto convierte la personalización contextual en algo comprensible para el organizador.

---

# 31. Importación y calidad de datos

## MUST-HAVE

Aceptar archivos reales y razonablemente desordenados.

Objetivo:

- importar CSV/XLSX;
- mapear columnas;
- detectar teléfonos;
- detectar nombres;
- asignar tipos;
- mostrar errores;
- detectar posibles duplicados;
- permitir fusionar.

Evitar exigir una plantilla perfecta como única entrada.

---

# 32. Duplicados

## MUST-HAVE

Detectar posibles duplicados por combinaciones como:

- teléfono;
- nombre;
- apellido;
- email, si existe.

Permitir:

> **Fusionar**

La calidad de invitados sostiene pagos, RSVP, check-in y comunicaciones.

---

# 33. Después del evento

## SEGUNDA OLA

No terminar conceptualmente en la puerta.

Posibles funciones:

- resumen de asistencia;
- no-show;
- horas de llegada;
- ventas;
- agradecimiento;
- aprendizajes para profesionales.

No construir todavía un CRM completo.

---

# 34. Seating / mesas

## SEGUNDA OLA — NO MVP CRÍTICO

Tiene afinidad con el vertical, pero agrega complejidad.

Evaluar después de obtener evidencia suficiente.

Si entra:
- aprovechar grupos;
- drag & drop;
- mesa visible para recepción;
- consistencia con invitados.

---

# 35. Transporte

## SEGUNDA OLA / VALIDAR FRECUENCIA

Potencial alto en determinados eventos.

Ejemplos:
- cupos de combi;
- punto de salida;
- ida/vuelta;
- información contextual por pasajero.

No asumir que es universal.

---

# 36. Transferencia/cambio de asistente

## VALIDAR ANTES DE HACER MUST-HAVE

Puede aparecer en fiestas abiertas.

Resolver inicialmente de forma administrativa si la frecuencia es baja.

No construir:
- reventa;
- mercado secundario.

Si se vuelve frecuente:
- cambio controlado de asistente;
- invalidación del acceso anterior;
- regeneración segura.

---

# 37. Must-have consolidado

## Núcleo actual

1. Evento privado / abierto / mixto.
2. Grupo de invitación como unidad principal.
3. Personas internas dentro del grupo.
4. Tipos de acceso plantillados: Cena / Trasnoche / Trasnoche con entrada.
5. Tipos de acceso adicionales configurables.
6. Invitación personalizada por link.
7. Invitado sin cuenta/password.
8. RSVP condicional.
9. Segmentos.
10. Centro de invitaciones + envío desde WhatsApp personal.
11. Remitente / contacto / responsable separados.
12. Mercado Pago conectado al receptor real del evento.
13. Pago asociado a la invitación/grupo.
14. Cortesías.
15. Cupo y cierre de venta.
16. QR.
17. Check-in grupal e individual.
18. Búsqueda manual.
19. Walk-ins controlados.
20. Historial/auditoría.
21. Modo degradado de recepción.
22. Centro de Preparación.
23. Pendientes accionables.
24. Roles.
25. Personalización visual.
26. Personalización de contenido.
27. Base para personalización contextual.
28. Importación XLSX/CSV.
29. Detección de duplicados.
30. Exportación/reportes operativos básicos.

---

# 38. Diferenciadores prioritarios

No son simplemente hygiene features.

## A. Centro de Preparación

> ¿Está todo listo?

## B. Grupo como unidad natural

Familias y acompañantes operan sin QR uno por uno.

## C. Invitación desde la persona correcta

Alista organiza; la quinceañera/familia conserva el vínculo.

## D. Ver como invitado

La personalización contextual se puede experimentar.

## E. UX por rol

Quinceañera, familia, planner y puerta usan superficies adecuadas a su trabajo.

## F. Pago integrado al acceso sin que Alista/Manso sea cuenta puente

Cobro, confirmación y acceso forman un único recorrido.

---

# 39. Fuera de alcance por ahora

No construir inicialmente:

- marketplace de proveedores;
- billetera;
- custodia de fondos;
- split/comisiones sin decisión de negocio;
- agenda integral de planificación;
- presupuesto total;
- contratos con proveedores;
- chat interno;
- red social;
- muro de fotos completo;
- IA como protagonista;
- app nativa;
- editor tipo Canva;
- CRM genérico;
- gestión integral de salones;
- seating sofisticado;
- reventa de entradas;
- automatización no oficial de WhatsApp personal.

---

# 40. Filtro para cualquier nueva feature

Antes de aprobarla responder:

1. ¿Qué situación real la originó?
2. ¿Con qué frecuencia ocurre?
3. ¿Quién la necesita?
4. ¿Reduce incertidumbre o pasos?
5. ¿Puede resolverse con una función ya existente?
6. ¿Hace más compleja la experiencia cotidiana por cubrir una excepción?
7. ¿Fortalece la especialización en 15?
8. ¿Genera valor comercial o solo paridad competitiva?
9. ¿Debe estar en MVP, segunda ola o fuera de alcance?
10. ¿Cómo sabremos que funcionó?

---

# 41. Principio maestro de UX

> **La complejidad puede existir por debajo. No debe trasladarse automáticamente al usuario.**

Ejemplos:

- el backend puede distinguir pago/persona/grupo;
- la familia ve una invitación simple;
- el backend puede separar ventana de acceso/pago/cupo;
- el usuario ve “Cena”, “Trasnoche” y “Trasnoche con entrada”;
- el sistema puede almacenar cada integrante;
- en puerta se ingresa a la familia con un toque.

Esta regla debe guiar arquitectura y UI.

---

# 42. Prioridad de próximas decisiones

Antes de actualizar definitivamente el brief de web y sistema, quedan por cerrar o validar:

1. pricing final por evento / packs profesionales;
2. alcance exacto de personalización en primera versión;
3. onboarding de Mercado Pago con una cuenta externa real;
4. experiencia completa del Centro de invitaciones en WhatsApp;
5. definición exacta del Centro de Preparación;
6. inventario del producto actual vs este documento;
7. qué features deben entrar antes de los próximos eventos confirmados.

---

# 43. Referencias técnicas externas vigentes al momento de este documento

Para Mercado Pago, usar siempre documentación oficial vigente antes de implementar.

### OAuth
https://www.mercadopago.com.ar/developers/es/docs/security/oauth

### Authorization Code / Access Token
https://www.mercadopago.com.ar/developers/es/docs/security/oauth/creation

### Checkout Pro Marketplace
https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/how-tos/integrate-marketplace

### Split Payments 1:1
https://www.mercadopago.com.ar/developers/es/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace

Estas referencias técnicas no modifican por sí solas la decisión de negocio.

---

# 44. Síntesis

Alista debe ser extremadamente simple para quien organiza y para quien llega, aunque internamente maneje:

- grupos;
- personas;
- pagos;
- estados;
- reglas;
- permisos;
- accesos;
- comunicaciones.

La especialización debe sentirse precisamente en esas simplificaciones.

> **No queremos que el usuario aprenda cómo funciona un sistema de eventos.  
> Queremos que Alista ya entienda cómo funciona su fiesta.**

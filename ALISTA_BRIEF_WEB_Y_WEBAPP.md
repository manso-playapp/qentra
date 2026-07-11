# Brief para la web y la webapp

> Nombre de trabajo: **Alista**. Confirmar disponibilidad legal y digital antes de un lanzamiento publico definitivo.

## Objetivo

Construir una web de producto y una webapp que demuestren una idea simple: preparar cada llegada antes de que se convierta en un problema operativo.

La web publica debe convertir a organizadores profesionales. La webapp debe permitir que equipos organicen invitados, anticipen pendientes y operen accesos con autonomia.

## Audiencias y mensajes

### Comprador prioritario

Organizadores, productores, planners, salones, agencias, equipos de ceremonial, instituciones y responsables de eventos corporativos.

Necesitan una operacion confiable, repetible y delegable.

### Usuario operativo

Coordinadores, recepcionistas, acreditadores y equipos de produccion.

Necesitan informacion inmediata, estados claros y un camino simple para resolver excepciones.

### Beneficiario emocional

El anfitrion final: una familia, empresa, marca o institucion. Quiere dedicar su atencion a las personas, no a la puerta.

### Mensaje rector

> Alista ayuda a organizadores y equipos a preparar cada llegada para que el anfitrion pueda estar presente y cada invitado se sienta esperado.

## Home: jerarquia recomendada

### Hero

**Llegá al evento con todo preparado.**

Gestiona invitaciones, confirmaciones y accesos desde un solo lugar. Detecta pendientes antes, coordina a tu equipo y recibe sin depender de planillas, mensajes ni decisiones de ultimo momento.

CTA principal: **Preparar un evento**

CTA secundario: **Ver como funciona**

### Prueba del problema

Mostrar que los problemas de la puerta empiezan antes: datos incompletos, acompanantes sin registrar, acceso sin definir, necesidades no contempladas y equipo sin contexto.

### Mecanismo

Representar una secuencia clara:

> Invitar -> confirmar -> preparar -> recibir -> aprender

### Resultado

Mostrar beneficios operativos verificables:

- informacion centralizada;
- pendientes visibles antes del evento;
- roles y criterios para el equipo;
- accesos y excepciones preparados;
- visibilidad sin convertir al anfitrion en operador.

### Cierre humano

> Todo listo para que el anfitrion pueda estar presente.

## Paginas y recorridos iniciales

- Inicio: propuesta de valor, funcionamiento, prueba y CTA.
- Producto: invitaciones, confirmaciones, invitados, accesos, equipo y reportes.
- Para organizadores: preparacion, autonomia y visibilidad.
- Para equipos de recepcion: encontrar, validar y resolver en pocos pasos.
- Eventos sociales: preparacion para que la familia disfrute el evento.
- Eventos corporativos: informacion clara, accesos preparados y coordinacion en tiempo real.
- Solicitar demo o crear evento: conversion principal.

No crear paginas vacias: cada ruta publica debe responder a una necesidad concreta y tener una accion siguiente.

## Alcance funcional del MVP

1. Eventos: crear, editar y administrar eventos.
2. Invitados: alta manual, importacion, categorias, estados y acompanantes.
3. Invitaciones: enlaces seguros, RSVP y captura de informacion pertinente.
4. Preparacion: pendientes, inconsistencias, necesidades particulares y estados accionables.
5. Accesos: QR u otro mecanismo, validacion, check-in y manejo de excepciones.
6. Equipo: roles, permisos y vistas segun responsabilidad.
7. Reportes: asistencia, estado de confirmaciones, incidencias y aprendizajes basicos.

## Principios de UX

- Pedir datos solo cuando tengan un uso claro.
- Convertir respuestas en una accion o alerta comprensible.
- Priorizar pendientes y decisiones reales sobre paneles decorativos.
- Diseñar para movil en operacion de puerta y para escritorio en preparacion.
- Mostrar contexto suficiente para resolver sin llamar al anfitrion.
- Mantener lenguaje respetuoso: una persona no es un registro a procesar.
- Usar automatizacion para lo repetitivo; derivar a criterio humano lo sensible.
- Hacer visibles privacidad, consentimiento y control de datos cuando corresponda.

## Direccion visual: preparacion humana

La identidad debe combinar estructura clara y cuidado perceptible.

- Informacion ordenada, estados estables y jerarquia facil de escanear.
- Espacios preparados, progresion y elementos que encuentran su lugar.
- Tecnologia discreta; evitar iconografia de seguridad, QR como simbolo, candados y lenguaje policial.
- Interfaz precisa, serena y accesible; no una estetica festiva ni una consola fria.
- El movimiento, cuando exista, debe comunicar progreso y preparacion, no decoracion.

## Criterios tecnicos

- Mantener Next.js App Router, TypeScript, Tailwind CSS y Supabase conforme a la arquitectura existente.
- Reutilizar los patrones, componentes y politicas ya presentes en el repositorio.
- Mantener logica sensible en backend: estados, validacion de acceso, QR, duplicados, horarios y aforo.
- No usar claves de servicio en el frontend.
- Disenar permisos y RLS antes de exponer operaciones de invitados o check-in.

## Indicadores de valor

El producto debe poder demostrar, cuando haya datos reales:

- porcentaje de invitaciones respondidas;
- porcentaje de informacion completa antes del evento;
- pendientes resueltos antes de la llegada;
- tiempo promedio de check-in;
- incidencias y resolucion;
- consultas que el equipo resolvio sin escalar al anfitrion;
- asistencia y no-show.

No inventar metricas ni resultados en comunicacion publica.


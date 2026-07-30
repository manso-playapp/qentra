<!--
====================================================================================
 PLANTILLA — Sistema de continuidad para proyectos (multi-motor + multi-máquina)
====================================================================================
 CÓMO USAR ESTA PLANTILLA (borrá este bloque de comentario al terminar):
 1. Copiá este archivo a `docs/CONTINUIDAD.md` en el proyecto nuevo.
 2. Reemplazá cada {{HUECO}} con lo del proyecto. Si algo no aplica, borralo (no lo dejes vacío).
 3. Al abrir cualquier motor en ese proyecto, decile:
       "Leé docs/CONTINUIDAD.md y después decime cómo seguimos."
 4. Es un doc VIVO: se sobrescribe en su lugar al cerrar cada frente. NO crear copias con fecha.
 Regla de oro del sistema: lo que tenga que sobrevivir al cambio de motor o de máquina va en el REPO.
====================================================================================
-->

# EMPEZÁ ACÁ — Continuidad de {{NOMBRE_DEL_PROYECTO}}

> **Para el humano:** al abrir un motor nuevo (Claude Code, Codex, GLM, el que sea), decile:
> *"Leé `docs/CONTINUIDAD.md` y después decime cómo seguimos."*
>
> **Para la IA que lee esto:** este documento es el punto de entrada. NO reemplaza la fuente de verdad
> — te dice en qué orden leerla y en qué estado está todo HOY. Doc **vivo**: se **sobrescribe en su
> lugar** al cerrar cada frente. No crees copias con fecha (los snapshots datados se vuelven basura).

---

## 1. Orden de lectura
<!-- Listá los docs del proyecto en el orden en que hay que leerlos. Ejemplos abajo, ajustá. -->
1. **`{{DOC_PRINCIPIOS}}`** — principios y decisiones tomadas. Manda sobre todo lo demás.
2. **`{{DOC_PLAN}}`** — dónde estamos y qué frente sigue. Fuente de verdad del roadmap.
3. **`{{DOC_CONVENCIONES}}`** — convenciones que causan error silencioso. Leer antes de tocar {{ÁREA}}.
4. Este archivo — el estado de hoy y las reglas para no romper nada.

---

## 2. Método (no negociable)
- **Un frente por vez.** Ante un pedido: **diagnóstico + propuesta en texto, SIN tocar código**;
  esperá el OK del dueño; recién ahí implementás.
- **Nada se mergea a `{{RAMA_PROD}}` sin OK explícito.** Mergear a esa rama {{DISPARA_QUÉ, p.ej. "dispara producción"}}.
- {{OTRA_REGLA_DE_MÉTODO_DEL_PROYECTO}}.

## 3. Reglas de oro (seguridad / integridad — en cada paso)
<!-- Las invariantes que NO se pueden violar en este proyecto. Ejemplos genéricos; poné las reales. -->
- {{REGLA_1 — p.ej. "RLS es la única barrera: toda tabla operativa nace con tenant_id + policy"}}.
- {{REGLA_2 — p.ej. "nunca commitear secretos; van en el gestor de secretos, no en el repo"}}.
- {{REGLA_3 — p.ej. "las migraciones se aplican Y se versionan como archivo; la divergencia repo↔base es el riesgo #1"}}.
- **Después de {{CAMBIO_SENSIBLE}}:** correr {{CHEQUEO — p.ej. "el linter de seguridad / los tests / el chequeo de advisors"}}.

## 4. Trabajar con varios motores sin perder el hilo
- **Repartí por lo que está en juego, no por lo disponible:**
  - Lo delicado ({{p.ej. seguridad, integridad del dato, plata, auth}}) → **el motor más fuerte**.
  - Lo mecánico (boilerplate, renombres, andamiaje de tests, UI directa, docs) → motores gratuitos.
  - Navegación de código → el índice/grafo que tenga tu motor (si no tiene, grep/read).
- **Un solo motor por frente.** Dos motores sobre los mismos archivos = conflictos y drift.
- Al cerrar un frente: actualizá `{{DOC_PLAN}}` **y** este archivo, en el mismo commit.

## 5. Flujo de trabajo (mantener docs frescos + ahorrar tokens)
> Aplica a CUALQUIER motor. Lo específico de un motor va al final, marcado para saltear.

### La única memoria durable es el repo
- Los docs del repo son lo ÚNICO que cruza de un motor a otro y de una máquina a otra. Lo importante va ACÁ.
- La memoria o el estado interno de cualquier motor es efímero y **no es un puente**. No delegues en eso
  nada que tenga que sobrevivir al cambio de motor.

### Mantener los docs frescos sin que sea una carga
- Se actualiza **al CERRAR un frente**, no mientras trabajás, y **en el MISMO commit**.
- En este archivo normalmente sólo cambia la §6 "Estado HOY". El resto es estable.
- Actualizar de más = churn y tokens. Una vez por frente y listo.

### Ahorrar tokens (en orden de impacto)
1. **Sesiones cortas, una por frente.** Cerrás → actualizás docs → **arrancás sesión nueva** (lee estos
   docs curados en vez de arrastrar horas de historia). Todo motor reenvía el contexto acumulado cada
   turno; una sesión maratónica se encarece al final. **Palanca #1.**
2. **Índice antes que leer archivos enteros.** Traé la función puntual, no el archivo completo.
3. **Filtrar volcados grandes.** Salidas enormes se procesan con script; en consultas, pedí sólo lo necesario.
4. **Pedir respuestas cortas / "modo económico"** cuando alcanza.

### Notas específicas por motor (saltear las que no apliquen)
- **{{MOTOR_A, p.ej. Claude Code}}:** {{herramientas/skills que tiene y para qué}}.
- **Otros motores:** el equivalente sin esas herramientas es grep/read y {{panel/CLI del servicio}}. El
  método y las reglas no cambian.

---

## 6. Estado HOY (actualizar en cada cierre de frente)
**Fecha de este estado:** {{AAAA-MM-DD}}.
**Rama de trabajo:** `{{RAMA}}`.

**En producción, funcionando:**
- {{QUÉ_ESTÁ_VIVO_Y_ANDANDO}}.

**Frentes abiertos / hilos sueltos:**
- {{QUÉ_QUEDÓ_A_MEDIAS + el detalle que un motor nuevo necesita para no romperlo}}.

**Decisiones cerradas (NO reabrir como pendientes):**
- {{DECISIÓN_YA_TOMADA + por qué, para que nadie la vuelva a proponer}}.

---

## 7. Datos de entorno (hechos, no secretos)
- **Servicios en la nube:** {{Supabase / Firebase / etc.}} (id: `{{ID}}`), {{hosting, p.ej. Vercel}},
  {{otros: correo, pagos}}. Se acceden desde cualquier máquina; no se sincronizan.
- **Repo:** `{{ORG/REPO}}`. {{Gotcha de auth si aplica, p.ej. "git push requiere la cuenta X activa"}}.
- **Deploy:** {{cómo se despliega — p.ej. "push a main → prod; push a rama → preview"}}.
- **Stack y comandos:** {{stack}}. Build `{{cmd_build}}`. Tests `{{cmd_test}}`. Local `{{cmd_dev}}`.
- **Índice/grafo de código (si usás uno):** {{qué cubre y qué NO — p.ej. "no indexa las migraciones"}}.

---

## 8. Trabajar desde otra máquina (sin que el proyecto retroceda)
**La idea:** git es el puente entre máquinas. Todo lo commiteado y pusheado aparece con un `git pull`.
Lo que NO viaja por git se repone una vez por máquina (abajo). La nube no se sincroniza, se accede.

### Rutina de CIERRE — cada vez que parás, aunque sea a mitad de algo
```
git add -A && git commit -m "wip: en que estaba" && git push
```
Mejor un commit feo pusheado que trabajo prolijo en una sola máquina. Si cerraste un frente, actualizá
la §6 en el mismo commit.

### Rutina de ARRANQUE en la otra compu
```
git pull && {{cmd_instalar_deps, p.ej. npm install}}
```
Y `git status` para confirmar que no quedó nada colgado.

### Reponer una vez por máquina (NO está en git, a propósito)
- **Dependencias** → `{{cmd_instalar_deps}}`.
- **Archivo de entorno local** → copiar de `{{ARCHIVO_EJEMPLO, p.ej. .env.example}}` y completar los
  valores desde {{DÓNDE, p.ej. el panel de Supabase}}.
- **Auth de git / CLI** → {{p.ej. "gh auth login con la cuenta X"}}.
- {{OTROS_ARTEFACTOS_LOCALES, p.ej. datos pesados gitignored que viven en un Drive}}.

### Qué es nube (no se repone, se accede)
{{Listar servicios cloud: base, auth, hosting, correo, pagos}}. Desde otra máquina entrás con las mismas
credenciales; no hay nada que sincronizar.

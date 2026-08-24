# Alista — Context files for coding agents

Place these files in the **root of the repository**:

```text
/CLAUDE.md
/GEMINI.md
/GLM.md
```

Current strategic and handoff documentation:

```text
/docs
  HANDOFF_NUEVA_WEB_2026-08-24.md
  ALISTA_ESTRATEGIA_NUEVA_WEB.md
  ALISTA_WEB_ART_DIRECTION.md
  PLAN_TICKETS_NUEVA_WEB.md
  /Product
    ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md
```

## Claude Code

`CLAUDE.md` is the native project context file and is automatically read by Claude Code.

## Gemini CLI

`GEMINI.md` is the native context file. It imports the shared Alista strategic documents using `@file` syntax.

## GLM

GLM models are commonly used through another coding host, so there is no single universal auto-load filename.

- If GLM is used through Claude Code, `CLAUDE.md` is the primary context.
- If used through another host, attach/import `GLM.md` according to that host's project-instruction mechanism.
- Keep `GLM.md`, `CLAUDE.md` and `GEMINI.md` aligned whenever a strategic rule changes.

## Principle

The strategic documents contain the product truth.

The agent-specific files contain **how each coding agent must use that truth while working**.

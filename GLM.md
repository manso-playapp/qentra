# GLM.md — Alista
## Portable project context for GLM-based coding agents

> NOTE: GLM models can be used through different coding hosts (Claude Code, Roo Code, Cline, OpenCode, etc.). This file is therefore a portable context document. If GLM is running inside Claude Code, `CLAUDE.md` is the primary automatically loaded project instruction file. Keep this file aligned with it.

---

## Project

Alista is a real product being developed and validated with real events.

For the current market-entry stage, Alista is specialized in **cumpleaños de 15**.

Do not reposition Alista as a generic event platform unless explicitly instructed or supported by new evidence.

The codebase may remain architecturally scalable, but the perceived product, communication and UX priorities are verticalized around the world of 15s.

---

## Strategic sources of truth

Before substantial product, UX, UI, communication or architecture decisions, read:

- `docs/HANDOFF_NUEVA_WEB_2026-08-24.md`
- `docs/ALISTA_ESTRATEGIA_NUEVA_WEB.md`
- `docs/ALISTA_WEB_ART_DIRECTION.md`
- `docs/Product/ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md`
- `docs/PLAN_TICKETS_NUEVA_WEB.md`

Do not assume old copy or code comments reflect the current strategy.

---

## Core definition

Alista helps organizers and teams prepare each arrival so the host can be present and each guest feels expected.

Market-entry thesis:

> Technology may be horizontal. Product perception and marketing are vertical.

The short-term goal is to understand and serve 15s exceptionally well rather than appearing universal.

---

## Who Alista speaks to

### Primary buyer
Recurring professionals:
- planners;
- venues;
- producers;
- agencies;
- organizers;
- providers.

### Operational users
- coordinators;
- reception teams;
- event staff;
- family members involved in organization.

### Narrative hero
- host;
- family;
- quinceañera.

### Final beneficiary
- guest.

Communication should sell operational value first and emotional benefit second.

---

## Communication rule

Use this hierarchy:

1. Real operational friction.
2. How Alista prepares/resolves it.
3. Concrete result.
4. Emotional consequence.

Key principle:

> First resolve the operation. Then show the experience that becomes possible.

Avoid generic “enjoy your event” messaging as the principal professional value proposition.

---

## Product philosophy

Alista exists to reduce operational uncertainty and improve the experience of receiving people.

Prioritize:
- useful knowledge;
- anticipation;
- coordination;
- autonomy;
- care;
- presence.

Reject:
- unnecessary surveillance/data;
- complexity for its own sake;
- fear-based security positioning;
- generic feature accumulation;
- technology-first storytelling.

Every interaction should improve the next one.

---

## Two strategic fronts not yet reducible to ordinary features

### Payments
Before building payment capabilities, determine:
- payer;
- pricing model;
- role of venues/planners;
- direct vs B2B2C sales;
- whether Alista handles, facilitates or stays outside transaction flows;
- legal, accounting and operational risks.

Do not accidentally turn Alista into a fintech.

### Personalization
Personalization may become a major 15s-specific advantage.

Consider:
- visual personalization;
- invitation identity;
- segment/group-specific messages;
- conditional questions;
- differentiated guest instructions;
- event templates;
- relevant prior information improving later interactions.

Do not define personalization as colors/themes only.

---

## Website direction

The next website should be rebuilt around the 15s specialization.

It should:
- live visibly inside the culture of 15s;
- still sell to professionals;
- demonstrate operational value;
- use real-event evidence when useful;
- show product, not only emotion;
- support direct family purchase and professional recurring distribution.

Real video from an actual 15 can be used if it helps show the relationship between preparation and lived experience.

---

## Engineering rules

- Read before rewriting.
- Preserve existing working functionality.
- Prefer incremental changes.
- Respect existing stack/conventions.
- Keep TypeScript strict.
- Validate inputs.
- Preserve Supabase security/RLS.
- Never expose credentials.
- Test critical guest/RSVP/invitation/check-in flows.
- Verify mobile guest experiences.
- Keep reception fast and resilient.

For meaningful changes, document:
- problem;
- target user;
- strategic reason;
- acceptance criterion;
- verification.

---

## Decision discipline

Do not reopen strategically closed decisions because a new idea sounds attractive.

Only reconsider them with:
- user evidence;
- market evidence;
- product evidence;
- legal constraint;
- technical constraint;
- explicit project-owner instruction.

Avoid creative and technical scope creep.

---

## Collaboration

The project owner is a designer/creative director rather than a programmer.

Explain technical decisions in clear Spanish.

Prefer concrete recommendations and minimal friction.

Do not silently encode strategic assumptions into implementation.

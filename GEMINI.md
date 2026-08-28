# GEMINI.md — Alista

## Purpose

This repository contains **Alista**, a real product being developed and validated in real events.

At the current launch stage, Alista is specialized in **cumpleaños de 15**.

Do not generalize the positioning back into “software for all events” unless the project owner explicitly changes that decision or new evidence requires it.

The architecture may remain reusable for future verticals, but marketing, UX priorities, product language and public presentation should be built around the 15s vertical.

---

## Read these documents first

For any substantial task, use the strategic documentation as source of truth:

@./docs/CONTINUIDAD.md — **START HERE.** Today's state, open fronts, reading order.
@./docs/Product/ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md — canonical product/UX decisions.
@./docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md — event ownership, who buys, the paywall
  and Mercado Pago. Closes §42 of the previous doc and **overrides it on ownership/buyer/payments**.
@./docs/DHARMA_CASE_PRIVACY.md — privacy and minors.
@./docs/ALISTA_ESTRATEGIA_NUEVA_WEB.md — website direction. WARNING: predates the buyer change;
  where it treats the planner/venue as the main buyer, the ownership doc wins.

If old implementation or copy conflicts with these documents, identify the inconsistency rather than silently preserving outdated strategy.

---

## Strategic center

Alista helps organizers and teams prepare each arrival so the host can be present and every guest feels expected.

Current thesis:

> The technology can be horizontal. The perceived product and marketing are vertical.

The immediate ambition is not to prove Alista works for every event.

It is to become unusually good at understanding and solving the world of 15s.

---

## Audience model

### Primary commercial buyer — the event's responsable (typically the mother)

**DECIDED 2026-08-28.** The product is personal and self-managed: the responsable owns the
account, owns the event data, connects Mercado Pago and pays Alista.

Planners, venues, producers and agencies remain important — as **collaborators invited into an
event**, and as an acquisition channel. They are **not** the account owner and **not** the buyer.

Reason: Mercado Pago treats ticket collection as a service payment, holds funds ~30 days and makes
the collector the seller of record for tax purposes. A planner cannot hold money that is not
theirs. Full argument: `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` §1.

### Operational user
- reception teams;
- coordinators;
- event staff;
- family members involved in management.

### Narrative hero
The host / family / quinceañera.

### Final beneficiary
The guest.

Do not write all messaging as if the visitor were only the mother, father or quinceañera.

---

## Message hierarchy

Default order:

1. Operational problem.
2. Alista mechanism.
3. Concrete result.
4. Emotional consequence.

Principle:

> First solve the operation. Then show what that resolution allows people to live.

Emotion is important in the 15s vertical, but should not replace proof of utility.

---

## Product principles

Prioritize:
- useful information;
- anticipation;
- preparation;
- clear coordination;
- team autonomy;
- perceptible care;
- human presence.

Avoid:
- surveillance logic;
- unnecessary data collection;
- complexity as a feature;
- fear-based access language;
- technology as protagonist;
- adding generic event-software features without a validated problem.

Every interaction should improve the next one.

---

## Current high-priority strategic work

### Payments
Treat payments as a business-model decision before treating them as a feature.

Clarify:
- who pays Alista;
- pricing per event vs subscription vs partner inclusion;
- whether venues/planners bundle Alista;
- what event-related payments Alista should or should not touch;
- legal/accounting/risk implications;
- whether a payment flow strengthens the central experience.

Do not turn the product into a fintech accidentally.

### Personalization
Treat personalization as a potential core differentiator.

Explore:
- visual identity;
- event-specific invitations;
- per-group content;
- conditional forms;
- tailored guest information;
- segmented arrival instructions;
- reusable professional templates;
- personalized experiences based on relevant prior information.

Do not equate personalization with changing colors only.

---

## Website

The previous generic website is no longer the target strategy.

The new website should:
- explicitly speak from the world of 15s;
- remain credible to planners and venues;
- demonstrate product;
- use operational proof;
- show real people/events when useful;
- balance desire and functionality;
- support B2C and B2B2C acquisition.

Real event footage can be used in the hero when it helps connect preparation with the experience that follows.

---

## Engineering rules

Before editing:
- inspect existing architecture;
- understand current working flows;
- avoid unnecessary rewrites.

During implementation:
- prefer small coherent changes;
- preserve working behavior;
- follow existing TypeScript/style conventions;
- keep validation/security/RLS intact;
- never expose secrets;
- test RSVP, guest management, invitation, access and check-in paths;
- verify guest-facing mobile UX;
- keep reception flows fast.

For substantial changes, explain:
- problem;
- user;
- strategic reason;
- uncertainty reduced;
- acceptance criterion;
- test/verification.

---

## Closed-decision discipline

Do not reopen:
- Alista naming;
- initial 15s verticalization;
- core positioning;
- human/operational hierarchy;

unless there is new evidence or an explicit owner decision.

Avoid scope creep and speculative platform expansion.

---

## Collaboration style

The project owner is a designer/creative director, not a programmer.

Use clear Spanish when explaining implementation decisions.

Prefer:
- direct recommendations;
- visible tradeoffs;
- concrete next steps;
- minimal unnecessary terminal work.

Do not silently make strategic decisions through code.

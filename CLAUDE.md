# CLAUDE.md — Alista

## Project identity

Alista is a product currently being built and validated in real events.

For the current go-to-market stage, Alista is **specialized in cumpleaños de 15**.

Do NOT reposition it as a generic event platform unless explicit new evidence or a direct user decision changes this strategy.

The technology may remain scalable to other event verticals, but the **product perceived by the market, communication, UX priorities and commercial language are verticalized around 15s**.

---

## Mandatory strategic context

Before making meaningful decisions about product, UX, UI, copy, architecture, onboarding, website, pricing, payments, personalization or growth, read the relevant documents:

- `docs/CONTINUIDAD.md` — **START HERE.** Today's state, open fronts, reading order.
- `docs/Product/ALISTA_PRODUCTO_DECISIONES_MUST_HAVE.md` — canonical product/UX decisions.
- `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` — event ownership, who buys, the paywall
  and Mercado Pago. Closes §42 of the previous doc and **overrides it on ownership/buyer/payments**.
- `docs/DHARMA_CASE_PRIVACY.md` — privacy and minors.
- `docs/ALISTA_ESTRATEGIA_NUEVA_WEB.md` — website direction. WARNING: predates the buyer change;
  where it treats the planner/venue as the main buyer, the ownership doc wins.

These documents are the strategic source of truth.

If the code, old copy or README conflicts with them, do not silently follow the old implementation. Flag the conflict and propose the smallest coherent correction.

---

## Core strategic definition

Alista helps organizers and teams prepare each arrival so that the host can be present and every guest feels expected.

Current market-entry thesis:

> The technology can be horizontal. The perceived product and marketing are vertical.

Alista should aim to become deeply associated with the 15th-birthday category before expanding.

---

## Audience hierarchy

Do not confuse the narrative hero with the commercial buyer.

### Primary commercial buyer — the event's responsable (typically the mother)

**DECIDED 2026-08-28.** The product is personal and self-managed: the responsable owns the
account, owns the event data, connects Mercado Pago and pays Alista.

Planners, venues, producers and agencies remain important — as **collaborators invited into an
event**, and as an acquisition channel. They are **not** the account owner and **not** the buyer.

Reason: Mercado Pago treats ticket collection as a service payment, holds funds ~30 days and makes
the collector the seller of record for tax purposes. A planner cannot hold money that is not
theirs. Full argument: `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` §1.

### Operational users
- coordinators
- reception/check-in teams
- event staff
- family members when they actively manage the event

### Narrative hero
- the host / family / quinceañera

### Final beneficiary
- the guest

Marketing should first demonstrate operational value, then show the emotional benefit.

---

## Communication hierarchy

Use this order by default:

1. Recognize a real operational problem.
2. Show how Alista prepares or resolves it.
3. Demonstrate the concrete result.
4. Show the emotional consequence.

Key rule:

> First solve the operation. Then show what that resolution allows people to live.

Avoid leading professional-facing pages with generic emotional claims such as “viví el momento” without first establishing concrete value.

---

## Core brand principles

- Preparation over improvisation.
- Useful knowledge over data accumulation.
- Anticipation over emergency.
- Clear coordination over dependence on one person.
- Perceptible care over processing people.
- Human presence over software protagonism.
- Simplicity over visible complexity.
- Evidence over inflated promises.

Every interaction should improve the next one.

---

## Product filter

Before adding a feature, answer:

1. What real problem does it solve?
2. For whom?
3. What uncertainty does it reduce?
4. What information does it require?
5. Is that information necessary and proportional?
6. Does it make the team more autonomous?
7. Does it return more attention than it consumes?
8. Is it specific enough to strengthen Alista's understanding of 15s?
9. Can the current product truthfully demonstrate the promise?

Do not add features merely because they are common in event software.

---

## Current strategic fronts

Two areas require deliberate product/business decisions before being treated as ordinary features:

### Payments — RESOLVED 2026-08-28

Alista is **not** a fintech and never custodies money. Settled:

- **Ticket money goes straight to the event responsable's own Mercado Pago account**, via OAuth
  per event (`event_payment_accounts` is keyed by `event_id`). Alista is a facilitator, never a
  bridge account.
- **The collector must be the responsable**, never the planner: MP holds funds ~30 days and makes
  the collector the seller of record for tax purposes.
- **Mercado Pago only appears in events with paid access.** A private party never touches it.
- **Alista is paid per event**, from a personal account. No organization/pack layer.
- **Payment unlocks the invitation links, not "sending"** — Alista does not send; the invitation
  goes out from the quinceañera's own WhatsApp. What is gated is issuing/activating
  `invitation_tokens`.
- **The paywall never lives in RLS.** It is state, not permission: the owner reaches her own data
  whether she paid or not.

Full reasoning and what remains: `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md`.

### Personalization
Personalization is potentially a major vertical differentiator.

Do not reduce it to themes/colors.

Consider:
- visual identity per event;
- invitation content;
- different information by guest/group;
- conditional questions;
- tailored instructions;
- family/friends/school/adults/providers segments;
- personalized arrival experience;
- reusable templates for planners/venues.

---

## Website direction

The website must be rebuilt around the 15s specialization rather than simply renaming the previous generic site.

The site should:
- explicitly inhabit the world of 15s;
- retain professional credibility;
- demonstrate the product;
- show operational preparation;
- use real event evidence where useful;
- balance aspiration with concrete utility;
- support both direct-family and B2B2C acquisition.

Real footage may be used in the hero if it demonstrates the relationship between preparation and the experience that follows. Do not use footage merely as generic party decoration.

---

## Engineering behavior

- Inspect the existing implementation before changing architecture.
- Preserve working behavior unless there is a documented reason to change it.
- Prefer small, reviewable changes.
- Do not rewrite the app from scratch.
- Follow the existing stack and conventions unless there is a strong technical reason not to.
- Keep TypeScript strict.
- Validate inputs.
- Respect Supabase/RLS/security boundaries.
- Do not expose secrets.
- Test critical guest, RSVP, invitation, access and check-in flows.
- Verify mobile behavior for guest-facing experiences.
- Reception/check-in must remain fast and resilient.

When proposing a significant change, state:
- problem;
- user;
- strategic reason;
- uncertainty reduced;
- acceptance criterion;
- verification/test.

---

## Decision discipline

Alista has intentionally closed several strategic decisions.

Do not reopen naming, verticalization, category or core positioning because a new idea is aesthetically attractive.

Closed as of 2026-08-28 — do not re-present these as open questions:

- **Buyer and owner = the event's responsable (the mother).** Planner is an invited collaborator.
- **No organization/account layer.** Per-event pricing, personal account.
- **Event ownership is the authorization primitive** (`events.owner_user_id`), and transferable.
  An event must never be left ownerless.
- **The demo event and the real event are the same row.** Payment changes its state.
- **Payment unlocks the invitation links, not "sending".**
- **The paywall is state, not RLS.**
- **Alista staff support access is total, permanent and unlogged.** Deliberate;
  `is_alista_staff()` is the single place to tighten it if that ever changes.

Reopen a closed decision only when there is:
- new user evidence;
- product evidence;
- market evidence;
- legal constraint;
- technical impossibility;
- explicit owner decision.

Avoid creative scope creep.

---

## Working style

The project owner is a designer/creative director rather than a programmer.

When giving implementation guidance:
- explain consequences in plain Spanish;
- avoid unnecessary terminal complexity;
- make decisions visible;
- prefer concrete next actions;
- do not hide important tradeoffs behind jargon.

When coding, be autonomous, but do not silently change strategy.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

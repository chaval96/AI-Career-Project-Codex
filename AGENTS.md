# AGENTS.md

## Purpose
This repository implements AI Career Path OS.
All coding and planning work must align to repository documentation first.

## Source Of Truth (Read Before Any Change)
1. `docs/ux_spec.md`
2. `docs/architecture.md`
3. `docs/ops_spec.md`
4. `docs/implementation_backlog.md`
5. `docs/api_openapi.yaml`
6. `docs/data_dictionary.md`

If these documents conflict, resolve in this priority order:
1) `docs/api_openapi.yaml` and `docs/data_dictionary.md` for API/schema contracts  
2) `docs/ux_spec.md` for page behavior and acceptance criteria  
3) `docs/architecture.md` for service boundaries and pipeline rules  
4) `docs/ops_spec.md` for safety/monitoring/compliance requirements

## Required Working Rules
- Always read relevant sections in `docs/*` before implementing.
- Do not invent routes, request/response fields, or database fields outside documented specs.
- Treat `docs/api_openapi.yaml` and `docs/data_dictionary.md` as contract authority.
- If implementation requires contract/schema changes, update both docs in the same change set.
- Preserve profiling safeguards and consent requirements defined in `docs/ux_spec.md` and `docs/ops_spec.md`.
- Keep confidence/uncertainty and explanation artifacts in user-facing model outputs.

## Delivery Rules
- Implement work in backlog order unless the user explicitly reprioritizes.
- Work one ticket at a time and verify acceptance criteria for that ticket.
- Add or update automated tests for every behavior change.
- Do not mark a ticket complete until tests pass and acceptance criteria are checked.

## Page-Level UX Enforcement
For each MVP page route in `docs/ux_spec.md`, ensure:
- Header and progress indicator are present where required.
- Save and resume later is available in onboarding.
- "Why we ask this" guidance is present on relevant fields.
- Error and retry states are implemented.

## Operational Enforcement
- Maintain observability hooks for funnel, reliability, and model quality metrics.
- Do not ship changes that bypass consent, deletion, or export controls.
- Keep outputs contestable: show why, report issue, request human review pathways.

## Hard UX Gate (must pass before merge)
- All routes listed in docs/ux_spec.md exist and render.
- Onboarding is mandatory before /app/* routes.
- Every primary CTA button:
  1) validates required fields
  2) saves state (API or local + sync)
  3) navigates to next step on success
  4) shows error + retry on failure
- No user-facing logs/traces/debug panels appear unless DEBUG_UI=true and route is /admin.
- Onboarding pages include: stepper + Save/Resume + “Why we ask this”.

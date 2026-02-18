# PLANS.md

## Goal
Rebuild UX into a real routed web app that matches `docs/ux_spec.md`, keeps API/schema contracts aligned, and ships tested slices.

## Gap Analysis Summary
- Current `/` experience is still a single-page static flow in `web/index.html` and includes user-facing activity log UI.
- Root runtime scripts in `package.json` only run API (`node src/server.js`) and do not run a frontend dev server.
- Frontend pages are static HTML islands with no shared route guard/state machine.
- `/app/settings` route/page is missing from implementation despite being in `docs/ux_spec.md` and OpenAPI route list.
- Onboarding gating for `/app/*` is not enforced at frontend navigation level.

## Execution Order

### Phase 0: Web App Scaffold
Scope:
- Add React + Vite + React Router + Tailwind frontend inside `web/`.
- Add root scripts for `dev:api`, `dev:web`, and combined `dev`.
- Configure Vite proxy to API for `/v1/*` and `/health`.

Acceptance:
- `npm run dev` starts API + frontend.
- Route tree compiles and includes all routes from `docs/ux_spec.md`.

Tests:
- `npm test` (API regression)
- `npm --prefix web run build`

Commit plan:
- `chore: scaffold react vite web app and dual dev scripts`

### Phase 1: Route Guard + Onboarding State Machine
Scope:
- Implement frontend onboarding guard to block `/app/*` until onboarding completion.
- Resolve next required onboarding route from `/v1/onboarding/state`.
- Add save/resume behavior at each onboarding step.

Acceptance:
- Visiting `/app/dashboard` before completion redirects to next onboarding step.
- Save/resume returns user to last unfinished step.

Tests:
- Add route-guard tests (frontend)
- `npm test`
- `npm --prefix web run test`

Commit plan:
- `feat: add onboarding route guard and state-driven navigation`

### Phase 2: Onboarding Pages and CTA Wiring
Scope:
- Implement:
  - `/onboarding/consent`
  - `/onboarding/goals`
  - `/onboarding/upload`
  - `/onboarding/confirm`
  - `/onboarding/quick-preferences`
  - `/onboarding/first-test`
- Every page includes: stepper, save/resume, why-we-ask, validation, error+retry.

Acceptance:
- End-to-end onboarding completes without dead buttons.
- First-test completion yields score + reliability and enables blueprint generation.

Tests:
- Onboarding progression tests
- API sanity tests for onboarding endpoints

Commit plan:
- `feat: implement onboarding pages with validated api-driven progression`

### Phase 3: Starter Blueprint + App Surfaces
Scope:
- Generate Starter Blueprint immediately after first-test completion.
- Implement and wire:
  - `/app/dashboard`
  - `/app/profile`
  - `/app/assessments`
  - `/app/blueprint`
  - `/app/plan`
  - `/app/settings`

Acceptance:
- Starter blueprint shows top clusters, CIS/confidence, evidence coverage, 4-week missions.
- `/app/*` navigation is usable and consistent.

Tests:
- API + UI checks for blueprint and plan/check-in loop
- `npm test`
- `npm --prefix web run test`

Commit plan:
- `feat: ship starter blueprint and authenticated app routes`

### Phase 4: Backend Endpoint Parity + Deterministic Modules
Scope:
- Confirm existing `/v1/*` endpoints are fully wired for new UI.
- Add compatibility aliases if required by UX process without breaking contracts.
- Add deterministic internal modules:
  - `src/profile_analyst.js`
  - `src/cv_intelligence.js`
  - `src/assessment_scoring.js`
  - `src/market_seed.js`
  - `src/scenario_engine.js`
  - `src/mission_generator.js`
  - `src/explanations.js`
- Keep optional LLM integrations behind `LLM_ENABLED=false` default.

Acceptance:
- No paid API dependency needed for onboarding-to-blueprint flow.
- Memory and Postgres stores remain parity-safe for onboarding/blueprint/check-in.

Tests:
- API endpoint sanity
- deterministic module unit tests

Commit plan:
- `feat: add deterministic scoring and scenario modules with api parity`

### Phase 5: Debug Surface Cleanup + Optional Admin
Scope:
- Remove all user-facing logs/traces from product pages.
- Add `/admin` only when `DEBUG_UI=true`.

Acceptance:
- No traces visible in user flow.
- Admin/debug content inaccessible by default.

Tests:
- UI assertion for no debug panels on normal routes

Commit plan:
- `fix: hide debug ui and gate admin diagnostics by env flag`

### Phase 6: Final Verification
Scope:
- Run full test suite and smoke checks.
- Validate all routes from `docs/ux_spec.md`.
- Validate acceptance criteria for onboarding and `/app/*`.

Acceptance:
- All tests pass.
- Checklist complete.

Tests:
- `npm test`
- `npm --prefix web run test`
- `npm --prefix web run build`

Commit plan:
- `test: add route guard and onboarding smoke coverage`

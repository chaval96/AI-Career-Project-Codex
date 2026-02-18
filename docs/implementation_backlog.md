# AI Career Path OS Implementation Backlog

Version: 1.0  
Date: 2026-02-18  
Sources: `docs/ux_spec.md`, `docs/architecture.md`, `docs/ops_spec.md`

## 1. Planning Model

- Sprint length: 2 weeks.
- Delivery mode: vertical slices by user value, then platform hardening.
- Priority scale: P0 (must), P1 (high), P2 (important), P3 (later).
- Status values: TODO, IN_PROGRESS, BLOCKED, DONE.

## 2. Workstreams

- UX: routes, page layouts, states, interactions.
- API: endpoint behavior and validation.
- Data: schema, migrations, taxonomy mapping, quality checks.
- AI/Model: scoring, reliability, scenario generation.
- Ops/Security: observability, risk controls, release gates.

## 3. Ticket Template

Use this for each ticket:
- ID
- Priority
- Scope
- Dependencies
- Deliverables
- Acceptance criteria

## 4. Sprint 0 - Foundations and Contracts

Goal:
- Lock contracts, environment setup, and baseline operational guardrails.

### T-0001 - Freeze API + schema contracts

- Priority: P0
- Scope: Align OpenAPI and data dictionary to MVP routes and entities.
- Dependencies: none
- Deliverables:
  - Finalized `docs/api_openapi.yaml`
  - Finalized `docs/data_dictionary.md`
- Acceptance criteria:
  - All MVP routes in `ux_spec.md` map to OpenAPI operations.
  - All persisted entities in architecture are represented in schema docs.
  - No undocumented request or response fields in implementation.

### T-0002 - Project runtime baselines

- Priority: P0
- Scope: Docker, env vars, local run scripts, CI test command.
- Dependencies: T-0001
- Deliverables:
  - `.env.example` complete
  - `docker-compose.yml` with API + Postgres
  - CI pipeline running tests
- Acceptance criteria:
  - `npm test` and `npm start` work locally.
  - Postgres backend boots with documented env vars.
  - CI fails on test failure.

### T-0003 - AGENTS.md execution guardrails

- Priority: P1
- Scope: Add Codex instructions as required in ops spec.
- Dependencies: none
- Deliverables:
  - `AGENTS.md` root file with source-of-truth rules
- Acceptance criteria:
  - File explicitly references `docs/*`, OpenAPI, and data dictionary as authoritative.

## 5. Sprint 1 - Onboarding Flow (Routes + UX)

Goal:
- Complete onboarding path from landing to first test entry point.

### T-1001 - Implement `/landing` and `/auth/login`

- Priority: P0
- Scope: Landing page and login page UX.
- Dependencies: T-0001
- Deliverables:
  - `/landing` route
  - `/auth/login` route
- Acceptance criteria:
  - `Get Started` routes to `/auth/login`.
  - Login supports magic link flow UI states (idle/sent/error/retry).

### T-1002 - Implement `/onboarding/consent`

- Priority: P0
- Scope: Mandatory consent and profiling disclosures.
- Dependencies: T-1001
- Deliverables:
  - Consent page with required/optional toggles
  - Consent persistence model
- Acceptance criteria:
  - Profiling toggle required for progression.
  - Optional toggles persist independently.
  - Consent version and timestamp stored.

### T-1003 - Implement `/onboarding/goals`

- Priority: P0
- Scope: Goal and constraints form.
- Dependencies: T-1002
- Deliverables:
  - Goals page fields per UX spec
  - Validation and partial save
- Acceptance criteria:
  - Required fields validated with helpful errors.
  - Save/resume later restores form state.

### T-1004 - Implement `/onboarding/upload` + parse integration

- Priority: P0
- Scope: Resume upload and parse action.
- Dependencies: T-1003
- Deliverables:
  - Upload page
  - Backend parse endpoint integration
- Acceptance criteria:
  - PDF/DOCX validation and parse retry state.
  - At least one ingestion method required.

### T-1005 - Implement `/onboarding/confirm`

- Priority: P0
- Scope: Extraction confirmation and inline editing.
- Dependencies: T-1004
- Deliverables:
  - Editable timeline grid UI
  - Confirm persistence action
- Acceptance criteria:
  - Inline edits persist as authoritative values.
  - Missing critical fields block continue.

### T-1006 - Implement `/onboarding/quick-preferences`

- Priority: P1
- Scope: 5-slider preference capture.
- Dependencies: T-1005
- Deliverables:
  - Preferences page with slider helpers
- Acceptance criteria:
  - All 5 sliders saved successfully.
  - Why-we-ask copy visible for each dimension.

### T-1007 - Implement `/onboarding/first-test` shell

- Priority: P1
- Scope: First-test launch and progression shell.
- Dependencies: T-1006
- Deliverables:
  - Test intro/start/progress/results shell
- Acceptance criteria:
  - Suggested test shown based on profile context.
  - Completion status and next action visible.

## 6. Sprint 2 - Assessment Engine + Starter Blueprint

Goal:
- Deliver measurable first evidence and fast-win starter blueprint.

### T-2001 - Assessment lifecycle hardening

- Priority: P0
- Scope: Start/events/complete reliability and scoring pipeline.
- Dependencies: T-1007
- Deliverables:
  - Robust event validation
  - Reliability score computation
- Acceptance criteria:
  - Assessment attempts persist and resume safely.
  - Completion returns score + reliability + evidence count.

### T-2002 - Evidence item pipeline

- Priority: P0
- Scope: Convert results into evidence_items with recency weighting.
- Dependencies: T-2001
- Deliverables:
  - Evidence write path
  - Evidence retrieval API for profile/blueprint
- Acceptance criteria:
  - Evidence includes source, strength, timestamp, metadata.
  - Evidence can be queried by user and skill.

### T-2003 - Starter blueprint generation

- Priority: P0
- Scope: Produce initial CIS, cluster ranking, and 4-week missions.
- Dependencies: T-2002
- Deliverables:
  - Starter blueprint model output
  - Onboarding transition to `/app/dashboard`
- Acceptance criteria:
  - Top 3 role clusters + CIS + confidence displayed.
  - Missing-data prompts and 4-week plan included.

### T-2004 - Report export baseline

- Priority: P1
- Scope: Blueprint PDF export and object storage.
- Dependencies: T-2003
- Deliverables:
  - PDF generation path
  - Signed URL retrieval endpoint
- Acceptance criteria:
  - Valid PDF generated for blueprint.
  - Export failures return retriable error state.

## 7. Sprint 3 - App Core (Dashboard, Profile, Plan)

Goal:
- Ship core daily-use pages and weekly execution loop.

### T-3001 - Implement `/app/dashboard`

- Priority: P0
- Scope: CIS summary, evidence coverage, next action, drift alerts.
- Dependencies: T-2003
- Deliverables:
  - Dashboard widgets
  - Next-action decision logic
- Acceptance criteria:
  - Widgets render with valid freshness timestamps.
  - CTA changes based on completion state logic.

### T-3002 - Implement `/app/profile`

- Priority: P0
- Scope: Timeline, skills evidence, motivation, artifacts tabs.
- Dependencies: T-2002
- Deliverables:
  - Profile tabs and APIs
  - Add evidence action flow
- Acceptance criteria:
  - Evidence strengths visible per skill.
  - Artifact and cert link submissions persist.

### T-3003 - Implement `/app/plan`

- Priority: P0
- Scope: Mission views and weekly check-in modal.
- Dependencies: T-3001
- Deliverables:
  - Plan calendar/list layout
  - Check-in submission and UI updates
- Acceptance criteria:
  - Check-in updates drift alerts and next missions.
  - Mission completion updates streak/progress metrics.

### T-3004 - Notification center

- Priority: P1
- Scope: In-app reminders and drift notifications.
- Dependencies: T-3003
- Deliverables:
  - Notification drawer and backend feed
- Acceptance criteria:
  - Weekly reminder and drift alert notifications visible.
  - Read/unread states persist.

## 8. Sprint 4 - Blueprint Experience + Assessments Page

Goal:
- Deliver premium blueprint and full assessments workspace.

### T-4001 - Implement `/app/assessments`

- Priority: P0
- Scope: Micro-tests, simulations, surveys catalog UX.
- Dependencies: T-2001
- Deliverables:
  - Assessments page with status cards
- Acceptance criteria:
  - Each card shows why-we-ask and reliability after completion.
  - Model-change summary appears after completed items.

### T-4002 - Implement `/app/blueprint` premium view

- Priority: P0
- Scope: Identity report, scenarios, skill map, risk dashboard.
- Dependencies: T-2003
- Deliverables:
  - Blueprint tabs and scenario cards
- Acceptance criteria:
  - CIS + confidence + evidence coverage visible.
  - Top 5 drivers and top 3 risks visible.
  - Scenario cards include time and salary ranges.
  - Next 3 actions displayed.

### T-4003 - Private share link for blueprint

- Priority: P2
- Scope: Tokenized private read-only blueprint links.
- Dependencies: T-4002
- Deliverables:
  - Share link generation and validation
- Acceptance criteria:
  - Shared links require valid token and expiry checks.
  - Access is scoped to specific blueprint.

## 9. Sprint 5 - Settings, Simulator, Market Intel

Goal:
- Complete trust controls and advanced decision surfaces.

### T-5001 - Implement `/app/settings`

- Priority: P0
- Scope: Privacy controls, consent updates, export/delete actions.
- Dependencies: T-1002
- Deliverables:
  - Settings page and API integrations
- Acceptance criteria:
  - Consent toggles reflect persisted state.
  - Data export and deletion request flows execute.

### T-5002 - Implement `/app/simulator` (v1)

- Priority: P1
- Scope: What-if inputs and recalculated forecast outputs.
- Dependencies: T-4002
- Deliverables:
  - Simulator UI and scenario recalculation endpoint
- Acceptance criteria:
  - Input changes update forecast and risk deltas.
  - Skill leverage changes are shown.

### T-5003 - Implement `/app/market-intel` (v1)

- Priority: P1
- Scope: Filters and charts for demand/salary/skill premium.
- Dependencies: T-4002
- Deliverables:
  - Market intel page and data API endpoints
- Acceptance criteria:
  - Region/role/seniority filters work.
  - Demand trend and salary distribution charts render.

## 10. Sprint 6 - Ops Hardening and Evaluation Harness

Goal:
- Enforce reliability, safety, and monitoring standards.

### T-6001 - Observability dashboards

- Priority: P0
- Scope: Funnel, reliability, and model health dashboards.
- Dependencies: T-3001
- Deliverables:
  - Dashboards for product, system, and model metrics
- Acceptance criteria:
  - Metrics from `ops_spec.md` are queryable and visualized.

### T-6002 - Alerting and incident routing

- Priority: P0
- Scope: Severity thresholds and on-call routing.
- Dependencies: T-6001
- Deliverables:
  - Alert policies + incident runbook
- Acceptance criteria:
  - P0/P1/P2 thresholds configured and tested.

### T-6003 - Evaluation harness in CI

- Priority: P0
- Scope: Mapping accuracy, reliability, scoring regression, market drift checks.
- Dependencies: T-2001
- Deliverables:
  - Automated evaluation jobs in CI
- Acceptance criteria:
  - Failing evaluation blocks release.
  - Baseline report artifacts stored per run.

### T-6004 - Compliance and contestability QA

- Priority: P1
- Scope: Verify profiling safeguards and human-review path.
- Dependencies: T-5001
- Deliverables:
  - Compliance checklist and test cases
- Acceptance criteria:
  - Show-why, report-issue, and human-review flows pass QA.

## 11. Cross-Cutting Non-Functional Tickets

### T-X001 - Accessibility baseline

- Priority: P0
- Scope: Keyboard navigation, focus management, contrast.
- Dependencies: T-1001
- Acceptance criteria:
  - No critical accessibility blockers across MVP routes.

### T-X002 - Performance baseline

- Priority: P1
- Scope: Route-level performance budgets and frontend bundle checks.
- Dependencies: T-3001
- Acceptance criteria:
  - Dashboard and blueprint pages meet agreed p95 targets.

### T-X003 - Security hardening

- Priority: P0
- Scope: Secrets, auth checks, signed URL enforcement, dependency scan.
- Dependencies: T-0002
- Acceptance criteria:
  - Security checks included in CI and release gate.

## 12. Release Milestones

- Milestone A (Onboarding + Starter Blueprint): complete through Sprint 2.
- Milestone B (Core app usage loop): complete through Sprint 4.
- Milestone C (Trust + advanced intelligence pages + ops): complete through Sprint 6.

## 13. Delivery Acceptance (Program Level)

Program is accepted when:
- All MVP routes in `ux_spec.md` are live and pass page acceptance criteria.
- Architecture acceptance criteria in `architecture.md` are satisfied.
- Operational acceptance criteria in `ops_spec.md` are satisfied.
- CI gates enforce functional, reliability, and safety checks.

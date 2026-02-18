# AI Career Path OS Operations Specification

Version: 1.0  
Date: 2026-02-18  
Owner: Platform + Security + ML Ops + Product Ops

## 1. Operational Objectives

- Operate a profiling-based product safely and transparently.
- Keep model outputs reliable, explainable, and measurable.
- Detect and mitigate quality drift early.
- Maintain user trust via controls and contestability.

## 2. Governance and Risk Model

Adopt NIST AI RMF lifecycle dimensions:
- Govern: policies, accountability, approvals.
- Map: use-case and risk surface mapping.
- Measure: quality, fairness, reliability, drift metrics.
- Manage: controls, mitigations, incident response.

Governance operating cadence:
- Weekly: model quality and incident review.
- Monthly: risk register and control effectiveness update.
- Quarterly: policy and profiling safeguards audit.

## 3. Profiling Safeguards and User Rights

Mandatory product controls:
- Clear profiling disclosures before onboarding completion.
- In-product explanation surfaces for outcomes.
- Contestability actions:
  - Show why.
  - Report issue.
  - Request human review.
- Data rights:
  - Download data.
  - Request deletion.
  - Optional consent toggles where applicable.

Policy rule:
- Avoid solely automated decisions in employer-screening contexts.

## 4. Observability Specification

## 4.1 Product Funnel Metrics

Track at minimum:
- Landing-to-account conversion.
- Onboarding step completion by step.
- Resume parse success rate.
- First-test completion rate.
- Starter blueprint generation rate.

## 4.2 Engagement and Outcome Metrics

Track at minimum:
- Weekly active users.
- Weekly check-in completion rate.
- Mission completion rate.
- Drift alert frequency.
- Plan refresh rate.

## 4.3 System Reliability Metrics

Track at minimum:
- API success/error rates by route.
- p50/p95 latency by route.
- Queue backlog and retry counts.
- External adapter failure rates (taxonomy, market feeds).
- Report generation success and duration.

## 4.4 Data and Model Health Metrics

Track at minimum:
- Mapping confidence distribution.
- Assessment reliability score distribution.
- Evidence coverage measured vs inferred ratio.
- Scoring output drift across releases.
- Market signal staleness by region.

## 5. Alerting and Incident Thresholds

Severity examples:
- P0:
  - Authentication outage.
  - Data loss event.
  - Consent handling failure.
- P1:
  - Blueprint generation failure rate above 5% for 15 minutes.
  - Taxonomy adapter down without fallback cache.
- P2:
  - Elevated check-in API error rate above 2%.
  - Market data freshness over SLA window.

Baseline alert thresholds (initial):
- API 5xx rate > 1% over 10 minutes.
- Blueprint job timeout > 10% over 15 minutes.
- Queue dead-letter events > 20 per hour.

## 6. Evaluation Harness (Quality Assurance)

## 6.1 Mapping Accuracy Suite

Coverage:
- Title normalization tests.
- O*NET/ESCO mapping correctness.
- Confidence calibration checks.

Acceptance target:
- Accuracy threshold per benchmark set with no major regression.

## 6.2 Assessment Reliability Suite

Coverage:
- Test-retest stability for micro-tests.
- Speed anomaly detection checks.
- Rubric consistency tests.

Acceptance target:
- Reliability distribution remains within control band.

## 6.3 Scoring Regression Suite

Coverage:
- Snapshot tests for CIS outputs.
- Scenario generation invariants.
- Driver and risk list stability checks.

Acceptance target:
- No unexplained material variance on pinned test cohorts.

## 6.4 Market Drift Detection

Coverage:
- Market signal freshness checks.
- Outlier detection in salary and demand inputs.
- Region and role coverage completeness.

Acceptance target:
- Stale or anomalous feeds quarantined automatically.

## 7. Logging, Tracing, and Auditability

Required logs:
- Consent events and versioning.
- Data ingestion and extraction events.
- Assessment event ingest and score generation.
- Blueprint generation traces with explanation artifact ID.
- Check-in and drift decision events.

Tracing requirements:
- Trace ID propagated through API, jobs, and agents.
- User-visible outcome linked to traceable model run context.

Audit records:
- Store why-this-output explanation artifact for each blueprint.
- Store confidence and uncertainty values with timestamped version.

## 8. Security Operations

Controls:
- Least-privilege service credentials.
- Encryption in transit and at rest.
- Secret rotation policy.
- Signed URL usage for uploads and exports.
- Access logging for sensitive operations.

Operational checks:
- Dependency vulnerability scans.
- Periodic permission review.
- Incident postmortem for security-affecting events.

## 9. Data Lifecycle Operations

Retention and deletion:
- Define retention windows per data class.
- Honor user deletion requests with tombstone tracking.
- Ensure backups honor deletion workflows where required.

Export operations:
- User data export packaged in machine-readable format.
- Export action logged and auditable.

## 10. CI/CD and Release Gates

Required pre-release gates:
- Unit/integration tests pass.
- Mapping accuracy suite pass.
- Scoring regression suite pass.
- Security scan pass.
- Consent and user-right flows verified.

Deployment model:
- Progressive rollout with health checks.
- Rollback path documented and tested.

Post-release checks:
- 30-minute and 24-hour health review.
- Metric anomaly watch for onboarding and blueprint flows.

## 11. Codex Setup and Execution Guardrails

## 11.1 AGENTS.md Requirement

Repository root `AGENTS.md` should include:
- Always read `docs/*` before coding.
- `docs/api_openapi.yaml` and `docs/data_dictionary.md` are source of truth for contracts and schema.
- Do not invent fields or routes outside documented specs without explicit update.

## 11.2 Work Mode Requirement

Use Codex Local or Worktree modes for product implementation tasks to run against local code and dependencies.

## 11.3 Change Protocol

For every feature change:
1. Read UX, architecture, and ops specs.
2. Update OpenAPI and data dictionary if contract/schema changes.
3. Add or update tests.
4. Validate acceptance criteria for affected pages/flows.

## 12. Operations Acceptance Criteria

Operations setup is accepted when:
- Core product, reliability, and model metrics are live on dashboards.
- Alert routing is configured with on-call ownership.
- Evaluation harness runs in CI and blocks regressions.
- Contestability and user-right workflows are operational.
- Traceability exists from user output to model run context.
- Release gates enforce safety and quality baselines.

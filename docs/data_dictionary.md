# AI Career Path OS — Data Dictionary (v1.1)

Date: 2026-02-18  
Scope: MVP + defined v1 extensions from UX and architecture specs

## Conventions

- All IDs are UUID unless explicitly noted.
- `jsonb` fields must be server-side validated against the schemas below.
- Timestamps are ISO8601 UTC (`timestamptz`).
- User-scoped data must always include `user_id` and enforce row-level ownership.
- Canonical taxonomy IDs must retain source metadata (`ONET` or `ESCO`) and version.

---

## 1. Core Relational Tables (Postgres)

### 1.1 `users`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| email | text | unique, normalized |
| locale | text | e.g. `en-US` |
| timezone | text | e.g. `America/New_York` |
| created_at | timestamptz | required |
| last_login_at | timestamptz | nullable |
| status | text | `active\|pending_deletion\|deleted` |

### 1.2 `consent_events`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| consent_version | text | policy version accepted |
| profiling_accepted | bool | required for core product |
| market_data_linking_accepted | bool | optional |
| research_opt_in | bool | optional |
| terms_accepted | bool | legal terms acceptance |
| privacy_accepted | bool | privacy policy acceptance |
| created_at | timestamptz | consent timestamp |

### 1.3 `onboarding_progress`

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | PK/FK `users.id` |
| completed_steps | text[] | ordered keys (`consent`, `goals`, etc.) |
| next_step | text | route key |
| profile_completion_pct | float | 0..1 |
| evidence_completion_pct | float | 0..1 |
| updated_at | timestamptz | required |

### 1.3a `onboarding_goals`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| payload | jsonb | validated `GoalConstraints` snapshot |
| saved_at | timestamptz | required |

### 1.4 `profiles`

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | PK/FK `users.id` |
| headline | text | optional |
| summary | text | optional |
| location | text | optional |
| target_roles | text[] | canonical IDs and/or free-text targets |
| goal_constraints | jsonb | see `GoalConstraints` |
| confidence_meter | jsonb | see `ConfidenceMeter` |
| updated_at | timestamptz | required |

**GoalConstraints (`jsonb`)**
- `goal_type`: enum `promotion|switch_role|switch_industry|freelancing|relocate`
- `time_horizon_months`: enum `3|6|12`
- `time_per_week_hours`: number
- `salary_floor`: number, nullable
- `location`: string
- `relocation_ok`: boolean
- `remote_only`: boolean

**ConfidenceMeter (`jsonb`)**
- `value`: number `0..1`
- `rationale`: string[]

### 1.5 `preference_snapshots`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| type | text | `quick|full` |
| responses | jsonb | see `QuickPreferenceResponses` |
| created_at | timestamptz | required |

**QuickPreferenceResponses (`jsonb`)**
- `autonomy_vs_structure`: integer `0..100`
- `stability_vs_growth`: integer `0..100`
- `income_vs_impact`: integer `0..100`
- `team_vs_solo`: integer `0..100`
- `hands_on_vs_strategic`: integer `0..100`

### 1.5a `onboarding_first_test_runs`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| attempt_id | uuid | assessment attempt reference |
| assessment_id | uuid | assessment definition reference |
| recommended_role_family | text | suggested role-family for first calibration |
| recommendation_rationale | text | deterministic explanation string |
| status | text | `started|completed` |
| progress_pct | float | 0..100 |
| result | jsonb | `AssessmentResult` payload, nullable while started |
| starter_blueprint | jsonb | `FirstTestCompleteResponse.starter_blueprint`, nullable while started |
| started_at | timestamptz | required |
| completed_at | timestamptz | nullable |
| created_at | timestamptz | required |

### 1.6 `resume_uploads`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| source_type | text | `file|linkedin_url|pasted_history` |
| object_key | text | object storage key, nullable |
| linkedin_url | text | nullable |
| pasted_history | text | nullable |
| file_name | text | nullable |
| mime_type | text | nullable |
| parse_status | text | `queued|parsed|failed` |
| parser_notes | jsonb | optional |
| created_at | timestamptz | required |

### 1.7 `resume_items`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| upload_id | uuid | FK `resume_uploads.id`, nullable |
| org | text | required |
| role_title | text | source title |
| start_date | date | required |
| end_date | date | nullable |
| location | text | nullable |
| industry | text | nullable |
| level | text | nullable |
| achievements | text[] | editable bullets |
| tools | text[] | optional |
| self_claimed_skills | text[] | optional |
| canonical_role_id | text | mapped O*NET/ESCO ID |
| mapping_confidence | float | 0..1 |
| created_at | timestamptz | required |
| updated_at | timestamptz | required |

### 1.8 `assessments`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| type | text | `micro_test|simulation|game|survey` |
| version | text | semver |
| role_family | text | e.g. `software_engineering` |
| title | text | display title |
| duration_min | int | estimated duration |
| why_we_ask | text | required explanatory copy |
| config | jsonb | item/scoring config |
| created_at | timestamptz | required |

### 1.9 `assessment_attempts`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| assessment_id | uuid | FK `assessments.id` |
| user_id | uuid | FK `users.id` |
| status | text | `started|completed` |
| started_at | timestamptz | required |
| completed_at | timestamptz | nullable |
| scores | jsonb | see `AssessmentScores` |
| reliability | float | 0..1 |
| model_delta_summary | text[] | optional |
| proctoring_flags | jsonb | optional |

**AssessmentScores (`jsonb`)**
- `overall`: number `0..1`
- `subscores.reasoning`: number
- `subscores.debugging`: number
- `subscores.communication`: number

### 1.10 `assessment_events`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| attempt_id | uuid | FK `assessment_attempts.id` |
| t_ms | int | ms offset since start |
| event_name | text | e.g. `answer`, `decision` |
| event_data | jsonb | event payload |
| created_at | timestamptz | required |

### 1.11 `evidence_items`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| source | text | `assessment|portfolio|cert|self_report` |
| skill_id | text | canonical skill ID |
| evidence_strength | float | 0..1 |
| reliability | float | 0..1, nullable |
| recency_weight | float | 0..1 |
| metadata | jsonb | links, rubric refs, notes |
| created_at | timestamptz | required |

### 1.12 `market_signals`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| region | text | e.g. `US-NYC` |
| role_id | text | canonical role ID |
| skill_id | text | canonical skill ID, nullable |
| demand_index | float | normalized |
| salary_p10 | float | annual |
| salary_p50 | float | annual |
| salary_p90 | float | annual |
| salary_velocity | float | trend proxy |
| skill_premium | float | proxy |
| saturation | float | proxy |
| automation_exposure | float | 0..1 |
| source_meta | jsonb | provider + version metadata |
| captured_at | timestamptz | required |

### 1.13 `blueprints`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| generated_at | timestamptz | required |
| status | text | `queued|running|ready|failed` |
| target_cluster_ids | text[] | planned role clusters |
| constraints | jsonb | snapshot of constraints |
| cis_output | jsonb | see `CISOutput` |
| evidence_coverage | jsonb | see `EvidenceCoverage` |
| drivers | text[] | top drivers (target 5) |
| risks | text[] | top risks (target 3) |
| explanation_artifact_id | uuid | FK `explanation_artifacts.id` |

**CISOutput (`jsonb`)**
- `cis_mean`: number `0..100`
- `cis_p50`: number `0..100`
- `cis_p90`: number `0..100`

**EvidenceCoverage (`jsonb`)**
- `measured_skills_pct`: number `0..1`
- `inferred_skills_pct`: number `0..1`
- `behavioral_pct`: number `0..1`
- `motivation_pct`: number `0..1`

### 1.14 `blueprint_scenarios`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| blueprint_id | uuid | FK `blueprints.id` |
| scenario | text | `safe|aggressive|pivot` |
| time_to_transition | jsonb | `{p10,p50,p90}` months |
| earnings_3yr | jsonb | `{p10,p50,p90}` annualized proxy |
| risks | text[] | scenario-specific risks |
| plan | jsonb | scenario-specific actions |

### 1.15 `missions`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| blueprint_id | uuid | FK `blueprints.id` |
| week_index | int | 1..N |
| title | text | required |
| instructions | text | required |
| expected_time_min | int | required |
| success_criteria | jsonb | measurable outputs |
| skill_targets | text[] | canonical IDs |
| status | text | `todo|in_progress|done` |
| completed_at | timestamptz | nullable |

### 1.16 `checkins`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| week_index | int | required |
| completed_mission_ids | uuid[] | optional |
| time_spent_min | int | optional |
| energy | int | 1..10 |
| blockers | text[] | optional |
| evidence_links | text[] | optional |
| created_at | timestamptz | required |

### 1.17 `drift_alerts`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| checkin_id | uuid | FK `checkins.id`, nullable |
| severity | text | `low|medium|high` |
| alert_type | text | e.g. `low_effort`, `energy_mismatch` |
| message | text | user-visible |
| status | text | `open|dismissed|resolved` |
| created_at | timestamptz | required |

### 1.18 `notifications`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| kind | text | `weekly_reminder|drift_alert|model_refresh` |
| title | text | required |
| body | text | required |
| read_at | timestamptz | nullable |
| created_at | timestamptz | required |

### 1.19 `blueprint_share_links`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| blueprint_id | uuid | FK `blueprints.id` |
| token_hash | text | secure hash, unique |
| expires_at | timestamptz | required |
| created_at | timestamptz | required |
| revoked_at | timestamptz | nullable |

### 1.20 `report_exports`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| blueprint_id | uuid | FK `blueprints.id`, nullable |
| export_type | text | `blueprint_pdf|user_data_bundle` |
| object_key | text | object storage key |
| status | text | `queued|processing|ready|failed` |
| created_at | timestamptz | required |
| ready_at | timestamptz | nullable |

### 1.21 `deletion_requests`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| reason | text | nullable |
| status | text | `queued|in_grace_period|executed|cancelled` |
| grace_period_days | int | default policy value |
| requested_at | timestamptz | required |
| executed_at | timestamptz | nullable |

### 1.22 `explanation_artifacts`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| blueprint_id | uuid | FK `blueprints.id` |
| model_version | text | scoring/model build |
| inputs_snapshot | jsonb | feature and constraint snapshot |
| rationale | jsonb | top drivers, sensitivities, caveats |
| created_at | timestamptz | required |

### 1.23 `notification_settings`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK `users.id` |
| weekly_checkin_reminders | bool | default true |
| drift_alert_notifications | bool | default true |
| created_at | timestamptz | required |

---

## 2. Optional Graph Model (Capability Graph)

### Nodes
- `Skill {id, name, taxonomy, version}`
- `Role {id, name, taxonomy, version}`
- `Task {id, name}`
- `Industry {id, name}`
- `LearningUnit {id, title, provider}`

### Edges
- `ROLE_REQUIRES_SKILL(role_id, skill_id, weight)`
- `SKILL_ADJACENT(skill_a, skill_b, weight)`
- `SKILL_PREREQ(skill_a, skill_b, weight)`
- `USER_HAS_EVIDENCE(user_id, skill_id, strength, updated_at)`

---

## 3. Canonical Taxonomy Rules

- US-first mappings should prefer O*NET occupation and skill IDs.
- EU/multilingual mappings should prefer ESCO concept URIs.
- Persist taxonomy source and version in mapping metadata.
- User edits in onboarding confirmation should be logged as supervised correction signals.

---

## 4. Data Quality and Validation Rules

- No blueprint generation without consent state `profiling_accepted=true`.
- `onboarding_progress.next_step` must correspond to valid route keys.
- `assessment_attempts.reliability` must be `0..1` and present on completion.
- `evidence_items` created from assessments must include `reliability`.
- `blueprints` must include CIS output, evidence coverage, drivers, and risks.
- `checkins.energy` must be constrained to `1..10`.
- Deletion requests must transition through explicit lifecycle statuses.

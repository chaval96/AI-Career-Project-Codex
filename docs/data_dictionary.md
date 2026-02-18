# Career Intelligence OS — Data Dictionary (v1.0)

## Conventions
- All IDs are UUIDs unless otherwise noted.
- `jsonb` fields are schematized in this document and should be validated server-side.
- Timestamps are ISO8601 UTC.

---

## 1. Core tables (Postgres)

### 1.1 users
| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| email | text | unique |
| locale | text | e.g., en-GB |
| timezone | text | e.g., Europe/London |
| created_at | timestamptz |  |
| consent_flags | jsonb | see ConsentFlags |
| deletion_requested_at | timestamptz | nullable |

**ConsentFlags (json schema)**
- `terms_accepted`: bool
- `privacy_accepted`: bool
- `profiling_accepted`: bool
- `market_data_linking_accepted`: bool
- `research_opt_in`: bool

---

### 1.2 profiles
| Field | Type | Notes |
|---|---|---|
| user_id | uuid | PK/FK users.id |
| headline | text | optional |
| summary | text | optional |
| location | text | optional |
| target_roles | text[] | role IDs or free-text |
| constraints | jsonb | see Constraints |

**Constraints**
- `salary_floor`: number (annual)
- `time_per_week_hours`: number
- `relocation_ok`: bool
- `target_timeline_months`: number
- `remote_only`: bool
- `notes`: string

---

### 1.3 resume_items
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| org | text |  |
| role_title | text | original |
| start_date | date |  |
| end_date | date | nullable |
| industry | text | optional |
| level | text | optional (mapped) |
| achievements | text | optional |
| tools | text[] | optional |
| self_claimed_skills | text[] | optional |
| canonical_role_id | text | mapped (O*NET/ESCO) |
| mapping_confidence | float | 0..1 |

---

### 1.4 assessments
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| type | text | micro_test\|simulation\|game\|survey |
| version | text | semver |
| role_family | text | e.g., software_engineering |
| config | jsonb | assessment-specific config |
| created_at | timestamptz |  |

---

### 1.5 assessment_attempts
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| assessment_id | uuid | FK |
| user_id | uuid | FK |
| started_at | timestamptz |  |
| completed_at | timestamptz | nullable |
| raw_events | jsonb | event stream batch |
| scores | jsonb | rubric outputs |
| reliability | float | 0..1 |
| proctoring_flags | jsonb | optional |

**Scores (example)**
- `overall`: number 0..1
- `subscores`: object
  - `reasoning`: number
  - `debugging`: number
  - `communication`: number

---

### 1.6 evidence_items
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| source | text | assessment\|portfolio\|cert\|self_report |
| skill_id | text | canonical skill id |
| evidence_strength | float | 0..1 |
| timestamp | timestamptz |  |
| metadata | jsonb | link, rubric refs |

---

### 1.7 market_signals
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| region | text | e.g., UK-London |
| role_id | text | canonical |
| skill_id | text | canonical |
| demand_index | float | normalized |
| salary_median | float | annual |
| salary_p10 | float | annual |
| salary_p90 | float | annual |
| salary_velocity | float | trend proxy |
| skill_premium | float | proxy |
| saturation | float | proxy |
| automation_exposure | float | 0..1 proxy |
| timestamp | timestamptz |  |
| source_meta | jsonb | providers, versions |

---

### 1.8 roadmaps
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| target_cluster_id | text | internal |
| scenario | text | safe\|aggressive\|pivot |
| generated_at | timestamptz |  |
| assumptions | jsonb | constraints, market snapshot |
| plan | jsonb | months/weeks/missions |

---

### 1.9 missions
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| roadmap_id | uuid | FK |
| week_index | int | 1..N |
| title | text |  |
| instructions | text |  |
| expected_time_min | int |  |
| success_criteria | jsonb | measurable outcomes |
| skill_targets | text[] | canonical ids |

---

### 1.10 checkins
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK |
| week_index | int |  |
| answers | jsonb | check-in responses |
| mood_energy | jsonb | optional |
| time_spent_min | int | optional |
| drift_flags | jsonb | optional |

---

## 2. Graph model (capability graph)
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

## 3. Canonical taxonomy IDs
- Prefer O*NET occupation codes for US; ESCO concept URIs for EU.
- Store taxonomy source + version in metadata.

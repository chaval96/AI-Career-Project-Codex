#!/bin/zsh
set -euo pipefail

ROOT="${1:-$HOME/career-intel-os}"
DOCS="$ROOT/docs"

mkdir -p "$DOCS"

# ---------- docs/whitepaper.md ----------
cat > "$DOCS/whitepaper.md" <<'EOF'
# Career Intelligence OS
## Investor-Grade White Paper (v1.0)

**Product:** Career Intelligence OS — a 360° Career Intelligence Engine  
**Thesis:** *From CV parsing → Human Potential Modeling → Evidence-based execution system*

---

## 0. One-line definition
A personal Career Intelligence Platform that fuses **experience**, **validated skills evidence**, **behavioral/cognitive traits**, **motivation/energy preferences**, and **market intelligence** into a **quantified career identity**, **trajectory forecasts**, and a **weekly execution system**.

---

## 1. Executive summary
Career Intelligence OS replaces generic “career advice” with a **multi-signal, evidence-weighted model** of human potential and fit. It produces:
- **Career Identity Report (PDF)**: quantified profile + strengths + risks + confidence
- **3 scenario forecasts**: Safe / Aggressive Growth / Experimental Pivot
- **12-month execution plan**: weekly missions + progress + drift alerts
- **Skill investment map**: ROI-ranked skills and leverage paths
- **Career risk dashboard**: automation exposure, saturation, stagnation, over-specialization

**Core moat:** proprietary **capability graph + evidence store + calibrated assessments + scenario simulation + accountability loop** (not “LLM chat”).

---

## 2. The problem
### 2.1 Why most career tools underperform
1. **CV-only inference** is low-trust and biased toward narrative quality, not capability.
2. **Advice is non-falsifiable**: users can’t verify guidance or track improvement.
3. **Static recommendations** ignore changing market and user progress.
4. **No execution layer**: outcomes depend on weekly behavior, not one-time insights.

### 2.2 What users actually need
- A **measured** capability model and **fit** model (not “tips”)
- A **probabilistic** forecast with assumptions and confidence
- A **decision engine** for tradeoffs (risk, time, salary, impact)
- A **system** that drives weekly action and adapts

---

## 3. Solution: the 360° Career Intelligence Engine
### 3.1 Five signal layers
1. **Deep CV Intelligence**
   - career velocity, role complexity growth, transition patterns, risk signals, skill adjacency
   - outputs: Career Maturity Score, Adaptability Index, Skill Compounding Potential

2. **Micro Skill Evidence + Adaptive Tests**
   - 5-minute adaptive challenges; role-specific micro simulations
   - measures: applied thinking, depth vs surface knowledge, pattern recognition

3. **Behavioral & Cognitive Games**
   - gamified measures: ambiguity tolerance, risk orientation, strategic vs tactical, persistence, social vs analytical dominance
   - output: Work Style Genome

4. **Motivation & Energy Mapping**
   - autonomy/structure; stability/growth; income/impact; leadership aspiration; energy cycles
   - output: Motivation Alignment Model

5. **Market & Salary Intelligence**
   - demand signals; salary velocity; skill premium growth; saturation; automation exposure (task proxy)
   - output: ROI per skill; time-to-transition; 3-year earnings range; market risk flags

### 3.2 What we deliver (not “advice”)
- Quantified **Career Identity Model**
- Predicted **Trajectory Map** (scenarios)
- Personalized **Execution Roadmap** (weekly missions)

---

## 4. Competitive differentiation (why this is hard to copy)
### 4.1 Product moat components
- **Evidence store**: measured skills > self-reported claims
- **Assessment library**: micro-tests + simulations + calibration
- **Capability graph**: adjacency + prerequisites + role requirements + ROI overlay
- **Unified scoring**: transparent drivers, confidence, sensitivity
- **Closed-loop execution**: weekly check-ins, drift detection, plan updates

### 4.2 LLM role (supporting, not authoritative)
LLMs are used for:
- structured extraction and normalization assistance (with verification)
- explanation generation and report narrative
- mission copy generation (templated and constrained)

LLMs are *not* used as the source of truth for scoring.

---

## 5. Core IP: scoring, forecasting, and optimization
### 5.1 Career Intelligence Score (CIS)
A role-cluster-specific score computed from 4 aligned dimensions:

\[
CIS = f(\text{Skill Depth},\ \text{Behavioral Fit},\ \text{Market Demand},\ \text{Motivation Alignment})
\]

Where:
- **Skill Depth** is evidence-weighted (assessments > portfolio > certifications > self-claims)
- **Behavioral Fit** maps Work Style Genome to role cluster success profiles
- **Market Demand** blends demand, salary velocity, skill premium, saturation, and automation proxy
- **Motivation Alignment** ensures the plan is sustainable and consistent with user constraints

### 5.2 Confidence & explainability requirements
Every recommendation includes:
- evidence coverage (measured vs inferred)
- confidence score (data completeness + consistency)
- sensitivity (top drivers that would change the outcome)

### 5.3 Scenario engine
Three scenarios are produced via constrained optimization:
- **Safe Path**: maximize probability of success under user constraints
- **Aggressive Growth**: maximize ROI with higher risk tolerance
- **Experimental Pivot**: maximize option value + learning velocity

Outputs per scenario:
- time-to-transition range
- cost/time investment range
- 3-year earnings range (p10/p50/p90 or similar)
- top risks + mitigations

---

## 6. System architecture
### 6.1 Components
1. Data ingestion (CV, structured experience, assessments, surveys, check-ins, market signals)
2. Normalization & taxonomy mapping (O*NET / ESCO)
3. Evidence store + capability graph
4. Modeling: CIS + scenario forecasting + recommendations
5. Product layer: report generation + dashboard + missions

### 6.2 Canonical taxonomies (recommended)
- **O*NET Web Services**: occupation/skills/work activities/work styles (US-focused)
- **ESCO**: EU multilingual occupations/skills classification and relationships

(See References.)

---

## 7. Trust, safety, and compliance
### 7.1 Automated decision-making and profiling
This product performs profiling and must implement:
- user control, transparency, contestability
- “not solely automated” posture for significant decisions
- clear separation between personal guidance and employer screening

### 7.2 AI risk management
Adopt a lifecycle risk program aligned to NIST AI RMF:
- map, measure, manage, govern
- bias monitoring for assessments and recommendations
- logging of explanation artifacts for audits

---

## 8. Business model & GTM (high-level)
- **B2C premium**: subscription + quarterly blueprint refresh
- **B2B2C**: universities, bootcamps, outplacement, coaching networks
- Optional future: skills evidence “passport” (user-owned, portable)

---

## 9. Validation plan
- Short-term: mission completion, skill evidence gains, interview conversion
- Mid-term: transition success, salary movement vs baseline, satisfaction/fit
- Long-term: retention and growth velocity

Model evaluation:
- assessment reliability (test-retest)
- mapping accuracy (title/skill normalization)
- recommendation stability and drift monitoring

---

## 10. Roadmap
### MVP (8–12 weeks)
- Layer 1 CV Intelligence
- Layer 2 micro-tests (1 role family)
- Layer 4 motivation mapping
- Basic market scoring (1 region)
- PDF report + 12-week plan + weekly check-ins

### v1 (3–6 months)
- Behavioral games + Work Style Genome
- Scenario forecasts (safe/aggressive/pivot)
- Skill compounding radar
- Drift alerts and plan refresh loop

### v2
- Career simulation engine (“what happens if…”)
- Multi-country localization and ESCO-first EU coverage
- Expanded assessment library across role families

---

## References (implementation anchors)
- O*NET Web Services — Reference Manual: https://services.onetcenter.org/reference/
- O*NET Web Services — Overview: https://services.onetcenter.org/
- ESCO — Use ESCO Services (API): https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
- ESCO — Web-service API: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api/esco-web-service-api
- NIST — AI Risk Management Framework 1.0 (PDF): https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf
- ICO — Automated decision-making and profiling (UK GDPR guidance): https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/automated-decision-making-and-profiling/
EOF

# ---------- docs/prd.md ----------
cat > "$DOCS/prd.md" <<'EOF'
# Career Intelligence OS — PRD (v1.0)

## 1. Objective
Build an AI-centric Career Intelligence Operating System that transforms multi-signal inputs into a quantified career identity model, scenario forecasts, and an execution roadmap with weekly accountability.

## 2. Target users
- Professionals planning a move: promotion, lateral shift, industry change, pivot into high-growth domains
- People who want evidence-based skill validation and a plan they will execute
- Secondary: coaches/mentors (viewer mode), partners (education/outplacement) with consent

## 3. Value proposition
- **Evidence-based**: validated micro-skill tests and simulations
- **Fit-aware**: behavioral genome + motivation alignment
- **Market-aware**: demand + salary velocity + skill premium + saturation + automation proxy
- **Action-oriented**: weekly missions, check-ins, drift alerts, plan refresh

## 4. Core user journeys
### 4.1 Onboarding
1) account creation  
2) consent + privacy preferences (granular)  
3) goals & constraints (salary floor, time/week, relocation, target timelines)

### 4.2 Profile ingestion
- upload CV/resume
- confirm structured extraction (roles, dates, achievements, tools)
- choose target role clusters (or use system suggested clusters)

### 4.3 Assessments
- micro-tests (5 minutes)
- role simulations (decision scenarios)
- behavioral games (v1+)
- motivation mapping survey

### 4.4 Blueprint generation
- generate Identity Report + 3 scenarios + 12-month plan
- dashboard shows CIS, confidence, top drivers, risks, and missions

### 4.5 Execution loop
- weekly mission list
- weekly check-in: time spent, progress evidence, energy/mood, blockers
- drift alerts: low alignment, stagnation, avoidance patterns
- plan refresh after new evidence

## 5. Product scope
### MVP (must-have)
- Layer 1: Deep CV Intelligence metrics
- Layer 2: Micro tests (single role family)
- Layer 4: Motivation mapping
- Layer 5: Market scoring v0 (single region; cached sources)
- Blueprint generator v0 (PDF + JSON)
- Weekly missions + check-in + progress tracking

### v1 (next)
- Layer 3: Behavioral/cognitive games (Work Style Genome)
- 3 scenario engine (safe/aggressive/pivot)
- Skill compounding radar
- Risk dashboard v1 (automation proxy, saturation, stagnation)

## 6. Functional requirements (MVP)
### 6.1 CV Intelligence
- Extract structured history
- Compute:
  - career velocity
  - role complexity growth proxy
  - transition patterns (industry/function)
  - risk signals (short tenures; context-aware)
- Produce scores and explanations with confidence.

### 6.2 Assessments v0
- Run micro-test sessions with event logging
- Scoring rubric per test
- Store evidence items with timestamps and reliability estimate.

### 6.3 Motivation mapping
- Survey + constraints
- Output alignment vectors usable by scenario engine.

### 6.4 Market scoring v0
- Normalize market signals per role and region:
  - demand index (proxy)
  - salary median + distribution
  - salary velocity (trend proxy if available)
  - saturation proxy
  - automation exposure proxy flag
- Cache and version sources.

### 6.5 Blueprint generator v0
- Generate 3 scenarios (rules-based v0 acceptable)
- Produce 12-week mission plan + evidence checkpoints
- Export:
  - JSON blueprint
  - PDF report

### 6.6 Execution loop
- Weekly check-ins
- Mission completion tracking
- Simple drift alert rules

## 7. Non-functional requirements
- Privacy-by-design: least-data; encryption at rest; deletion controls
- Explainability: store drivers + evidence references per blueprint
- Reliability: telemetry + retries for event ingestion
- Observability: metrics for assessment completion, conversion, retention
- Security: rate limit, signed URLs for uploads, audit logs

## 8. Compliance and safety posture
- Transparent profiling disclosures, user control, contestability
- Not used for automated employer screening decisions in MVP
- Align AI governance to NIST AI RMF practices; follow UK GDPR profiling guidance for safeguards.

## 9. Key metrics (product)
- Activation: % completing onboarding + CV ingestion
- Assessment completion rate
- Blueprint generation rate
- Week-4 retention and mission completion
- Transition success proxies (self-reported + verified where possible)
- NPS / satisfaction with fit and plan

## 10. Release criteria (MVP)
- End-to-end flow works reliably:
  - resume ingestion → 1 micro-test → motivation → blueprint → PDF → weekly mission loop
- Explanation artifacts stored for every blueprint
- Basic monitoring dashboards in place
EOF

# ---------- docs/data_dictionary.md ----------
cat > "$DOCS/data_dictionary.md" <<'EOF'
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
EOF

# ---------- docs/api_openapi.yaml ----------
cat > "$DOCS/api_openapi.yaml" <<'EOF'
openapi: 3.0.3
info:
  title: Career Intelligence OS API
  version: 0.1.0
  description: |
    API for Career Intelligence OS: profile ingestion, assessments, blueprint generation,
    execution loop, and exports. All scoring outputs are evidence-traceable.

servers:
  - url: https://api.careerintel.example.com

tags:
  - name: Auth
  - name: Profile
  - name: Taxonomy
  - name: Assessments
  - name: Blueprint
  - name: Execution
  - name: Exports

paths:
  /v1/auth/magic-link:
    post:
      tags: [Auth]
      summary: Request a magic link login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email:
                  type: string
                  format: email
      responses:
        "202":
          description: Accepted

  /v1/profile/resume:
    post:
      tags: [Profile]
      summary: Upload and parse a resume/CV
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file]
              properties:
                file:
                  type: string
                  format: binary
                locale:
                  type: string
                region:
                  type: string
      responses:
        "200":
          description: Parsed and normalized profile preview
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ResumeParseResult"

  /v1/profile/confirm:
    post:
      tags: [Profile]
      summary: Confirm and persist extracted resume items
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [resume_items]
              properties:
                resume_items:
                  type: array
                  items:
                    $ref: "#/components/schemas/ResumeItem"
      responses:
        "200":
          description: Saved
          content:
            application/json:
              schema:
                type: object
                properties:
                  saved_count:
                    type: integer

  /v1/taxonomy/roles:
    get:
      tags: [Taxonomy]
      summary: Search canonical roles (O*NET/ESCO mapped)
      security:
        - bearerAuth: []
      parameters:
        - in: query
          name: q
          required: true
          schema: { type: string }
        - in: query
          name: locale
          schema: { type: string }
        - in: query
          name: region
          schema: { type: string }
        - in: query
          name: limit
          schema: { type: integer, default: 20, minimum: 1, maximum: 100 }
      responses:
        "200":
          description: Matching roles
          content:
            application/json:
              schema:
                type: object
                properties:
                  roles:
                    type: array
                    items:
                      $ref: "#/components/schemas/CanonicalRole"

  /v1/assessments/start:
    post:
      tags: [Assessments]
      summary: Start an assessment session
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [assessment_type]
              properties:
                assessment_type:
                  type: string
                  enum: [micro_test, simulation, game, survey]
                role_family:
                  type: string
                version:
                  type: string
      responses:
        "200":
          description: Assessment manifest
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AssessmentSession"

  /v1/assessments/events:
    post:
      tags: [Assessments]
      summary: Ingest assessment event batches
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [attempt_id, events]
              properties:
                attempt_id:
                  type: string
                  format: uuid
                events:
                  type: array
                  items:
                    $ref: "#/components/schemas/AssessmentEvent"
      responses:
        "204":
          description: Accepted

  /v1/assessments/complete:
    post:
      tags: [Assessments]
      summary: Complete an attempt and trigger scoring
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [attempt_id]
              properties:
                attempt_id:
                  type: string
                  format: uuid
      responses:
        "200":
          description: Score summary
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AssessmentResult"

  /v1/blueprint/generate:
    post:
      tags: [Blueprint]
      summary: Generate career blueprint scenarios and execution plan
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/BlueprintGenerateRequest"
      responses:
        "202":
          description: Accepted
          content:
            application/json:
              schema:
                type: object
                properties:
                  blueprint_id:
                    type: string
                    format: uuid
                  status:
                    type: string
                    enum: [queued, running]

  /v1/blueprint/{blueprint_id}:
    get:
      tags: [Blueprint]
      summary: Fetch blueprint JSON
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: blueprint_id
          required: true
         schema: { type: string, format: uuid }
      responses:
        "200":
          description: Blueprint
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Blueprint"

  /v1/blueprint/{blueprint_id}/pdf:
    get:
      tags: [Exports]
      summary: Download blueprint PDF
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: blueprint_id
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: PDF file
          content:
            application/pdf:
              schema:
                type: string
                format: binary

  /v1/execution/checkin:
    post:
      tags: [Execution]
      summary: Weekly check-in; returns drift alerts and next missions
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/WeeklyCheckinRequest"
      responses:
        "200":
          description: Updated plan deltas and alerts
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/WeeklyCheckinResponse"

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    ResumeParseResult:
      type: object
      properties:
        extracted_items:
          type: array
          items: { $ref: "#/components/schemas/ResumeItem" }
        mapping_notes:
          type: array
          items: { type: string }

    ResumeItem:
      type: object
      required: [org, role_title, start_date]
      properties:
        org: { type: string }
        role_title: { type: string }
        start_date: { type: string, format: date }
        end_date: { type: string, format: date, nullable: true }
        industry: { type: string, nullable: true }
        achievements: { type: string, nullable: true }
        tools:
          type: array
          items: { type: string }
        self_claimed_skills:
          type: array
          items: { type: string }
        canonical_role_id: { type: string, nullable: true }
        mapping_confidence: { type: number, minimum: 0, maximum: 1 }

    CanonicalRole:
      type: object
      properties:
        id: { type: string }
        name: { type: string }
        taxonomy: { type: string, enum: [ONET, ESCO] }
        version: { type: string }
        score: { type: number }

    AssessmentSession:
      type: object
      properties:
        attempt_id: { type: string, format: uuid }
        assessment_id: { type: string, format: uuid }
        manifest:
          type: object
          additionalProperties: true

    AssessmentEvent:
      type: object
      required: [t, name]
      properties:
        t:
          type: number
          description: Timestamp offset in milliseconds since start
        name:
          type: string
          description: Event name (e.g., click, answer, decision)
        data:
          type: object
          additionalProperties: true

    AssessmentResult:
      type: object
      properties:
        attempt_id: { type: string, format: uuid }
        scores:
          type: object
          additionalProperties: true
        reliability:
          type: number
          minimum: 0
          maximum: 1
        evidence_items_created:
          type: integer

    BlueprintGenerateRequest:
      type: object
      required: [region, scenarios]
      properties:
        region: { type: string, example: "UK-London" }
        target_roles:
          type: array
          items: { type: string }
        scenarios:
          type: array
          items:
            type: string
            enum: [safe, aggressive, pivot]
        constraints:
          type: object
          additionalProperties: true

    Blueprint:
      type: object
      properties:
        blueprint_id: { type: string, format: uuid }
        generated_at: { type: string, format: date-time }
        identity_model:
          type: object
          properties:
            cis:
              $ref: "#/components/schemas/CISOutput"
            evidence_coverage:
              $ref: "#/components/schemas/EvidenceCoverage"
        scenarios:
          type: array
          items:
            $ref: "#/components/schemas/ScenarioOutput"
        execution_plan:
          type: object
          additionalProperties: true
        explanation_artifact:
          type: object
          additionalProperties: true

    CISOutput:
      type: object
      properties:
        cis_mean: { type: number, minimum: 0, maximum: 100 }
        cis_p50: { type: number, minimum: 0, maximum: 100 }
        cis_p90: { type: number, minimum: 0, maximum: 100 }
        drivers:
          type: array
          items: { type: string }
        risks:
          type: array
          items: { type: string }

    EvidenceCoverage:
      type: object
      properties:
        measured_skills_pct: { type: number, minimum: 0, maximum: 1 }
        inferred_skills_pct: { type: number, minimum: 0, maximum: 1 }
        behavioral_pct: { type: number, minimum: 0, maximum: 1 }
        motivation_pct: { type: number, minimum: 0, maximum: 1 }

    ScenarioOutput:
      type: object
      properties:
        name: { type: string, enum: [safe, aggressive, pivot] }
        time_to_transition_months:
          type: object
          properties:
            p10: { type: number }
            p50: { type: number }
            p90: { type: number }
        earnings_3yr:
          type: object
          properties:
            p10: { type: number }
            p50: { type: number }
            p90: { type: number }
        plan:
          type: object
          additionalProperties: true
        risks:
          type: array
          items: { type: string }

    WeeklyCheckinRequest:
      type: object
      required: [week_index]
      properties:
        week_index: { type: integer, minimum: 1 }
        time_spent_min: { type: integer, minimum: 0 }
        blockers:
          type: array
          items: { type: string }
        energy:
          type: integer
          minimum: 1
          maximum: 10
        completed_mission_ids:
          type: array
          items: { type: string, format: uuid }
        evidence_links:
          type: array
          items: { type: string }

    WeeklyCheckinResponse:
      type: object
      properties:
        drift_alerts:
          type: array
          items: { type: string }
        next_missions:
          type: array
          items:
            $ref: "#/components/schemas/MissionPreview"

    MissionPreview:
      type: object
      properties:
        mission_id: { type: string, format: uuid }
        title: { type: string }
        expected_time_min: { type: integer }
        skill_targets:
          type: array
          items: { type: string }
EOF

# ---------- README.md ----------
cat > "$ROOT/README.md" <<'EOF'
# Career Intelligence OS (Repo Starter)

This repository contains product documentation and API specs for the Career Intelligence OS.

## Key docs
- `docs/whitepaper.md` — investor-grade white paper
- `docs/prd.md` — product requirements (MVP + v1 scope)
- `docs/data_dictionary.md` — schemas and conventions
- `docs/api_openapi.yaml` — OpenAPI v3 spec (backend contract)

## Taxonomy anchors
- O*NET Web Services: https://services.onetcenter.org/reference/
- ESCO API: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
- NIST AI RMF: https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf
- ICO UK GDPR profiling guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/automated-decision-making-and-profiling/
EOF

echo "✅ Created:"
echo "  $DOCS/whitepaper.md"
echo "  $DOCS/prd.md"
echo "  $DOCS/data_dictionary.md"
echo "  $DOCS/api_openapi.yaml"
echo "  $ROOT/README.md"
echo ""
echo "Repo root: $ROOT"

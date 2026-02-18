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

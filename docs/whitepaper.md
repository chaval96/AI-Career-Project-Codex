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

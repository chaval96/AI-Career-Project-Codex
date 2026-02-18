# AI Career Path OS UX Specification

Version: 1.0  
Date: 2026-02-18  
Owner: Product + UX + Engineering

## 1. Product UX Map

### 1.1 User Mental Model

Users should experience the product as a four-layer system:
1. Know me: profile, goals, constraints, preferences, evidence.
2. Measure me: assessments and reliability-calibrated skill signals.
3. Model my future: blueprint, scenarios, market context, risks.
4. Move me weekly: mission system, check-ins, drift alerts, plan refresh.

### 1.2 Global Navigation

Top navigation:
- Home (dashboard)
- Blueprint
- Assessments
- Plan
- Simulator
- Market Intel
- Profile
- Settings

Left navigation (contextual):
- Current section sub-tabs and quick actions.
- Persistent CTA button in the bottom area.

### 1.3 Persistent UI Elements

Visible on all authenticated `/app/*` pages:
- Profile completeness progress bar.
- Evidence completeness progress bar.
- Confidence meter.
- Contextual CTA button:
  - Continue onboarding
  - Take next test
  - Generate blueprint
  - Do weekly check-in
- Notification center:
  - Drift alerts
  - Weekly reminder
  - Model refresh available

### 1.4 Information Architecture

Primary route map (MVP):
- `/landing`
- `/auth/login`
- `/onboarding/consent`
- `/onboarding/goals`
- `/onboarding/upload`
- `/onboarding/confirm`
- `/onboarding/quick-preferences`
- `/onboarding/first-test`
- `/app/dashboard`
- `/app/profile`
- `/app/assessments`
- `/app/blueprint`
- `/app/plan`
- `/app/settings`

Planned v1 extension routes:
- `/app/simulator`
- `/app/market-intel`

## 2. Onboarding Funnel Specification

Design principle: progressive disclosure. Minimize first-time burden, maximize trust via transparency and quick wins.

### Step 0: Landing (logged out)

Objective:
- Explain value and expected effort.

Required UX content:
- Headline: quantified career identity + 3 forecasts + weekly execution.
- Secondary copy: evidence-based, transparent, user-controlled.
- Primary CTA: `Get Started`.

### Step 1: Account creation

Objective:
- Friction-minimized entry.

Methods:
- Email magic link (default).
- Google and Apple optional.

### Step 2: Consent and privacy (mandatory)

Objective:
- Explicit profiling disclosure and controls before modeling.

Must include:
- Data collected list.
- Purpose of processing.
- User control rights (download/delete/opt-outs).
- Toggles:
  - Profiling: required.
  - Market linking: optional.
  - Research opt-in: optional.

### Step 3: Goal and constraints (2 minutes)

Fields:
- Goal type (promotion, role switch, industry switch, freelancing, relocate).
- Time horizon (3/6/12 months).
- Time available per week (slider).
- Salary floor (optional).
- Location.
- Relocation willingness.
- Remote-only toggle.

### Step 4: Resume upload and extraction confirmation

Input options:
- PDF/DOCX upload.
- LinkedIn-like history text paste.

Confirmation UI:
- Role title, company, dates, location, level.
- Achievements bullets.
- Detected tools and skills.
- Inline edit before save.

### Step 5: Quick preferences (60 seconds)

Short sliders:
- Autonomy vs structure.
- Stability vs growth.
- Income vs impact.
- Team vs solo.
- Hands-on vs strategic.

### Step 6: First micro-test (5 minutes)

Selection logic:
- Use role history + goal + likely role clusters.

Required micro-copy:
- Calibration framing, not exam framing.

### Step 7: Starter blueprint generation

Immediate output:
- Top 3 role clusters ranked.
- Initial CIS + confidence.
- Missing measurement prompts.
- 4-week mini mission plan.

Upgrade prompt:
- Explain benefits of 2 extra tests + motivation map for full 12-month plan.

## 3. Core In-App Flows

### A. Dashboard (Home)

Purpose:
- Status, priorities, immediate next action.

Widgets:
- CIS summary.
- Evidence coverage measured vs inferred.
- Next best action.
- Drift alerts.
- Market snapshot.

Primary CTA decision logic:
- Incomplete onboarding: continue setup.
- Assessment deficit: take next test.
- Stale model: generate refresh.
- Otherwise: weekly check-in.

### B. Profile

Tabs:
- Timeline.
- Skills evidence map.
- Behavior and cognitive (v1+).
- Motivation.
- Artifacts.

Actions:
- Add evidence.
- Retake calibration.

### C. Assessments

Sections:
- Micro-tests.
- Role simulations.
- Behavioral games (v1+).
- Surveys.

Required explanatory UX:
- Why this measure exists.
- Reliability indicator.
- What changed in model.

### D. Blueprint

Tabs:
- Identity Report.
- Scenarios.
- Skill Investment Map.
- Risk Dashboard.
- Future Self Gap.

Export actions:
- Download PDF.
- Share private link.

### E. Plan

Layout:
- Month themes.
- Week missions.
- Mission detail with evidence submission.
- Streak and progress indicators.

Check-in modal fields:
- Completed items.
- Time spent.
- Energy.
- Blocker.
- Proof links.

### F. Simulator (v1)

Inputs:
- Role cluster switch.
- Location shift.
- Freelance switch.
- Education investment.
- Time-per-week changes.
- Salary floor changes.

Outputs:
- Time-to-transition ranges.
- Earnings ranges.
- Risk changes.
- Skill leverage delta.

### G. Market Intel (v1)

Filters:
- Region.
- Role cluster.
- Seniority.
- Salary band.

Charts:
- Demand trend.
- Salary distribution p10/p50/p90.
- Skill premium leaderboard.
- Saturation and automation proxies.

## 4. User Data Request Plan (What and When)

### 4.1 MVP Required Data

Collected in onboarding + early usage:
- Resume or structured history.
- Goal and weekly time budget.
- Region.
- 1 to 3 micro-tests.
- Quick motivation snapshot.
- Weekly check-in after blueprint.

### 4.2 Optional High-Leverage Data

Requested after trust is established:
- Portfolio links.
- Certifications.
- Performance highlights.
- Work style game outputs.
- Network strength proxy.

### 4.3 Form Labeling Rule

Every input uses one of two labels:
- Required: includes short reason.
- Optional: includes explicit benefit.

## 5. Page-by-Page Wireframes and Acceptance Criteria

Global standards for every page:
- Header present with current step or section context.
- Progress indicator visible when part of onboarding.
- Save and resume later action present.
- Why we ask this help text/tooltips present for data fields.
- Clear error states with retry action.

---

## `/landing`

Purpose:
- Convert visitor to onboarding start.

Text wireframe:
```text
+-------------------------------------------------------------+
| LOGO                                       Sign in           |
| Quantified career identity + 3 forecasts                    |
| [Get Started]                                                |
| Value bullets: Evidence, Fit, Market, Weekly execution      |
+-------------------------------------------------------------+
```

Acceptance criteria:
- `Get Started` routes to `/auth/login`.
- Value proposition text matches product promise.
- Secondary CTA for existing users routes to login.
- Load performance target under 2.5s on broadband.

## `/auth/login`

Purpose:
- Authenticate with minimal friction.

Text wireframe:
```text
+----------------------------------------+
| Welcome back                            |
| [Email input] [Send magic link]         |
| Continue with Google | Continue Apple   |
| Trust note: no password required         |
+----------------------------------------+
```

Acceptance criteria:
- Magic link send success and error states are explicit.
- OAuth options are visible when enabled.
- Retry allowed without full page reload.
- Returning user is redirected to last unfinished step.

## `/onboarding/consent`

Purpose:
- Secure explicit and informed consent.

Text wireframe:
```text
+----------------------------------------------------------------+
| Step 1/6 Consent & Privacy                                      |
| What we collect | Why | Your controls                           |
| [x] Profiling (required)                                        |
| [ ] Market linking (optional)                                   |
| [ ] Research opt-in (optional)                                  |
| [Save and continue] [Save and resume later]                     |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Profiling toggle cannot be disabled for core onboarding completion.
- Optional toggles persist independently.
- Download/delete rights are visible on-page.
- Consent timestamp and version are persisted.

## `/onboarding/goals`

Purpose:
- Capture constraints for planning.

Text wireframe:
```text
+----------------------------------------------------------------+
| Step 2/6 Goals & Constraints                                    |
| Goal type [dropdown]  Timeline [3/6/12]                        |
| Time/week [slider]     Salary floor [optional]                 |
| Region [input]         Relocate [toggle] Remote-only [toggle]  |
| [Continue] [Save and resume later]                              |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Goal type and timeline are required before continue.
- Slider value is visible numerically.
- Validation explains why each required field is needed.
- Partial save restores values on revisit.

## `/onboarding/upload`

Purpose:
- Ingest career history with optional methods.

Text wireframe:
```text
+----------------------------------------------------------------+
| Step 3/6 Add Experience                                         |
| Upload CV [PDF/DOCX]                                            |
| LinkedIn URL [optional]                                          |
| Paste history [optional textarea]                                |
| [Parse now] [Save and resume later]                              |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Supports PDF and DOCX validation with size limits.
- Parse failure shows actionable retry guidance.
- At least one input method must be provided.
- User can continue after successful parse output is created.

## `/onboarding/confirm`

Purpose:
- Confirm and correct extracted timeline.

Text wireframe:
```text
+----------------------------------------------------------------+
| Step 4/6 Confirm Extraction                                     |
| Timeline rows: role | company | dates | location | level       |
| Achievements [editable bullets]                                 |
| Tools/skills chips [editable]                                   |
| [Confirm extraction] [Back] [Save and resume later]             |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Every extracted row is editable inline.
- User edits override parser values.
- Missing critical fields are flagged before continue.
- Confirm action persists structured timeline records.

## `/onboarding/quick-preferences`

Purpose:
- Capture initial motivation preferences quickly.

Text wireframe:
```text
+----------------------------------------------------------------+
| Step 5/6 Quick Preferences                                      |
| autonomy <====slider====> structure                             |
| stability <====slider====> growth                               |
| income <====slider====> impact                                  |
| team <====slider====> solo                                      |
| hands-on <====slider====> strategic                             |
| [Continue] [Save and resume later]                              |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Five sliders render with clear anchors.
- Defaults are pre-selected and editable.
- Help text explains downstream impact of preferences.
- Submission writes preferences profile successfully.

## `/onboarding/first-test`

Purpose:
- Collect first measured evidence signal.

Text wireframe:
```text
+----------------------------------------------------------------+
| Step 6/6 First Calibration Test                                 |
| Suggested test: [role family]                                   |
| "Not an exam; calibration for better plan quality"             |
| [Start test] -> progress bar -> results summary                 |
| [Generate starter blueprint]                                    |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Suggested test is derived from profile/goal data.
- Test progress and completion status are visible.
- Results show score + reliability + next action.
- Generate starter blueprint CTA enabled on completion.

## `/app/dashboard`

Purpose:
- Ongoing command center.

Text wireframe:
```text
+----------------------------------------------------------------+
| CIS card | Confidence meter | Evidence coverage                 |
| Next best action [CTA]                                          |
| Drift alerts                                                    |
| Market snapshot                                                 |
+----------------------------------------------------------------+
```

Acceptance criteria:
- CIS and confidence are shown with freshness timestamp.
- Next best action uses deterministic priority logic.
- Drift alerts are visible with dismiss or act actions.
- Empty states exist for users pre-blueprint.

## `/app/profile`

Purpose:
- Evidence and identity management.

Text wireframe:
```text
+----------------------------------------------------------------+
| Tabs: Timeline | Skills | Motivation | Artifacts                |
| Evidence strength list                                           |
| [Add evidence] [Retake calibration]                              |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Timeline tab shows role transitions and edit access.
- Skills tab shows evidence strength per skill.
- Add evidence supports link or file metadata submission.
- Retake calibration routes to relevant assessment path.

## `/app/assessments`

Purpose:
- Manage and complete measurement activities.

Text wireframe:
```text
+----------------------------------------------------------------+
| Sections: Micro-tests | Simulations | Surveys                   |
| Each item: duration, why we ask, status                          |
| Post-completion: reliability + model change summary              |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Assessment catalog shows status per item.
- Why-we-ask helper is visible on each card.
- Completion produces reliability indicator.
- Model-change summary appears after scoring.

## `/app/blueprint`

Purpose:
- Present identity, scenarios, and decision support.

Text wireframe:
```text
+----------------------------------------------------------------+
| CIS + confidence + evidence coverage                             |
| Drivers (top 5) | Risks (top 3)                                 |
| Scenario cards: Safe | Aggressive | Pivot                        |
| Next 3 actions                                                |
| [Download PDF] [Private share link]                              |
+----------------------------------------------------------------+
```

Acceptance criteria:
- CIS and confidence interval are both shown.
- Evidence coverage includes measured vs inferred split.
- Top 5 drivers and top 3 risks are visible.
- Scenario cards include time and salary ranges.
- Next 3 actions are rendered as missions.
- PDF export action returns downloadable file.

## `/app/plan`

Purpose:
- Convert strategy into weekly execution.

Text wireframe:
```text
+----------------------------------------------------------------+
| Month themes                                                     |
| Week missions list                                               |
| Mission detail + submit evidence                                 |
| Weekly check-in modal: completion, time, energy, blocker, links |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Week and mission hierarchy is navigable.
- Mission completion updates streak/progress indicators.
- Check-in modal validates required fields.
- Drift alerts and next missions update after check-in.

## `/app/settings`

Purpose:
- User control, privacy, and account operations.

Text wireframe:
```text
+----------------------------------------------------------------+
| Privacy controls                                                 |
| Consent toggles                                                  |
| Download my data                                                 |
| Request deletion                                                 |
| Notification settings                                             |
+----------------------------------------------------------------+
```

Acceptance criteria:
- Consent toggles mirror saved state accurately.
- Data export request can be initiated with confirmation.
- Deletion request flow includes warning and reversible grace window.
- Profiling transparency links are easy to locate.

## 6. Content and Interaction Rules

- Use plain language over model jargon in user-facing copy.
- Always surface uncertainty and confidence where scores appear.
- Never imply deterministic outcomes in forecasts.
- Keep critical actions available on desktop and mobile.
- Preserve user trust by showing data provenance near model outputs.

## 7. Definition of UX Completion (MVP)

UX scope is complete when:
- All MVP routes are implemented and navigable.
- Onboarding completion from landing to first blueprint is uninterrupted.
- Blueprint page mandatory data points are visible.
- Weekly plan loop works end-to-end with check-in and drift output.
- Required accessibility checks pass for keyboard navigation and contrast.

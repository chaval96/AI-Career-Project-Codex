const root = document.querySelector('[data-dashboard-state]');
const freshnessNode = document.querySelector('#dashboard-freshness');
const profileProgressNode = document.querySelector('#profile-progress');
const profileProgressValueNode = document.querySelector('#profile-progress-value');
const evidenceProgressNode = document.querySelector('#evidence-progress');
const evidenceProgressValueNode = document.querySelector('#evidence-progress-value');
const confidenceMeterNode = document.querySelector('#confidence-meter');
const confidenceValueNode = document.querySelector('#confidence-value');
const confidenceRationaleNode = document.querySelector('#confidence-rationale');
const notificationsNode = document.querySelector('#notifications-list');
const cisOverallNode = document.querySelector('#cis-overall');
const cisBandNode = document.querySelector('#cis-band');
const topClusterNode = document.querySelector('#top-cluster');
const coverageListNode = document.querySelector('#coverage-list');
const nextActionTypeNode = document.querySelector('#next-action-type');
const nextActionCtaNode = document.querySelector('#next-action-cta');
const marketRoiNode = document.querySelector('#market-roi');
const marketOpportunitiesNode = document.querySelector('#market-opportunities');
const driftAlertsNode = document.querySelector('#drift-alerts');
const checkinForm = document.querySelector('#checkin-form');
const checkinStatusNode = document.querySelector('#checkin-status');

function setState(state) {
  root.dataset.dashboardState = state;
}

function toPercent(value) {
  return Math.round((value ?? 0) * 100);
}

function formatFreshness(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Unknown';
  }
}

function renderDashboard(data) {
  const profilePct = toPercent(data.profile_completion_pct);
  const evidencePct = toPercent(data.evidence_completion_pct);
  const confidencePct = toPercent(data.confidence_meter?.value);

  profileProgressNode.style.width = `${profilePct}%`;
  profileProgressValueNode.textContent = `${profilePct}%`;
  evidenceProgressNode.style.width = `${evidencePct}%`;
  evidenceProgressValueNode.textContent = `${evidencePct}%`;
  confidenceMeterNode.style.width = `${confidencePct}%`;
  confidenceValueNode.textContent = `${confidencePct}%`;

  confidenceRationaleNode.innerHTML = (data.confidence_meter?.rationale ?? [])
    .map((item) => `<li>${item}</li>`)
    .join('') || '<li>No rationale available.</li>';

  cisOverallNode.textContent = `${Math.round(data.cis_summary?.cis_mean ?? 0)}`;
  cisBandNode.textContent = `p50 ${Math.round(data.cis_summary?.cis_p50 ?? 0)} / p90 ${Math.round(data.cis_summary?.cis_p90 ?? 0)}`;
  const opportunities = data.market_snapshot?.top_opportunities ?? [];
  topClusterNode.textContent = `Top role cluster: ${opportunities[0] ?? 'not available'}`;

  coverageListNode.innerHTML = [
    `Measured: ${toPercent(data.evidence_coverage?.measured_skills_pct)}%`,
    `Inferred: ${toPercent(data.evidence_coverage?.inferred_skills_pct)}%`,
    `Behavioral: ${toPercent(data.evidence_coverage?.behavioral_pct)}%`,
    `Motivation: ${toPercent(data.evidence_coverage?.motivation_pct)}%`
  ]
    .map((item) => `<li>${item}</li>`)
    .join('');

  nextActionTypeNode.textContent = `Action: ${data.next_best_action?.action ?? 'unknown'}`;
  nextActionCtaNode.textContent = data.next_best_action?.label ?? 'Continue';
  nextActionCtaNode.href = data.next_best_action?.route ?? '/onboarding/consent';

  marketRoiNode.textContent = `ROI skill: ${data.market_snapshot?.roi_skill ?? 'n/a'}`;
  marketOpportunitiesNode.innerHTML = opportunities.length
    ? opportunities.map((item) => `<li>${item}</li>`).join('')
    : '<li>No opportunities loaded yet.</li>';

  const driftAlerts = data.drift_alerts ?? [];
  driftAlertsNode.innerHTML = driftAlerts.length
    ? driftAlerts.map((item) => `<li>${item}</li>`).join('')
    : '<li>No active drift alerts.</li>';

  const notifications = [
    ...(driftAlerts.length ? driftAlerts.map((item) => `Drift alert: ${item}`) : ['No active drift alerts.']),
    'Reminder: submit a weekly check-in every 7 days.'
  ];
  notificationsNode.innerHTML = notifications.map((item) => `<li>${item}</li>`).join('');

  freshnessNode.textContent = `Updated: ${formatFreshness(data.generated_at)}`;
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  return payload;
}

function getCheckinPayload() {
  const blockersRaw = document.querySelector('#blockers').value;
  return {
    week_index: Number.parseInt(document.querySelector('#week-index').value, 10),
    time_spent_min: Number.parseInt(document.querySelector('#time-spent').value, 10),
    energy: Number.parseInt(document.querySelector('#energy-level').value, 10),
    blockers: blockersRaw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  };
}

async function refreshDashboard() {
  const dashboardData = await requestJson('/v1/dashboard');
  renderDashboard(dashboardData);
}

checkinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  checkinStatusNode.textContent = 'State: saving...';
  try {
    await requestJson('/v1/execution/checkin', {
      method: 'POST',
      body: JSON.stringify(getCheckinPayload())
    });
    await refreshDashboard();
    checkinStatusNode.textContent = 'State: saved';
  } catch (error) {
    checkinStatusNode.textContent = `State: error - ${error.message}`;
  }
});

async function init() {
  setState('loading');
  try {
    await refreshDashboard();
    setState('ready');
  } catch (error) {
    setState('error');
    freshnessNode.textContent = `Error: ${error.message}`;
  }
}

await init();

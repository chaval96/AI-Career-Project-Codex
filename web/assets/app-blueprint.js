const root = document.querySelector('[data-blueprint-state]');
const freshnessNode = document.querySelector('#blueprint-freshness');
const cisMeanNode = document.querySelector('#cis-mean');
const cisBandNode = document.querySelector('#cis-band');
const confidenceMeterNode = document.querySelector('#confidence-meter');
const confidenceValueNode = document.querySelector('#confidence-value');
const evidenceCoverageNode = document.querySelector('#evidence-coverage');
const driversNode = document.querySelector('#drivers-list');
const risksNode = document.querySelector('#risks-list');
const scenarioCardsNode = document.querySelector('#scenario-cards');
const nextActionsNode = document.querySelector('#next-actions');
const downloadPdfButton = document.querySelector('#download-pdf');
const shareButton = document.querySelector('#create-share-link');
const shareStatusNode = document.querySelector('#share-status');
const shareUrlNode = document.querySelector('#share-url');

const state = { blueprint: null };

function toPercent(value) {
  return Math.round((value ?? 0) * 100);
}

function setState(value) {
  root.dataset.blueprintState = value;
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

function renderCoverage(coverage) {
  evidenceCoverageNode.innerHTML = [
    `Measured: ${toPercent(coverage?.measured_skills_pct)}%`,
    `Inferred: ${toPercent(coverage?.inferred_skills_pct)}%`,
    `Behavioral: ${toPercent(coverage?.behavioral_pct)}%`,
    `Motivation: ${toPercent(coverage?.motivation_pct)}%`
  ]
    .map((item) => `<li>${item}</li>`)
    .join('');
}

function renderList(node, items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    node.innerHTML = `<li>${fallback}</li>`;
    return;
  }

  node.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

function renderScenarios(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    scenarioCardsNode.innerHTML = '<article class="mini-card">No scenarios loaded yet.</article>';
    return;
  }

  scenarioCardsNode.innerHTML = scenarios
    .map(
      (scenario) => `
        <article class="mini-card">
          <h4>${scenario.name}</h4>
          <p class="muted">Time-to-transition: p10 ${scenario.time_to_transition_months.p10} / p50 ${scenario.time_to_transition_months.p50} / p90 ${scenario.time_to_transition_months.p90} months</p>
          <p class="muted">Earnings range: p10 $${Math.round(scenario.earnings_3yr.p10).toLocaleString()} / p50 $${Math.round(scenario.earnings_3yr.p50).toLocaleString()} / p90 $${Math.round(scenario.earnings_3yr.p90).toLocaleString()}</p>
        </article>
      `
    )
    .join('');
}

function renderActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    nextActionsNode.innerHTML = '<li>No actions available yet.</li>';
    return;
  }

  nextActionsNode.innerHTML = actions
    .map((action) => `<li><strong>${action.title}</strong> (${action.expected_time_min} min)</li>`)
    .join('');
}

function renderBlueprint(blueprint, confidenceValue) {
  state.blueprint = blueprint;
  const cis = blueprint.identity_model?.cis ?? {};
  cisMeanNode.textContent = `${Math.round(cis.cis_mean ?? 0)}`;
  cisBandNode.textContent = `p50 ${Math.round(cis.cis_p50 ?? 0)} / p90 ${Math.round(cis.cis_p90 ?? 0)}`;

  const confidencePct = toPercent(confidenceValue);
  confidenceMeterNode.style.width = `${confidencePct}%`;
  confidenceValueNode.textContent = `${confidencePct}%`;

  renderCoverage(blueprint.identity_model?.evidence_coverage);
  renderList(driversNode, (blueprint.drivers ?? []).slice(0, 5), 'No drivers available yet.');
  renderList(risksNode, (blueprint.risks ?? []).slice(0, 3), 'No risks available yet.');
  renderScenarios(blueprint.scenarios);
  renderActions((blueprint.next_three_actions ?? []).slice(0, 3));
  freshnessNode.textContent = `Updated: ${new Date(blueprint.generated_at ?? Date.now()).toLocaleString()}`;
}

async function loadBlueprint() {
  const [blueprint, dashboard] = await Promise.all([
    requestJson('/v1/blueprint/current'),
    requestJson('/v1/dashboard')
  ]);
  renderBlueprint(blueprint, dashboard.confidence_meter?.value ?? 0);
}

downloadPdfButton.addEventListener('click', () => {
  if (!state.blueprint?.blueprint_id) {
    shareStatusNode.textContent = 'State: error - no blueprint available.';
    return;
  }
  window.open(`/v1/blueprint/${state.blueprint.blueprint_id}/pdf`, '_blank', 'noopener,noreferrer');
});

shareButton.addEventListener('click', async () => {
  if (!state.blueprint?.blueprint_id) {
    shareStatusNode.textContent = 'State: error - no blueprint available.';
    return;
  }

  shareStatusNode.textContent = 'State: creating share link...';
  shareUrlNode.textContent = '';
  try {
    const payload = await requestJson(`/v1/blueprint/${state.blueprint.blueprint_id}/share`, {
      method: 'POST',
      body: JSON.stringify({ expires_in_hours: 72 })
    });
    shareStatusNode.textContent = `State: ready (expires ${new Date(payload.expires_at).toLocaleString()})`;
    shareUrlNode.innerHTML = `<a href="${payload.url}" target="_blank" rel="noopener noreferrer">${payload.url}</a>`;
  } catch (error) {
    shareStatusNode.textContent = `State: error - ${error.message}`;
  }
});

async function init() {
  setState('loading');
  try {
    await loadBlueprint();
    setState('ready');
  } catch (error) {
    setState('empty');
    freshnessNode.textContent = `No blueprint yet: ${error.message}`;
    shareStatusNode.textContent = 'State: generate a blueprint from assessments first.';
  }
}

await init();

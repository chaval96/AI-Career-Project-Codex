const state = {
  attemptId: null,
  blueprintId: null,
  profile: null
};

const sections = ['onboarding', 'assessment', 'scenarios', 'plan'];

function log(message, payload) {
  const output = document.querySelector('#log-output');
  const ts = new Date().toLocaleTimeString();
  const body = payload ? `${message}\n${JSON.stringify(payload, null, 2)}` : message;
  output.textContent = `[${ts}] ${body}\n\n${output.textContent}`;
}

function parseJsonText(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = parseJsonText(text);

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed (${response.status})`);
  }

  return data;
}

function readRoute() {
  const route = window.location.hash.replace('#', '');
  return sections.includes(route) ? route : 'onboarding';
}

function setActiveSection(sectionName) {
  for (const section of sections) {
    const active = section === sectionName;
    const panel = document.querySelector(`#section-${section}`);
    const step = document.querySelector(`.step[data-section="${section}"]`);

    panel.hidden = !active;
    panel.classList.toggle('is-visible', active);
    step.classList.toggle('is-active', active);
  }
}

function bindNavigation() {
  document.querySelectorAll('.step').forEach((button) => {
    button.addEventListener('click', () => {
      window.location.hash = button.dataset.section;
      setActiveSection(button.dataset.section);
    });
  });

  window.addEventListener('hashchange', () => {
    setActiveSection(readRoute());
  });

  setActiveSection(readRoute());
}

function getProfileInputs() {
  return {
    currentRole: document.querySelector('#input-current-role').value.trim(),
    targetRole: document.querySelector('#input-target-role').value.trim(),
    region: document.querySelector('#input-region').value.trim() || 'US-NYC',
    timePerWeekHours: Number(document.querySelector('#input-time-hours').value),
    salaryFloor: Number(document.querySelector('#input-salary-floor').value)
  };
}

function renderProfileSummary() {
  const profileSummary = document.querySelector('#profile-summary');

  if (!state.profile) {
    profileSummary.textContent = 'No profile saved yet.';
    return;
  }

  profileSummary.textContent = [
    `Current role: ${state.profile.currentRole}`,
    `Target role: ${state.profile.targetRole}`,
    `Region: ${state.profile.region}`,
    `Time/week: ${state.profile.timePerWeekHours} hours`,
    `Salary floor: $${state.profile.salaryFloor.toLocaleString()}`
  ].join(' | ');
}

function parseBlockers() {
  return document
    .querySelector('#input-blockers')
    .value.split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function getSelectedScenarios() {
  return [...document.querySelectorAll('.scenario:checked')].map((node) => node.value);
}

function renderAssessmentSummary(text) {
  document.querySelector('#assessment-summary').textContent = text;
}

function renderScenarios(blueprint) {
  const container = document.querySelector('#scenario-cards');

  if (!blueprint?.scenarios?.length) {
    container.innerHTML = '<article class="empty">No scenarios loaded yet.</article>';
    return;
  }

  container.innerHTML = blueprint.scenarios
    .map(
      (scenario) => `
      <article class="scenario-card">
        <h3>${scenario.name}</h3>
        <p>Transition (p50): <strong>${scenario.time_to_transition_months.p50} months</strong></p>
        <p>3-year earnings (p50): <strong>$${Math.round(scenario.earnings_3yr.p50).toLocaleString()}</strong></p>
        <p class="muted">Top risk: ${(scenario.risks ?? ['none'])[0]}</p>
      </article>
    `
    )
    .join('');
}

function renderCheckin(data) {
  const alerts = document.querySelector('#alerts-list');
  const missions = document.querySelector('#missions-list');

  const alertItems = data.drift_alerts?.length
    ? data.drift_alerts.map((item) => `<li>${item}</li>`).join('')
    : '<li>No alerts.</li>';

  const missionItems = data.next_missions?.length
    ? data.next_missions
        .map(
          (item) =>
            `<li><strong>${item.title}</strong> (${item.expected_time_min} min)</li>`
        )
        .join('')
    : '<li>No missions generated.</li>';

  alerts.innerHTML = alertItems;
  missions.innerHTML = missionItems;
}

async function refreshHealth() {
  const health = await requestJson('/health');
  const readiness = health.db_ready ? 'ready' : 'not-ready';
  document.querySelector('#backend-pill').textContent = `Platform: ${health.status} (${readiness})`;
  document.querySelector('#store-pill').textContent = `Store: ${health.store_backend} (${readiness})`;
  log('Health check loaded', health);
}

async function saveProfile() {
  state.profile = getProfileInputs();
  renderProfileSummary();
  log('Career goals saved', state.profile);
}

async function runResumeIntake() {
  const parseData = await requestJson('/v1/profile/resume', {
    method: 'POST',
    body: JSON.stringify({ locale: 'en-US', region: getProfileInputs().region })
  });

  const confirmData = await requestJson('/v1/profile/confirm', {
    method: 'POST',
    body: JSON.stringify({ resume_items: parseData.extracted_items })
  });

  log('Resume intake complete', { parseData, confirmData });
}

async function searchRoles() {
  const query = encodeURIComponent(document.querySelector('#input-role-query').value || 'software');
  const data = await requestJson(`/v1/taxonomy/roles?q=${query}&limit=5`);
  log('Matching roles', data);
}

async function startAssessment() {
  const session = await requestJson('/v1/assessments/start', {
    method: 'POST',
    body: JSON.stringify({
      assessment_type: 'micro_test',
      role_family: 'software_engineering',
      version: '0.1.0'
    })
  });

  state.attemptId = session.attempt_id;
  renderAssessmentSummary(`Assessment active: ${state.attemptId}`);
  log('Assessment started', session);
}

async function submitAssessment() {
  if (!state.attemptId) {
    throw new Error('Start the assessment first.');
  }

  const answers = {
    q1: document.querySelector('#input-q1').value,
    q2: document.querySelector('#input-q2').value,
    q3: document.querySelector('#input-q3').value
  };

  await requestJson('/v1/assessments/events', {
    method: 'POST',
    body: JSON.stringify({
      attempt_id: state.attemptId,
      events: [
        { t: 10, name: 'answer', data: { question: 'q1', value: answers.q1 } },
        { t: 20, name: 'answer', data: { question: 'q2', value: answers.q2 } },
        { t: 30, name: 'answer', data: { question: 'q3', value: answers.q3 } }
      ]
    })
  });

  const result = await requestJson('/v1/assessments/complete', {
    method: 'POST',
    body: JSON.stringify({ attempt_id: state.attemptId })
  });

  renderAssessmentSummary(
    `Completed | overall=${result.scores.overall} | reliability=${result.reliability}`
  );
  log('Assessment completed', result);
}

async function generateScenarios() {
  const profile = state.profile ?? getProfileInputs();
  const scenarios = getSelectedScenarios();

  if (scenarios.length === 0) {
    throw new Error('Select at least one scenario.');
  }

  const response = await requestJson('/v1/blueprint/generate', {
    method: 'POST',
    body: JSON.stringify({
      region: profile.region,
      target_roles: [profile.targetRole || '15-1252.00'],
      scenarios,
      constraints: {
        time_per_week_hours: profile.timePerWeekHours,
        salary_floor: profile.salaryFloor
      }
    })
  });

  state.blueprintId = response.blueprint_id;
  log('Scenario generation queued', response);
}

async function loadScenarios() {
  if (!state.blueprintId) {
    throw new Error('Generate scenarios first.');
  }

  const blueprint = await requestJson(`/v1/blueprint/${state.blueprintId}`);
  renderScenarios(blueprint);
  log('Scenario details loaded', blueprint);
}

function openReport() {
  if (!state.blueprintId) {
    throw new Error('Generate scenarios first.');
  }

  const url = `/v1/blueprint/${state.blueprintId}/pdf`;
  window.open(url, '_blank', 'noopener,noreferrer');
  log('Opened blueprint report', { url });
}

async function submitCheckin() {
  const payload = {
    week_index: Number(document.querySelector('#input-week-index').value),
    time_spent_min: Number(document.querySelector('#input-time-spent').value),
    energy: Number(document.querySelector('#input-energy').value),
    blockers: parseBlockers()
  };

  const data = await requestJson('/v1/execution/checkin', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  renderCheckin(data);
  log('Weekly check-in updated', data);
}

function bindAction(selector, handler) {
  const node = document.querySelector(selector);
  node.addEventListener('click', async () => {
    try {
      await handler();
    } catch (error) {
      log('Action failed', { action: selector, error: error.message });
    }
  });
}

function bindActions() {
  bindAction('#btn-save-profile', saveProfile);
  bindAction('#btn-run-resume-intake', runResumeIntake);
  bindAction('#btn-search-roles', searchRoles);
  bindAction('#btn-start-assessment', startAssessment);
  bindAction('#btn-submit-assessment', submitAssessment);
  bindAction('#btn-generate-blueprint', generateScenarios);
  bindAction('#btn-load-blueprint', loadScenarios);
  bindAction('#btn-open-report', openReport);
  bindAction('#btn-submit-checkin', submitCheckin);
}

async function init() {
  bindNavigation();
  bindActions();
  renderProfileSummary();

  try {
    await refreshHealth();
  } catch (error) {
    document.querySelector('#backend-pill').textContent = 'Platform: unavailable';
    document.querySelector('#store-pill').textContent = 'Store: unknown';
    log('Health check failed', { error: error.message });
  }
}

init();

const state = {
  attemptId: null,
  blueprintId: null
};

const sections = ['overview', 'profile', 'assessments', 'blueprint', 'execution'];

function log(message, payload) {
  const output = document.querySelector('#log-output');
  const timestamp = new Date().toLocaleTimeString();
  const body = payload === undefined ? message : `${message}\n${JSON.stringify(payload, null, 2)}`;
  output.textContent = `[${timestamp}] ${body}\n\n${output.textContent}`;
}

function updateSummary() {
  document.querySelector('#attempt-id').textContent = state.attemptId ?? 'Not started';
  document.querySelector('#blueprint-id').textContent = state.blueprintId ?? 'Not generated';
}

function setActiveSection(sectionName) {
  for (const section of sections) {
    const isVisible = section === sectionName;
    const panel = document.querySelector(`#section-${section}`);
    panel.hidden = !isVisible;
    panel.classList.toggle('is-visible', isVisible);

    const button = document.querySelector(`.tab-button[data-section="${section}"]`);
    button.classList.toggle('is-active', isVisible);
  }
}

function readRoute() {
  const hash = window.location.hash.replace('#', '');
  return sections.includes(hash) ? hash : 'overview';
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
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

function getSelectedScenarios() {
  return [...document.querySelectorAll('.scenario:checked')].map((input) => input.value);
}

async function refreshHealth() {
  const health = await requestJson('/health');
  const readiness = health.db_ready ? 'ready' : 'not-ready';
  document.querySelector('#backend-pill').textContent = `Backend: ${health.status} (${readiness})`;
  document.querySelector('#store-backend').textContent = `${health.store_backend} (${readiness})`;
  log('Health check loaded', health);
}

function parseBlockers() {
  return document
    .querySelector('#input-blockers')
    .value.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function handleParseResume() {
  const data = await requestJson('/v1/profile/resume', {
    method: 'POST',
    body: JSON.stringify({ locale: 'en-US' })
  });
  log('Parsed demo resume', data);
}

async function handleConfirmResume() {
  const data = await requestJson('/v1/profile/confirm', {
    method: 'POST',
    body: JSON.stringify({
      resume_items: [
        {
          org: 'Example Org',
          role_title: 'Software Engineer',
          start_date: '2023-01-01',
          end_date: null,
          industry: 'Technology'
        }
      ]
    })
  });
  log('Saved resume items', data);
}

async function handleRoleSearch() {
  const query = encodeURIComponent(document.querySelector('#input-role-query').value || 'software');
  const data = await requestJson(`/v1/taxonomy/roles?q=${query}&limit=5`);
  log('Role search results', data);
}

async function handleStartAssessment() {
  const data = await requestJson('/v1/assessments/start', {
    method: 'POST',
    body: JSON.stringify({
      assessment_type: 'micro_test',
      role_family: 'software_engineering',
      version: '0.1.0'
    })
  });

  state.attemptId = data.attempt_id;
  updateSummary();
  log('Assessment started', data);
}

async function handleSendEvents() {
  if (!state.attemptId) {
    throw new Error('Start an assessment first.');
  }

  await requestJson('/v1/assessments/events', {
    method: 'POST',
    body: JSON.stringify({
      attempt_id: state.attemptId,
      events: [
        { t: 10, name: 'answer', data: { selected: 'A' } },
        { t: 22, name: 'answer', data: { selected: 'C' } },
        { t: 38, name: 'decision', data: { confidence: 0.8 } }
      ]
    })
  });

  log('Assessment events sent', { attempt_id: state.attemptId });
}

async function handleCompleteAssessment() {
  if (!state.attemptId) {
    throw new Error('Start an assessment first.');
  }

  const data = await requestJson('/v1/assessments/complete', {
    method: 'POST',
    body: JSON.stringify({ attempt_id: state.attemptId })
  });

  log('Assessment completed', data);
}

async function handleGenerateBlueprint() {
  const scenarios = getSelectedScenarios();
  if (scenarios.length === 0) {
    throw new Error('Select at least one scenario.');
  }

  const region = document.querySelector('#input-region').value || 'US-NYC';
  const data = await requestJson('/v1/blueprint/generate', {
    method: 'POST',
    body: JSON.stringify({
      region,
      target_roles: ['15-1252.00'],
      scenarios,
      constraints: { time_per_week_hours: 6 }
    })
  });

  state.blueprintId = data.blueprint_id;
  updateSummary();
  log('Blueprint generation queued', data);
}

async function handleFetchBlueprint() {
  if (!state.blueprintId) {
    throw new Error('Generate a blueprint first.');
  }

  const data = await requestJson(`/v1/blueprint/${state.blueprintId}`);
  log('Blueprint fetched', data);
}

function handleDownloadPdf() {
  if (!state.blueprintId) {
    throw new Error('Generate a blueprint first.');
  }

  const url = `/v1/blueprint/${state.blueprintId}/pdf`;
  window.open(url, '_blank', 'noopener,noreferrer');
  log('Opened blueprint PDF', { url });
}

async function handleSubmitCheckin() {
  const weekIndex = Number(document.querySelector('#input-week-index').value);
  const timeSpent = Number(document.querySelector('#input-time-spent').value);
  const energy = Number(document.querySelector('#input-energy').value);
  const blockers = parseBlockers();

  const data = await requestJson('/v1/execution/checkin', {
    method: 'POST',
    body: JSON.stringify({
      week_index: weekIndex,
      time_spent_min: timeSpent,
      energy,
      blockers
    })
  });

  log('Weekly check-in submitted', data);
}

function bindAction(buttonId, handler) {
  const button = document.querySelector(buttonId);
  button.addEventListener('click', async () => {
    try {
      await handler();
    } catch (error) {
      log('Action failed', { button: buttonId, error: error.message });
    }
  });
}

function initNavigation() {
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => {
      const section = button.dataset.section;
      window.location.hash = section;
      setActiveSection(section);
    });
  });

  window.addEventListener('hashchange', () => {
    setActiveSection(readRoute());
  });

  setActiveSection(readRoute());
}

function initActions() {
  bindAction('#btn-parse-resume', handleParseResume);
  bindAction('#btn-confirm-resume', handleConfirmResume);
  bindAction('#btn-search-roles', handleRoleSearch);

  bindAction('#btn-start-assessment', handleStartAssessment);
  bindAction('#btn-send-events', handleSendEvents);
  bindAction('#btn-complete-assessment', handleCompleteAssessment);

  bindAction('#btn-generate-blueprint', handleGenerateBlueprint);
  bindAction('#btn-fetch-blueprint', handleFetchBlueprint);
  bindAction('#btn-download-pdf', handleDownloadPdf);

  bindAction('#btn-submit-checkin', handleSubmitCheckin);
}

async function init() {
  updateSummary();
  initNavigation();
  initActions();

  try {
    await refreshHealth();
  } catch (error) {
    log('Health check failed', { error: error.message });
    document.querySelector('#backend-pill').textContent = 'Backend: unavailable';
  }
}

init();

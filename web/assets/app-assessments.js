const root = document.querySelector('[data-assessments-state]');
const freshnessNode = document.querySelector('#assessments-freshness');
const cardsNode = document.querySelector('#assessments-cards');
const sessionSummaryNode = document.querySelector('#session-summary');
const sessionStatusNode = document.querySelector('#session-status');
const deltaSummaryNode = document.querySelector('#delta-summary');
const startButton = document.querySelector('#start-micro-test');
const submitButton = document.querySelector('#submit-micro-test');

const session = { attemptId: null };

function setState(state) {
  root.dataset.assessmentsState = state;
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

function renderCatalog(items) {
  if (!Array.isArray(items) || items.length === 0) {
    cardsNode.innerHTML = '<article class="mini-card">No assessments available.</article>';
    return;
  }

  cardsNode.innerHTML = items
    .map((item) => {
      const reliability = item.reliability === null ? 'n/a' : `${Math.round(item.reliability * 100)}%`;
      return `
        <article class="mini-card">
          <h4>${item.title}</h4>
          <p class="muted">${item.type} · ${item.duration_min} min</p>
          <p class="muted">Why we ask: ${item.why_we_ask}</p>
          <p>Status: <strong>${item.status}</strong></p>
          <p>Reliability: <strong>${reliability}</strong></p>
        </article>
      `;
    })
    .join('');
}

async function refreshCatalog() {
  const catalog = await requestJson('/v1/assessments/catalog');
  renderCatalog(catalog.items);
  freshnessNode.textContent = `Updated: ${new Date().toLocaleString()}`;
}

async function startMicroTest() {
  const payload = await requestJson('/v1/assessments/start', {
    method: 'POST',
    body: JSON.stringify({
      assessment_type: 'micro_test',
      role_family: 'software_engineering'
    })
  });

  session.attemptId = payload.attempt_id;
  sessionSummaryNode.textContent = `Active session: ${session.attemptId}`;
  submitButton.disabled = false;
  sessionStatusNode.textContent = 'State: started';
}

async function completeMicroTest() {
  if (!session.attemptId) {
    throw new Error('No active session.');
  }

  await requestJson('/v1/assessments/events', {
    method: 'POST',
    body: JSON.stringify({
      attempt_id: session.attemptId,
      events: [
        { t: 10, name: 'answer', data: { selected: 'A' } },
        { t: 20, name: 'answer', data: { selected: 'C' } }
      ]
    })
  });

  const result = await requestJson('/v1/assessments/complete', {
    method: 'POST',
    body: JSON.stringify({ attempt_id: session.attemptId })
  });

  sessionStatusNode.textContent = `State: completed | reliability ${Math.round(result.reliability * 100)}%`;
  deltaSummaryNode.innerHTML = (result.model_delta_summary ?? [])
    .map((item) => `<li>${item}</li>`)
    .join('') || '<li>No model delta summary available.</li>';
  session.attemptId = null;
  submitButton.disabled = true;
  await refreshCatalog();
}

startButton.addEventListener('click', async () => {
  sessionStatusNode.textContent = 'State: starting...';
  try {
    await startMicroTest();
  } catch (error) {
    sessionStatusNode.textContent = `State: error - ${error.message}`;
  }
});

submitButton.addEventListener('click', async () => {
  sessionStatusNode.textContent = 'State: completing...';
  try {
    await completeMicroTest();
  } catch (error) {
    sessionStatusNode.textContent = `State: error - ${error.message}`;
  }
});

async function init() {
  setState('loading');
  try {
    await refreshCatalog();
    setState('ready');
  } catch (error) {
    freshnessNode.textContent = `Error: ${error.message}`;
    setState('error');
  }
}

await init();

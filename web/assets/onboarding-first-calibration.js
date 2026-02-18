const SESSION_KEY = 'onboarding_first_test_session_v1';

const root = document.querySelector('[data-first-test-state]');
const errorsNode = document.querySelector('#first-test-errors');
const statusNode = document.querySelector('#first-test-status');
const suggestedRoleNode = document.querySelector('#first-test-suggested-role');
const rationaleNode = document.querySelector('#first-test-suggestion-rationale');
const progressBarNode = document.querySelector('#first-test-progress-bar');
const progressTextNode = document.querySelector('#first-test-progress-text');
const resultPanel = document.querySelector('#first-test-result');
const resultScoreNode = document.querySelector('#first-test-result-score');
const resultReliabilityNode = document.querySelector('#first-test-result-reliability');
const resultNextActionNode = document.querySelector('#first-test-result-next-action');
const miniPlanNode = document.querySelector('#first-test-mini-plan');

const startButton = document.querySelector('#btn-first-test-start');
const recordButton = document.querySelector('#btn-first-test-record-event');
const completeButton = document.querySelector('#btn-first-test-complete');
const saveLaterButton = document.querySelector('#btn-first-test-save-later');

const session = {
  attemptId: null,
  prompts: [],
  progressIndex: 0,
  startedAtMs: null,
  suggestion: null
};

function setState(state, message) {
  root.dataset.firstTestState = state;
  statusNode.textContent = message;
}

function showErrors(errors) {
  if (errors.length === 0) {
    errorsNode.hidden = true;
    errorsNode.innerHTML = '';
    return;
  }

  errorsNode.hidden = false;
  errorsNode.innerHTML = errors.map((error) => `<li>${error}</li>`).join('');
}

function updateControls() {
  const hasAttempt = Boolean(session.attemptId);
  const promptCount = session.prompts.length;
  const done = promptCount > 0 && session.progressIndex >= promptCount;

  startButton.disabled = hasAttempt && !done;
  recordButton.disabled = !hasAttempt || done;
  completeButton.disabled = !hasAttempt || !done;
}

function updateProgress() {
  const promptCount = session.prompts.length;
  const pct = promptCount === 0 ? 0 : Math.round((session.progressIndex / promptCount) * 100);
  progressBarNode.style.width = `${pct}%`;
  progressTextNode.textContent = `Progress: ${pct}%`;
}

function saveSession() {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      attempt_id: session.attemptId,
      prompts: session.prompts,
      progress_index: session.progressIndex,
      started_at_ms: session.startedAtMs,
      suggestion: session.suggestion
    })
  );
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function loadSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    session.attemptId = parsed.attempt_id ?? null;
    session.prompts = Array.isArray(parsed.prompts) ? parsed.prompts : [];
    session.progressIndex = Number.isInteger(parsed.progress_index) ? parsed.progress_index : 0;
    session.startedAtMs = typeof parsed.started_at_ms === 'number' ? parsed.started_at_ms : Date.now();
    session.suggestion = parsed.suggestion ?? null;
  } catch {
    // ignore invalid local session
  }
}

function renderSuggestion(suggestion) {
  const roleFamily = suggestion?.role_family ?? 'software_engineering';
  const rationale = suggestion?.rationale ?? 'Suggestion is based on your onboarding goals.';
  suggestedRoleNode.textContent = `Suggested test: ${roleFamily}`;
  rationaleNode.textContent = rationale;
}

function renderResult(assessmentResult, starterBlueprint, nextAction) {
  resultPanel.hidden = false;
  resultScoreNode.textContent = `Score: ${(assessmentResult.scores.overall * 100).toFixed(0)} / 100`;
  resultReliabilityNode.textContent = `Reliability: ${(assessmentResult.reliability * 100).toFixed(0)}%`;
  resultNextActionNode.textContent = `Next action: ${nextAction?.label ?? 'Generate starter blueprint'}`;
  miniPlanNode.innerHTML = (starterBlueprint.mini_plan ?? [])
    .map((mission) => `<li>${mission.title} (${mission.expected_time_min} min)</li>`)
    .join('');
}

async function fetchOnboardingState() {
  const response = await fetch('/v1/onboarding/state');
  if (!response.ok) {
    throw new Error(`Failed to load onboarding state (${response.status})`);
  }
  return response.json();
}

async function startFirstTest() {
  const response = await fetch('/v1/onboarding/first-test/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error ?? message;
    } catch {
      // keep fallback
    }
    throw new Error(message);
  }

  return response.json();
}

async function sendNextEvent() {
  const eventOffset = Math.max(1, Date.now() - (session.startedAtMs ?? Date.now()));
  const response = await fetch('/v1/assessments/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attempt_id: session.attemptId,
      events: [
        {
          t: eventOffset,
          name: 'answer',
          data: {
            prompt_index: session.progressIndex,
            prompt: session.prompts[session.progressIndex] ?? null
          }
        }
      ]
    })
  });

  if (!response.ok) {
    let message = `Event submission failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error ?? message;
    } catch {
      // keep fallback
    }
    throw new Error(message);
  }
}

async function completeFirstTest() {
  const response = await fetch('/v1/onboarding/first-test/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attempt_id: session.attemptId })
  });

  if (!response.ok) {
    let message = `Completion failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error ?? message;
    } catch {
      // keep fallback
    }
    throw new Error(message);
  }

  return response.json();
}

startButton.addEventListener('click', async () => {
  showErrors([]);
  setState('starting', 'State: starting - creating first-test session...');
  try {
    const payload = await startFirstTest();
    session.attemptId = payload.attempt_id;
    session.prompts = Array.isArray(payload.manifest?.prompts) ? payload.manifest.prompts : [];
    session.progressIndex = 0;
    session.startedAtMs = Date.now();
    session.suggestion = {
      role_family: payload.manifest?.suggested_role_family ?? 'software_engineering',
      rationale: payload.manifest?.suggestion_rationale ?? 'Suggested from onboarding context.'
    };
    renderSuggestion(session.suggestion);
    saveSession();
    updateProgress();
    updateControls();
    setState('running', 'State: running - record each response to progress.');
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
    showErrors([error.message]);
  }
});

recordButton.addEventListener('click', async () => {
  showErrors([]);
  setState('saving', 'State: saving - recording response...');
  try {
    await sendNextEvent();
    session.progressIndex += 1;
    saveSession();
    updateProgress();
    updateControls();
    if (session.progressIndex >= session.prompts.length) {
      setState('running', 'State: running - all prompts completed. Finish to see results.');
    } else {
      setState('running', `State: running - response ${session.progressIndex}/${session.prompts.length} saved.`);
    }
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
    showErrors([error.message]);
  }
});

completeButton.addEventListener('click', async () => {
  showErrors([]);
  setState('saving', 'State: saving - finalizing results...');
  try {
    const payload = await completeFirstTest();
    renderResult(payload.assessment_result, payload.starter_blueprint, payload.next_action);
    clearSession();
    session.attemptId = null;
    session.prompts = [];
    session.progressIndex = 0;
    updateProgress();
    updateControls();
    setState('completed', 'State: completed - results ready. Next action: Generate starter blueprint.');
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
    showErrors([error.message]);
  }
});

saveLaterButton.addEventListener('click', () => {
  saveSession();
  showErrors([]);
  setState('saved', 'State: saved - first-test progress stored, resume later.');
});

async function initialize() {
  loadSession();
  updateProgress();
  updateControls();

  try {
    const onboardingState = await fetchOnboardingState();
    renderSuggestion(onboardingState.first_test_suggestion);

    if (onboardingState.first_test?.status === 'completed') {
      renderResult(
        onboardingState.first_test.result,
        onboardingState.first_test.starter_blueprint,
        { label: 'Generate starter blueprint' }
      );
      clearSession();
      session.attemptId = null;
      session.prompts = [];
      session.progressIndex = 0;
      updateProgress();
      updateControls();
      setState('completed', 'State: completed - first test already finished.');
      return;
    }

    if (!onboardingState.completed_steps.includes('quick-preferences')) {
      setState('error', 'State: error - complete quick preferences before this step.');
      showErrors(['Complete quick preferences first, then return to this page.']);
      return;
    }
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
    showErrors([error.message]);
    return;
  }

  if (session.attemptId) {
    setState('loaded', 'State: loaded - restored in-progress test session.');
  } else {
    setState('idle', 'State: idle');
  }
}

await initialize();

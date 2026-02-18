const STORAGE_KEY = 'onboarding_goals_draft_v1';
const root = document.querySelector('[data-goals-state]');
const form = document.querySelector('#goals-form');
const statusNode = document.querySelector('#goals-status');
const errorList = document.querySelector('#goals-errors');
const saveLaterButton = document.querySelector('#btn-goals-save-later');

const fields = {
  goalType: document.querySelector('#goal-type'),
  timeHorizon: document.querySelector('#time-horizon'),
  timeHours: document.querySelector('#time-hours'),
  location: document.querySelector('#location'),
  salaryFloor: document.querySelector('#salary-floor'),
  relocationOk: document.querySelector('#relocation-ok'),
  remoteOnly: document.querySelector('#remote-only')
};

function setState(state, message) {
  root.dataset.goalsState = state;
  statusNode.textContent = message;
}

function readForm() {
  const rawSalary = fields.salaryFloor.value.trim();
  return {
    goal_type: fields.goalType.value,
    time_horizon_months: Number(fields.timeHorizon.value),
    time_per_week_hours: Number(fields.timeHours.value),
    salary_floor: rawSalary ? Number(rawSalary) : null,
    location: fields.location.value.trim(),
    relocation_ok: fields.relocationOk.checked,
    remote_only: fields.remoteOnly.checked
  };
}

function showErrors(errors) {
  if (errors.length === 0) {
    errorList.hidden = true;
    errorList.innerHTML = '';
    return;
  }

  errorList.hidden = false;
  errorList.innerHTML = errors.map((error) => `<li>${error}</li>`).join('');
}

function validateRequired(payload) {
  const errors = [];

  if (!payload.goal_type) {
    errors.push('Goal type is required.');
  }

  if (![3, 6, 12].includes(payload.time_horizon_months)) {
    errors.push('Time horizon must be 3, 6, or 12 months.');
  }

  if (!Number.isFinite(payload.time_per_week_hours) || payload.time_per_week_hours <= 0) {
    errors.push('Time per week must be greater than 0.');
  }

  if (!payload.location) {
    errors.push('Location is required so market data can be localized.');
  }

  if (
    payload.salary_floor !== null &&
    (!Number.isFinite(payload.salary_floor) || payload.salary_floor < 0)
  ) {
    errors.push('Salary floor, when provided, must be a number >= 0.');
  }

  return errors;
}

function saveDraft(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const payload = JSON.parse(raw);
    fields.goalType.value = payload.goal_type ?? 'promotion';
    fields.timeHorizon.value = String(payload.time_horizon_months ?? 6);
    fields.timeHours.value = String(payload.time_per_week_hours ?? 6);
    fields.location.value = payload.location ?? '';
    fields.salaryFloor.value = payload.salary_floor ?? '';
    fields.relocationOk.checked = Boolean(payload.relocation_ok);
    fields.remoteOnly.checked = Boolean(payload.remote_only);
    return true;
  } catch {
    return false;
  }
}

async function submitGoals(payload) {
  const response = await fetch('/v1/onboarding/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.error ?? message;
    } catch {
      // fallback
    }
    throw new Error(message);
  }

  return response.json();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = readForm();
  const errors = validateRequired(payload);
  showErrors(errors);
  if (errors.length > 0) {
    setState('error', 'State: error - fix required fields to continue.');
    return;
  }

  saveDraft(payload);
  setState('saving', 'State: saving - persisting goals...');

  try {
    const result = await submitGoals(payload);
    setState('saved', `State: saved - profile completion ${Math.round(result.profile_completion_pct * 100)}%. Next step: /onboarding/upload`);
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
  }
});

saveLaterButton.addEventListener('click', () => {
  const payload = readForm();
  saveDraft(payload);
  showErrors([]);
  setState('saved', 'State: saved - draft stored locally, resume later anytime.');
});

const restored = loadDraft();
setState(restored ? 'loaded' : 'idle', restored ? 'State: loaded - restored saved draft.' : 'State: idle');

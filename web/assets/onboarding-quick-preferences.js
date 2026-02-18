const DRAFT_KEY = 'onboarding_quick_preferences_draft_v1';
const FIELDS = [
  'autonomy_vs_structure',
  'stability_vs_growth',
  'income_vs_impact',
  'team_vs_solo',
  'hands_on_vs_strategic'
];

const root = document.querySelector('[data-preferences-state]');
const form = document.querySelector('#preferences-form');
const saveLaterButton = document.querySelector('#btn-preferences-save-later');
const statusNode = document.querySelector('#preferences-status');
const errorList = document.querySelector('#preferences-errors');

const fieldNodes = Object.fromEntries(
  FIELDS.map((field) => [field, document.querySelector(`#${field}`)])
);
const valueNodes = Object.fromEntries(
  FIELDS.map((field) => [field, document.querySelector(`#${field}_value`)])
);

function setState(state, message) {
  root.dataset.preferencesState = state;
  statusNode.textContent = message;
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

function readValues() {
  return Object.fromEntries(
    FIELDS.map((field) => [field, Number.parseInt(fieldNodes[field].value, 10)])
  );
}

function applyValues(values) {
  FIELDS.forEach((field) => {
    if (Number.isInteger(values[field])) {
      fieldNodes[field].value = String(values[field]);
      valueNodes[field].textContent = String(values[field]);
    }
  });
}

function validateValues(values) {
  const errors = [];
  FIELDS.forEach((field) => {
    if (!Number.isInteger(values[field]) || values[field] < 0 || values[field] > 100) {
      errors.push(`${field} must be an integer between 0 and 100.`);
    }
  });
  return errors;
}

function saveDraft(values) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

async function loadSavedPreferences() {
  try {
    const response = await fetch('/v1/onboarding/state');
    if (!response.ok) {
      return null;
    }
    const state = await response.json();
    return state.quick_preferences ?? null;
  } catch {
    return null;
  }
}

async function submitPreferences(values) {
  const response = await fetch('/v1/onboarding/quick-preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values)
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

async function initialize() {
  const serverValues = await loadSavedPreferences();
  if (serverValues) {
    applyValues(serverValues);
    setState('loaded', 'State: loaded - restored saved preferences.');
    return;
  }

  const draftValues = loadDraft();
  if (draftValues) {
    applyValues(draftValues);
    setState('loaded', 'State: loaded - restored saved draft.');
    return;
  }

  setState('idle', 'State: idle');
}

FIELDS.forEach((field) => {
  fieldNodes[field].addEventListener('input', () => {
    valueNodes[field].textContent = fieldNodes[field].value;
    saveDraft(readValues());
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = readValues();
  const errors = validateValues(values);
  showErrors(errors);
  if (errors.length > 0) {
    setState('error', 'State: error - fix slider values and retry.');
    return;
  }

  saveDraft(values);
  setState('saving', 'State: saving - storing preference snapshot...');

  try {
    await submitPreferences(values);
    localStorage.removeItem(DRAFT_KEY);
    setState('saved', 'State: saved - preferences captured. Next step: /onboarding/first-test');
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
  }
});

saveLaterButton.addEventListener('click', () => {
  const values = readValues();
  saveDraft(values);
  showErrors([]);
  setState('saved', 'State: saved - draft stored, resume later.');
});

await initialize();

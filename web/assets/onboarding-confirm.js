const STORAGE_KEY = 'onboarding_parse_result_v1';
const DRAFT_KEY = 'onboarding_confirm_draft_v1';

const root = document.querySelector('[data-confirm-state]');
const form = document.querySelector('#confirm-form');
const timelineContainer = document.querySelector('#timeline-container');
const addRowButton = document.querySelector('#btn-add-row');
const saveLaterButton = document.querySelector('#btn-confirm-save-later');
const statusNode = document.querySelector('#confirm-status');
const errorList = document.querySelector('#confirm-errors');

function setState(state, message) {
  root.dataset.confirmState = state;
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

function rowTemplate(item = {}) {
  return `
    <article class="timeline-row" data-role-row>
      <label class="field">
        Role title
        <input data-field="role_title" type="text" value="${item.role_title ?? ''}" />
      </label>
      <label class="field">
        Company
        <input data-field="org" type="text" value="${item.org ?? ''}" />
      </label>
      <label class="field">
        Start date
        <input data-field="start_date" type="date" value="${item.start_date ?? ''}" />
      </label>
      <label class="field">
        End date
        <input data-field="end_date" type="date" value="${item.end_date ?? ''}" />
      </label>
      <label class="field">
        Location
        <input data-field="location" type="text" value="${item.location ?? ''}" />
      </label>
      <label class="field">
        Level
        <input data-field="level" type="text" value="${item.level ?? ''}" />
      </label>
      <label class="field field-span-2">
        Achievements (comma separated)
        <input data-field="achievements" type="text" value="${(item.achievements ?? []).join(', ')}" />
      </label>
      <label class="field field-span-2">
        Tools / skills detected (comma separated)
        <input data-field="tools" type="text" value="${(item.tools ?? []).join(', ')}" />
      </label>
      <button class="remove-row" type="button" data-remove-row>Remove</button>
    </article>
  `;
}

function parseCommaList(value) {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function readRows() {
  return [...timelineContainer.querySelectorAll('[data-role-row]')].map((row) => {
    const read = (field) => row.querySelector(`[data-field="${field}"]`).value.trim();
    return {
      role_title: read('role_title'),
      org: read('org'),
      start_date: read('start_date'),
      end_date: read('end_date') || null,
      location: read('location') || null,
      level: read('level') || null,
      achievements: parseCommaList(read('achievements')),
      tools: parseCommaList(read('tools')),
      self_claimed_skills: parseCommaList(read('tools'))
    };
  });
}

function validateRows(rows) {
  const errors = [];
  if (rows.length === 0) {
    errors.push('Add at least one role entry before confirming.');
    return errors;
  }

  rows.forEach((row, index) => {
    if (!row.role_title) {
      errors.push(`Row ${index + 1}: role title is required.`);
    }
    if (!row.org) {
      errors.push(`Row ${index + 1}: company is required.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.start_date)) {
      errors.push(`Row ${index + 1}: valid start date is required.`);
    }
  });

  return errors;
}

function saveDraft(rows) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(rows));
}

function loadInitialRows() {
  const draftRaw = localStorage.getItem(DRAFT_KEY);
  if (draftRaw) {
    try {
      const parsed = JSON.parse(draftRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore draft parse error
    }
  }

  const parseRaw = localStorage.getItem(STORAGE_KEY);
  if (parseRaw) {
    try {
      const parsed = JSON.parse(parseRaw);
      if (Array.isArray(parsed.extracted_items) && parsed.extracted_items.length > 0) {
        return parsed.extracted_items;
      }
    } catch {
      // ignore parse payload error
    }
  }

  return [
    {
      role_title: '',
      org: '',
      start_date: '',
      end_date: '',
      location: '',
      level: '',
      achievements: [],
      tools: []
    }
  ];
}

function renderRows(rows) {
  timelineContainer.innerHTML = rows.map((row) => rowTemplate(row)).join('');

  timelineContainer.querySelectorAll('[data-remove-row]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('[data-role-row]')?.remove();
      const remainingRows = readRows();
      saveDraft(remainingRows);
    });
  });
}

async function submitConfirmation(rows) {
  const response = await fetch('/v1/onboarding/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_items: rows })
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

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const rows = readRows();
  const errors = validateRows(rows);
  showErrors(errors);
  if (errors.length > 0) {
    setState('error', 'State: error - fix required timeline fields and retry.');
    return;
  }

  saveDraft(rows);
  setState('saving', 'State: saving - confirming extraction...');

  try {
    const result = await submitConfirmation(rows);
    localStorage.removeItem(DRAFT_KEY);
    setState('saved', `State: saved - confirmed ${result.saved_count} role entries. Next step: /onboarding/quick-preferences`);
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
  }
});

saveLaterButton.addEventListener('click', () => {
  const rows = readRows();
  saveDraft(rows);
  showErrors([]);
  setState('saved', 'State: saved - timeline draft stored, resume later.');
});

addRowButton.addEventListener('click', () => {
  const rows = readRows();
  rows.push({
    role_title: '',
    org: '',
    start_date: '',
    end_date: '',
    location: '',
    level: '',
    achievements: [],
    tools: []
  });
  renderRows(rows);
  saveDraft(rows);
});

const initialRows = loadInitialRows();
renderRows(initialRows);
setState('idle', 'State: idle');

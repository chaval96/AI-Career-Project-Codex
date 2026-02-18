const STORAGE_KEY = 'onboarding_upload_draft_v1';
const PARSE_RESULT_KEY = 'onboarding_parse_result_v1';

const root = document.querySelector('[data-upload-state]');
const form = document.querySelector('#upload-form');
const parseButton = document.querySelector('#btn-parse-now');
const saveLaterButton = document.querySelector('#btn-upload-save-later');
const statusNode = document.querySelector('#upload-status');
const errorList = document.querySelector('#upload-errors');
const resultPanel = document.querySelector('#parse-result');
const parseItems = document.querySelector('#parse-items');

const fields = {
  file: document.querySelector('#resume-file'),
  linkedinUrl: document.querySelector('#linkedin-url'),
  pastedHistory: document.querySelector('#pasted-history')
};

function setState(state, message) {
  root.dataset.uploadState = state;
  statusNode.textContent = message;

  if (state === 'uploading') {
    parseButton.textContent = 'Parsing...';
    parseButton.disabled = true;
    return;
  }

  if (state === 'error') {
    parseButton.textContent = 'Retry parse';
    parseButton.disabled = false;
    return;
  }

  parseButton.textContent = 'Parse now';
  parseButton.disabled = false;
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

function getPayloadSummary() {
  const file = fields.file.files[0] ?? null;
  return {
    file_name: file ? file.name : '',
    linkedin_url: fields.linkedinUrl.value.trim(),
    pasted_history: fields.pastedHistory.value.trim()
  };
}

function validateInput(summary) {
  const errors = [];
  const hasFile = Boolean(summary.file_name);
  const hasLinkedin = summary.linkedin_url.length > 0;
  const hasPasted = summary.pasted_history.length > 0;

  if (!hasFile && !hasLinkedin && !hasPasted) {
    errors.push('Provide at least one input method: file, LinkedIn URL, or pasted history.');
  }

  return errors;
}

function saveDraft(summary) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      linkedin_url: summary.linkedin_url,
      pasted_history: summary.pasted_history
    })
  );
}

function loadDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return false;
  }

  try {
    const payload = JSON.parse(raw);
    fields.linkedinUrl.value = payload.linkedin_url ?? '';
    fields.pastedHistory.value = payload.pasted_history ?? '';
    return true;
  } catch {
    return false;
  }
}

function saveParseResult(result) {
  localStorage.setItem(PARSE_RESULT_KEY, JSON.stringify(result));
}

function loadParseResult() {
  const raw = localStorage.getItem(PARSE_RESULT_KEY);
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

async function submitParse(summary) {
  const file = fields.file.files[0] ?? null;

  let response;
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    if (summary.linkedin_url) {
      formData.append('linkedin_url', summary.linkedin_url);
    }
    if (summary.pasted_history) {
      formData.append('pasted_history', summary.pasted_history);
    }

    response = await fetch('/v1/onboarding/upload', {
      method: 'POST',
      body: formData
    });
  } else {
    response = await fetch('/v1/onboarding/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary)
    });
  }

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

function renderParseResult(data) {
  resultPanel.hidden = false;
  const items = data.extracted_items ?? [];
  if (items.length === 0) {
    parseItems.innerHTML = '<li>No entries extracted yet.</li>';
    return;
  }

  parseItems.innerHTML = items
    .map((item) => `<li><strong>${item.role_title}</strong> at ${item.org} (${item.start_date})</li>`)
    .join('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const summary = getPayloadSummary();
  const errors = validateInput(summary);
  showErrors(errors);

  if (errors.length > 0) {
    setState('error', 'State: error - add at least one input method, then retry.');
    return;
  }

  saveDraft(summary);
  setState('uploading', 'State: uploading - parsing your experience...');

  try {
    const result = await submitParse(summary);
    saveParseResult(result);
    renderParseResult(result);
    setState('saved', 'State: saved - parse complete. Next step: /onboarding/confirm');
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
  }
});

saveLaterButton.addEventListener('click', () => {
  const summary = getPayloadSummary();
  saveDraft(summary);
  showErrors([]);
  setState('saved', 'State: saved - draft stored, resume later.');
});

const restored = loadDraft();
const parseResult = loadParseResult();
if (parseResult) {
  renderParseResult(parseResult);
}
setState(restored ? 'loaded' : 'idle', restored ? 'State: loaded - restored saved draft.' : 'State: idle');

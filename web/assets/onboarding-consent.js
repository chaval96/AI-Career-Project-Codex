const root = document.querySelector('[data-consent-state]');
const form = document.querySelector('#consent-form');
const profilingToggle = document.querySelector('#toggle-profiling');
const marketToggle = document.querySelector('#toggle-market');
const researchToggle = document.querySelector('#toggle-research');
const statusNode = document.querySelector('#consent-status');
const saveLaterButton = document.querySelector('#btn-save-later');

function setState(state, message) {
  root.dataset.consentState = state;
  statusNode.textContent = message;
}

async function loadState() {
  const response = await fetch('/v1/onboarding/state');
  if (!response.ok) {
    setState('error', 'State: error - unable to load saved consent.');
    return;
  }

  const payload = await response.json();
  if (payload?.consent) {
    profilingToggle.checked = Boolean(payload.consent.profiling_accepted);
    marketToggle.checked = Boolean(payload.consent.market_data_linking_accepted);
    researchToggle.checked = Boolean(payload.consent.research_opt_in);
    setState('loaded', 'State: loaded - existing consent values restored.');
    return;
  }

  setState('idle', 'State: idle');
}

async function saveConsent(mode) {
  setState('saving', 'State: saving - persisting consent...');

  const response = await fetch('/v1/onboarding/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profiling_accepted: profilingToggle.checked,
      market_data_linking_accepted: marketToggle.checked,
      research_opt_in: researchToggle.checked
    })
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error ?? message;
    } catch {
      // keep fallback
    }
    setState('error', `State: error - ${message}`);
    return;
  }

  const payload = await response.json();
  if (mode === 'continue') {
    setState('saved', `State: saved - consent version ${payload.consent_version}. Next step: /onboarding/goals`);
    return;
  }

  setState('saved', `State: saved - you can resume onboarding later. Version ${payload.consent_version}.`);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await saveConsent('continue');
});

saveLaterButton.addEventListener('click', async () => {
  await saveConsent('later');
});

loadState();

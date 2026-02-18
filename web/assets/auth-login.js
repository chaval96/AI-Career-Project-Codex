const root = document.querySelector('[data-auth-state]');
const form = document.querySelector('#magic-link-form');
const emailInput = document.querySelector('#email-input');
const submitButton = document.querySelector('#submit-button');
const statusNode = document.querySelector('#auth-status');

function setState(state, message) {
  root.dataset.authState = state;
  statusNode.textContent = message;

  if (state === 'idle') {
    submitButton.textContent = 'Send magic link';
    submitButton.disabled = false;
    return;
  }

  if (state === 'sending') {
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    return;
  }

  if (state === 'sent') {
    submitButton.textContent = 'Send another link';
    submitButton.disabled = false;
    return;
  }

  if (state === 'error') {
    submitButton.textContent = 'Retry';
    submitButton.disabled = false;
  }
}

async function submitMagicLink(email) {
  const response = await fetch('/v1/auth/magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error ?? message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) {
    setState('error', 'State: error - enter a valid email address and retry.');
    return;
  }

  setState('sending', 'State: sending - requesting magic link...');

  try {
    await submitMagicLink(email);
    setState('sent', 'State: sent - check your inbox for the login link.');
  } catch (error) {
    setState('error', `State: error - ${error.message}`);
  }
});

setState('idle', 'State: idle');

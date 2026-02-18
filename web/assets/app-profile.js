const root = document.querySelector('[data-profile-state]');
const freshnessNode = document.querySelector('#profile-freshness');
const profileMeterNode = document.querySelector('#profile-meter');
const profileMeterValueNode = document.querySelector('#profile-meter-value');
const evidenceMeterNode = document.querySelector('#evidence-meter');
const evidenceMeterValueNode = document.querySelector('#evidence-meter-value');
const timelineListNode = document.querySelector('#timeline-list');
const evidenceListNode = document.querySelector('#evidence-list');
const motivationSummaryNode = document.querySelector('#motivation-summary');
const evidenceForm = document.querySelector('#evidence-form');
const evidenceStatusNode = document.querySelector('#evidence-status');

function toPercent(value) {
  return Math.round((value ?? 0) * 100);
}

function setState(state) {
  root.dataset.profileState = state;
}

function parseMetadata(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed);
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

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

function renderTimeline(timeline) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    timelineListNode.innerHTML = '<li>No timeline entries yet.</li>';
    return;
  }

  timelineListNode.innerHTML = timeline
    .map(
      (item) =>
        `<li><strong>${item.role_title}</strong> at ${item.org} (${item.start_date}${item.end_date ? ` to ${item.end_date}` : ' to present'})</li>`
    )
    .join('');
}

function renderEvidence(items) {
  if (!Array.isArray(items) || items.length === 0) {
    evidenceListNode.innerHTML = '<li>No evidence added yet.</li>';
    return;
  }

  evidenceListNode.innerHTML = items
    .map(
      (item) =>
        `<li><strong>${item.skill_id}</strong> via ${item.source} | strength ${(item.evidence_strength * 100).toFixed(0)}%</li>`
    )
    .join('');
}

function renderProfile(profile) {
  profileMeterNode.style.width = `${toPercent(profile.profile_completion_pct)}%`;
  profileMeterValueNode.textContent = `${toPercent(profile.profile_completion_pct)}%`;
  evidenceMeterNode.style.width = `${toPercent(profile.evidence_completion_pct)}%`;
  evidenceMeterValueNode.textContent = `${toPercent(profile.evidence_completion_pct)}%`;
  freshnessNode.textContent = `Updated: ${new Date().toLocaleString()}`;

  renderTimeline(profile.timeline ?? []);
  renderEvidence(profile.evidence_items ?? []);

  const targetRole = profile.target_roles?.[0] ?? 'unknown';
  const confidence = toPercent(profile.confidence_meter?.value);
  motivationSummaryNode.textContent = `Target role cluster: ${targetRole} | confidence: ${confidence}%`;
}

async function refreshProfile() {
  const profile = await requestJson('/v1/profile');
  renderProfile(profile);
}

function setupTabs() {
  const tabs = [...document.querySelectorAll('.tab')];
  const panels = {
    timeline: document.querySelector('#tab-timeline'),
    skills: document.querySelector('#tab-skills'),
    motivation: document.querySelector('#tab-motivation'),
    artifacts: document.querySelector('#tab-artifacts')
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');

      Object.entries(panels).forEach(([key, panel]) => {
        const isActive = key === tab.dataset.tab;
        panel.hidden = !isActive;
        panel.classList.toggle('active', isActive);
      });
    });
  });
}

evidenceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  evidenceStatusNode.textContent = 'State: saving...';

  try {
    const payload = {
      source: document.querySelector('#evidence-source').value,
      skill_id: document.querySelector('#evidence-skill-id').value.trim(),
      evidence_strength: Number.parseFloat(document.querySelector('#evidence-strength').value),
      metadata: parseMetadata(document.querySelector('#evidence-metadata').value)
    };

    await requestJson('/v1/profile/evidence', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const evidenceResponse = await requestJson('/v1/profile/evidence');
    renderEvidence(evidenceResponse.items ?? []);
    await refreshProfile();
    evidenceStatusNode.textContent = 'State: saved';
  } catch (error) {
    evidenceStatusNode.textContent = `State: error - ${error.message}`;
  }
});

async function init() {
  setState('loading');
  setupTabs();
  try {
    await refreshProfile();
    setState('ready');
  } catch (error) {
    freshnessNode.textContent = `Error: ${error.message}`;
    setState('error');
  }
}

await init();

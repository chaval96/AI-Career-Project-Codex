const root = document.querySelector('[data-plan-state]');
const freshnessNode = document.querySelector('#plan-freshness');
const retryButton = document.querySelector('#plan-retry');
const streakDaysNode = document.querySelector('#streak-days');
const planProgressNode = document.querySelector('#plan-progress');
const planProgressValueNode = document.querySelector('#plan-progress-value');
const monthThemesNode = document.querySelector('#month-themes');
const missionsListNode = document.querySelector('#missions-list');
const missionDetailTitleNode = document.querySelector('#mission-detail-title');
const missionDetailTimeNode = document.querySelector('#mission-detail-time');
const missionDetailSkillsNode = document.querySelector('#mission-detail-skills');
const checkinModal = document.querySelector('#checkin-modal');
const openCheckinModalButton = document.querySelector('#open-checkin-modal');
const cancelCheckinModalButton = document.querySelector('#cancel-checkin-modal');
const checkinForm = document.querySelector('#plan-checkin-form');
const checkinStatusNode = document.querySelector('#checkin-status');
const driftAlertsNode = document.querySelector('#drift-alerts');
const nextMissionsNode = document.querySelector('#next-missions');

const state = { missions: [], selectedMissionId: null };

function setState(value) {
  root.dataset.planState = value;
}

function closeCheckinModal() {
  if (!checkinModal) {
    return;
  }
  if (typeof checkinModal.close === 'function') {
    checkinModal.close();
    return;
  }
  checkinModal.removeAttribute('open');
}

function openCheckinModal() {
  if (!checkinModal) {
    return;
  }
  if (typeof checkinModal.showModal === 'function') {
    checkinModal.showModal();
    return;
  }
  checkinModal.setAttribute('open', '');
}

function toPercent(value) {
  return Math.round(value ?? 0);
}

function parseCommaValues(raw) {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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

function renderMissionDetail(mission) {
  if (!mission) {
    missionDetailTitleNode.textContent = 'Select a mission';
    missionDetailTimeNode.textContent = '';
    missionDetailSkillsNode.textContent = '';
    return;
  }
  missionDetailTitleNode.textContent = mission.title;
  missionDetailTimeNode.textContent = `Expected time: ${mission.expected_time_min} minutes`;
  missionDetailSkillsNode.textContent = `Skill targets: ${(mission.skill_targets ?? []).join(', ') || 'n/a'}`;
}

function renderPlan(plan) {
  streakDaysNode.textContent = `${plan.streak_days ?? 0}`;
  const progress = toPercent(plan.progress_pct);
  planProgressNode.style.width = `${progress}%`;
  planProgressValueNode.textContent = `${progress}%`;
  freshnessNode.textContent = `Updated: ${new Date().toLocaleString()}`;

  const monthThemes = plan.month_themes ?? [];
  monthThemesNode.innerHTML = monthThemes.length
    ? monthThemes.map((theme) => `<li>${theme}</li>`).join('')
    : '<li>No month themes available yet.</li>';

  state.missions = plan.missions ?? [];
  if (!state.selectedMissionId && state.missions.length > 0) {
    state.selectedMissionId = state.missions[0].mission_id;
  }
  const selectedMission = state.missions.find((mission) => mission.mission_id === state.selectedMissionId) ?? null;
  renderMissionDetail(selectedMission);

  missionsListNode.innerHTML = state.missions.length
    ? state.missions
        .map((mission) => {
          const active = mission.mission_id === state.selectedMissionId ? 'active' : '';
          return `
            <button class="mini-card mission-card ${active}" data-mission-id="${mission.mission_id}" type="button">
              <h4>${mission.title}</h4>
              <p class="muted">${mission.expected_time_min} min</p>
            </button>
          `;
        })
        .join('')
    : '<article class="mini-card">No missions available yet.</article>';

  missionsListNode.querySelectorAll('[data-mission-id]').forEach((node) => {
    node.addEventListener('click', () => {
      state.selectedMissionId = node.dataset.missionId;
      const mission = state.missions.find((item) => item.mission_id === state.selectedMissionId) ?? null;
      renderMissionDetail(mission);
      renderPlan({ ...plan, missions: state.missions });
    });
  });
}

function renderCheckinResult(data) {
  const driftAlerts = data.drift_alerts ?? [];
  driftAlertsNode.innerHTML = driftAlerts.length
    ? driftAlerts.map((alert) => `<li>${alert}</li>`).join('')
    : '<li>No drift alerts yet.</li>';

  const nextMissions = data.next_missions ?? [];
  nextMissionsNode.innerHTML = nextMissions.length
    ? nextMissions.map((mission) => `<li>${mission.title}</li>`).join('')
    : '<li>No next missions yet.</li>';
}

async function refreshPlan() {
  const plan = await requestJson('/v1/plan');
  renderPlan(plan);
}

checkinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  checkinStatusNode.textContent = 'State: saving...';
  try {
    const blockers = parseCommaValues(document.querySelector('#checkin-blockers').value);
    const payload = {
      week_index: Number.parseInt(document.querySelector('#checkin-week-index').value, 10),
      time_spent_min: Number.parseInt(document.querySelector('#checkin-time-spent').value, 10),
      energy: Number.parseInt(document.querySelector('#checkin-energy').value, 10),
      completed_mission_ids: parseCommaValues(document.querySelector('#checkin-completed-missions').value),
      blockers,
      evidence_links: parseCommaValues(document.querySelector('#checkin-evidence-links').value)
    };
    if (!Number.isInteger(payload.week_index) || payload.week_index < 1) {
      throw new Error('Week index must be at least 1.');
    }
    if (!Number.isInteger(payload.time_spent_min) || payload.time_spent_min < 0) {
      throw new Error('Time spent must be 0 or greater.');
    }
    if (!Number.isInteger(payload.energy) || payload.energy < 1 || payload.energy > 10) {
      throw new Error('Energy must be between 1 and 10.');
    }
    if (blockers.length === 0) {
      throw new Error('Add at least one blocker.');
    }

    const result = await requestJson('/v1/execution/checkin', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    renderCheckinResult(result);
    await refreshPlan();
    checkinStatusNode.textContent = 'State: saved';
    closeCheckinModal();
  } catch (error) {
    checkinStatusNode.textContent = `State: error - ${error.message}`;
  }
});

openCheckinModalButton?.addEventListener('click', () => {
  openCheckinModal();
});

cancelCheckinModalButton?.addEventListener('click', () => {
  closeCheckinModal();
});

retryButton?.addEventListener('click', async () => {
  await init();
});

async function init() {
  setState('loading');
  if (retryButton) {
    retryButton.hidden = true;
  }
  try {
    await refreshPlan();
    setState('ready');
  } catch (error) {
    freshnessNode.textContent = `Error: ${error.message}`;
    setState('error');
    if (retryButton) {
      retryButton.hidden = false;
    }
  }
}

await init();

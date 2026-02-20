import assert from 'node:assert/strict';
import test from 'node:test';

import { createApp } from '../src/app.js';

async function withServer(run) {
  const { server } = createApp();

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function assertSpaShell(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  const html = await response.text();
  assert.equal(html.includes('id="root"'), true);
  const hasDevEntry = html.includes('/src/main.tsx');
  const hasBuiltEntry = /\/assets\/index-[^"]+\.js/.test(html);
  assert.equal(hasDevEntry || hasBuiltEntry, true);
}

test('auth and taxonomy routes work', async () => {
  await withServer(async (baseUrl) => {
    const healthResponse = await fetch(`${baseUrl}/health`);
    assert.equal(healthResponse.status, 200);
    const healthData = await healthResponse.json();
    assert.equal(healthData.store_backend, 'memory');
    assert.equal(healthData.db_ready, true);

    const authResponse = await fetch(`${baseUrl}/v1/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' })
    });

    assert.equal(authResponse.status, 202);

    const taxonomyResponse = await fetch(`${baseUrl}/v1/taxonomy/roles?q=software&limit=2`);
    assert.equal(taxonomyResponse.status, 200);

    const taxonomyData = await taxonomyResponse.json();
    assert.equal(Array.isArray(taxonomyData.roles), true);
    assert.equal(taxonomyData.roles.length > 0, true);
  });
});

test('web shell routes are served as SPA entry', async () => {
  await withServer(async (baseUrl) => {
    await assertSpaShell(baseUrl, '/');
    await assertSpaShell(baseUrl, '/landing');
    await assertSpaShell(baseUrl, '/auth/login');
    await assertSpaShell(baseUrl, '/onboarding/consent');
    await assertSpaShell(baseUrl, '/onboarding/goals');
    await assertSpaShell(baseUrl, '/onboarding/upload');
    await assertSpaShell(baseUrl, '/onboarding/confirm');
    await assertSpaShell(baseUrl, '/onboarding/quick-preferences');
    await assertSpaShell(baseUrl, '/onboarding/first-test');
    await assertSpaShell(baseUrl, '/app/dashboard');
    await assertSpaShell(baseUrl, '/app/profile');
    await assertSpaShell(baseUrl, '/app/assessments');
    await assertSpaShell(baseUrl, '/app/blueprint');
    await assertSpaShell(baseUrl, '/app/plan');
    await assertSpaShell(baseUrl, '/app/settings');

    const headIndexResponse = await fetch(`${baseUrl}/`, { method: 'HEAD' });
    assert.equal(headIndexResponse.status, 200);
    assert.equal(headIndexResponse.headers.get('content-type'), 'text/html; charset=utf-8');
  });
});

test('landing and login routes satisfy T-1001 flow requirements', async () => {
  await withServer(async (baseUrl) => {
    await assertSpaShell(baseUrl, '/landing');
    await assertSpaShell(baseUrl, '/auth/login');
  });
});

test('consent route and API satisfy T-1002 requirements', async () => {
  await withServer(async (baseUrl) => {
    await assertSpaShell(baseUrl, '/onboarding/consent');

    const rejectResponse = await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: false,
        market_data_linking_accepted: true,
        research_opt_in: false
      })
    });
    assert.equal(rejectResponse.status, 400);

    const saveResponse = await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: true,
        research_opt_in: false
      })
    });
    assert.equal(saveResponse.status, 200);
    const savePayload = await saveResponse.json();
    assert.equal(savePayload.saved, true);
    assert.equal(savePayload.consent_version, '1.0');
    assert.equal(typeof savePayload.saved_at, 'string');

    const onboardingStateResponse = await fetch(`${baseUrl}/v1/onboarding/state`);
    assert.equal(onboardingStateResponse.status, 200);
    const onboardingState = await onboardingStateResponse.json();
    assert.equal(onboardingState.consent.profiling_accepted, true);
    assert.equal(onboardingState.consent.market_data_linking_accepted, true);
    assert.equal(onboardingState.consent.research_opt_in, false);
    assert.equal(onboardingState.next_step, 'goals');

    const saveOptionalUpdateResponse = await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: false,
        research_opt_in: true
      })
    });
    assert.equal(saveOptionalUpdateResponse.status, 200);

    const updatedStateResponse = await fetch(`${baseUrl}/v1/onboarding/state`);
    const updatedState = await updatedStateResponse.json();
    assert.equal(updatedState.consent.market_data_linking_accepted, false);
    assert.equal(updatedState.consent.research_opt_in, true);
  });
});

test('goals route and API satisfy T-1003 requirements', async () => {
  await withServer(async (baseUrl) => {
    const blockedWithoutConsentResponse = await fetch(`${baseUrl}/v1/onboarding/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: 'switch_role',
        time_horizon_months: 12,
        time_per_week_hours: 8,
        location: 'US-NYC',
        relocation_ok: true,
        remote_only: false
      })
    });
    assert.equal(blockedWithoutConsentResponse.status, 400);

    await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: false,
        research_opt_in: false
      })
    });

    await assertSpaShell(baseUrl, '/onboarding/goals');

    const invalidGoalsResponse = await fetch(`${baseUrl}/v1/onboarding/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: 'promotion',
        time_horizon_months: 6
      })
    });
    assert.equal(invalidGoalsResponse.status, 400);
    const invalidPayload = await invalidGoalsResponse.json();
    assert.equal(invalidPayload.error.includes('Goals validation failed'), true);

    const validGoalsResponse = await fetch(`${baseUrl}/v1/onboarding/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: 'switch_role',
        time_horizon_months: 12,
        time_per_week_hours: 8,
        salary_floor: 130000,
        location: 'US-NYC',
        relocation_ok: true,
        remote_only: false
      })
    });
    assert.equal(validGoalsResponse.status, 200);
    const validPayload = await validGoalsResponse.json();
    assert.equal(validPayload.saved, true);
    assert.equal(validPayload.profile_completion_pct >= 0.4, true);

    const onboardingStateResponse = await fetch(`${baseUrl}/v1/onboarding/state`);
    const onboardingState = await onboardingStateResponse.json();
    assert.equal(onboardingState.completed_steps.includes('goals'), true);
    assert.equal(onboardingState.next_step, 'upload');
  });
});

test('upload route and API satisfy T-1004 requirements', async () => {
  await withServer(async (baseUrl) => {
    const blockedWithoutStepsResponse = await fetch(`${baseUrl}/v1/onboarding/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pasted_history: 'Software Engineer at Example Org' })
    });
    assert.equal(blockedWithoutStepsResponse.status, 400);

    await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: false,
        research_opt_in: false
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: 'switch_role',
        time_horizon_months: 12,
        time_per_week_hours: 8,
        location: 'US-NYC',
        relocation_ok: true,
        remote_only: false
      })
    });

    await assertSpaShell(baseUrl, '/onboarding/upload');

    const invalidUploadResponse = await fetch(`${baseUrl}/v1/onboarding/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(invalidUploadResponse.status, 400);
    const invalidPayload = await invalidUploadResponse.json();
    assert.equal(
      invalidPayload.error.includes('Provide at least one input method'),
      true
    );

    const validUploadResponse = await fetch(`${baseUrl}/v1/onboarding/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pasted_history: 'Software Engineer at Example Org (2022-present)'
      })
    });
    assert.equal(validUploadResponse.status, 200);
    const validUploadPayload = await validUploadResponse.json();
    assert.equal(Array.isArray(validUploadPayload.extracted_items), true);
    assert.equal(validUploadPayload.extracted_items.length > 0, true);

    const multipartBody = new FormData();
    multipartBody.append(
      'pasted_history',
      'Orbit Labs | Product Analyst | Jan 2022 - Present | Increased conversion by 12%'
    );
    const multipartUploadResponse = await fetch(`${baseUrl}/v1/onboarding/upload`, {
      method: 'POST',
      body: multipartBody
    });
    assert.equal(multipartUploadResponse.status, 200);
    const multipartPayload = await multipartUploadResponse.json();
    assert.equal(Array.isArray(multipartPayload.extracted_items), true);
    assert.equal(multipartPayload.extracted_items[0].org, 'Orbit Labs');

    const onboardingStateResponse = await fetch(`${baseUrl}/v1/onboarding/state`);
    const onboardingState = await onboardingStateResponse.json();
    assert.equal(onboardingState.completed_steps.includes('upload'), true);
    assert.equal(onboardingState.next_step, 'confirm');
    assert.equal(onboardingState.profile_completion_pct >= 0.55, true);
  });
});

test('confirm route and API satisfy T-1005 requirements', async () => {
  await withServer(async (baseUrl) => {
    const blockedWithoutStepsResponse = await fetch(`${baseUrl}/v1/onboarding/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_items: [
          {
            org: 'Example Org',
            role_title: 'Software Engineer',
            start_date: '2023-01-01'
          }
        ]
      })
    });
    assert.equal(blockedWithoutStepsResponse.status, 400);

    await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: false,
        research_opt_in: false
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: 'switch_role',
        time_horizon_months: 12,
        time_per_week_hours: 8,
        location: 'US-NYC',
        relocation_ok: true,
        remote_only: false
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pasted_history: 'Software Engineer at Example Org (2022-present)'
      })
    });

    await assertSpaShell(baseUrl, '/onboarding/confirm');

    const invalidConfirmResponse = await fetch(`${baseUrl}/v1/onboarding/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_items: []
      })
    });
    assert.equal(invalidConfirmResponse.status, 400);
    const invalidPayload = await invalidConfirmResponse.json();
    assert.equal(
      invalidPayload.error.includes('resume_items must be a non-empty array'),
      true
    );

    const validConfirmResponse = await fetch(`${baseUrl}/v1/onboarding/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_items: [
          {
            org: 'Example Org',
            role_title: 'Software Engineer',
            start_date: '2023-01-01',
            end_date: null
          }
        ]
      })
    });
    assert.equal(validConfirmResponse.status, 200);
    const validConfirmPayload = await validConfirmResponse.json();
    assert.equal(validConfirmPayload.saved_count, 1);

    const onboardingStateResponse = await fetch(`${baseUrl}/v1/onboarding/state`);
    const onboardingState = await onboardingStateResponse.json();
    assert.equal(onboardingState.completed_steps.includes('confirm'), true);
    assert.equal(onboardingState.next_step, 'quick-preferences');
    assert.equal(onboardingState.profile_completion_pct >= 0.7, true);
  });
});

test('quick preferences route and API satisfy T-1006 requirements', async () => {
  await withServer(async (baseUrl) => {
    const blockedWithoutStepsResponse = await fetch(`${baseUrl}/v1/onboarding/quick-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autonomy_vs_structure: 60,
        stability_vs_growth: 70,
        income_vs_impact: 55,
        team_vs_solo: 45,
        hands_on_vs_strategic: 65
      })
    });
    assert.equal(blockedWithoutStepsResponse.status, 400);

    await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: false,
        research_opt_in: false
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: 'switch_role',
        time_horizon_months: 12,
        time_per_week_hours: 8,
        location: 'US-NYC',
        relocation_ok: true,
        remote_only: false
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pasted_history: 'Software Engineer at Example Org (2022-present)'
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_items: [
          {
            org: 'Example Org',
            role_title: 'Software Engineer',
            start_date: '2023-01-01',
            end_date: null
          }
        ]
      })
    });

    await assertSpaShell(baseUrl, '/onboarding/quick-preferences');

    const invalidResponse = await fetch(`${baseUrl}/v1/onboarding/quick-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autonomy_vs_structure: 120,
        stability_vs_growth: 70,
        income_vs_impact: 55,
        team_vs_solo: 45,
        hands_on_vs_strategic: 65
      })
    });
    assert.equal(invalidResponse.status, 400);
    const invalidPayload = await invalidResponse.json();
    assert.equal(
      invalidPayload.error.includes('Quick preferences validation failed'),
      true
    );

    const validResponse = await fetch(`${baseUrl}/v1/onboarding/quick-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autonomy_vs_structure: 60,
        stability_vs_growth: 70,
        income_vs_impact: 55,
        team_vs_solo: 45,
        hands_on_vs_strategic: 65
      })
    });
    assert.equal(validResponse.status, 200);
    const validPayload = await validResponse.json();
    assert.equal(validPayload.saved, true);
    assert.equal(validPayload.profile_completion_pct >= 0.85, true);

    const onboardingStateResponse = await fetch(`${baseUrl}/v1/onboarding/state`);
    const onboardingState = await onboardingStateResponse.json();
    assert.equal(onboardingState.completed_steps.includes('quick-preferences'), true);
    assert.equal(onboardingState.next_step, 'first-test');
  });
});

test('first test route and API satisfy T-1007 requirements', async () => {
  await withServer(async (baseUrl) => {
    const blockedWithoutStepsResponse = await fetch(`${baseUrl}/v1/onboarding/first-test/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(blockedWithoutStepsResponse.status, 400);

    await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: false,
        research_opt_in: false
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: 'promotion',
        time_horizon_months: 12,
        time_per_week_hours: 8,
        location: 'US-NYC',
        relocation_ok: true,
        remote_only: false
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pasted_history: 'Software Engineer at Example Org (2022-present)'
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_items: [
          {
            org: 'Example Org',
            role_title: 'Software Engineer',
            start_date: '2023-01-01',
            end_date: null
          }
        ]
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/quick-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autonomy_vs_structure: 60,
        stability_vs_growth: 70,
        income_vs_impact: 55,
        team_vs_solo: 45,
        hands_on_vs_strategic: 75
      })
    });

    await assertSpaShell(baseUrl, '/onboarding/first-test');

    const startResponse = await fetch(`${baseUrl}/v1/onboarding/first-test/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(startResponse.status, 200);
    const startPayload = await startResponse.json();
    assert.equal(typeof startPayload.attempt_id, 'string');
    assert.equal(typeof startPayload.manifest.suggested_role_family, 'string');
    assert.equal(Array.isArray(startPayload.manifest.prompts), true);
    assert.equal(startPayload.manifest.prompts.length >= 3, true);

    const eventResponse = await fetch(`${baseUrl}/v1/assessments/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: startPayload.attempt_id,
        events: [{ t: 10, name: 'answer', data: { selected: 'B' } }]
      })
    });
    assert.equal(eventResponse.status, 204);

    const completeResponse = await fetch(`${baseUrl}/v1/onboarding/first-test/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: startPayload.attempt_id
      })
    });
    assert.equal(completeResponse.status, 200);
    const completePayload = await completeResponse.json();
    assert.equal(typeof completePayload.assessment_result.scores.overall, 'number');
    assert.equal(typeof completePayload.assessment_result.reliability, 'number');
    assert.equal(Array.isArray(completePayload.starter_blueprint.top_role_clusters), true);
    assert.equal(Array.isArray(completePayload.starter_blueprint.mini_plan), true);
    assert.equal(completePayload.starter_blueprint.mini_plan.length >= 3, true);

    const onboardingStateResponse = await fetch(`${baseUrl}/v1/onboarding/state`);
    const onboardingState = await onboardingStateResponse.json();
    assert.equal(onboardingState.completed_steps.includes('first-test'), true);
    assert.equal(onboardingState.next_step, 'app-dashboard');
    assert.equal(onboardingState.profile_completion_pct >= 1, true);
    assert.equal(onboardingState.evidence_completion_pct >= 0.2, true);
    assert.equal(typeof onboardingState.first_test_suggestion.role_family, 'string');
  });
});

test('dashboard route and API satisfy T-3001 baseline requirements', async () => {
  await withServer(async (baseUrl) => {
    await assertSpaShell(baseUrl, '/app/dashboard');

    const initialDashboardResponse = await fetch(`${baseUrl}/v1/dashboard`);
    assert.equal(initialDashboardResponse.status, 200);
    const initialDashboard = await initialDashboardResponse.json();
    assert.equal(initialDashboard.next_best_action.action, 'continue_setup');
    assert.equal(initialDashboard.next_best_action.route, '/onboarding/consent');
    assert.equal(initialDashboard.profile_completion_pct, 0);

    await fetch(`${baseUrl}/v1/onboarding/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: false,
        research_opt_in: false
      })
    });
    await fetch(`${baseUrl}/v1/onboarding/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_type: 'switch_role',
        time_horizon_months: 12,
        time_per_week_hours: 8,
        location: 'US-NYC',
        relocation_ok: true,
        remote_only: false
      })
    });
    await fetch(`${baseUrl}/v1/onboarding/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pasted_history: 'Software Engineer at Example Org (2022-present)' })
    });
    await fetch(`${baseUrl}/v1/onboarding/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_items: [
          {
            org: 'Example Org',
            role_title: 'Software Engineer',
            start_date: '2023-01-01'
          }
        ]
      })
    });
    await fetch(`${baseUrl}/v1/onboarding/quick-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autonomy_vs_structure: 60,
        stability_vs_growth: 70,
        income_vs_impact: 55,
        team_vs_solo: 45,
        hands_on_vs_strategic: 65
      })
    });

    const startFirstTestResponse = await fetch(`${baseUrl}/v1/onboarding/first-test/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(startFirstTestResponse.status, 200);
    const firstTestSession = await startFirstTestResponse.json();

    await fetch(`${baseUrl}/v1/assessments/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: firstTestSession.attempt_id,
        events: [{ t: 10, name: 'answer', data: { selected: 'A' } }]
      })
    });

    await fetch(`${baseUrl}/v1/onboarding/first-test/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempt_id: firstTestSession.attempt_id })
    });

    const afterFirstTestDashboardResponse = await fetch(`${baseUrl}/v1/dashboard`);
    assert.equal(afterFirstTestDashboardResponse.status, 200);
    const afterFirstTestDashboard = await afterFirstTestDashboardResponse.json();
    assert.equal(afterFirstTestDashboard.next_best_action.action, 'weekly_checkin');
    assert.equal(afterFirstTestDashboard.cis_summary.cis_mean > 0, true);
    assert.equal(afterFirstTestDashboard.confidence_meter.value > 0, true);

    await fetch(`${baseUrl}/v1/execution/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_index: 1,
        time_spent_min: 80,
        energy: 4,
        blockers: ['Context switching']
      })
    });

    const afterCheckinDashboardResponse = await fetch(`${baseUrl}/v1/dashboard`);
    assert.equal(afterCheckinDashboardResponse.status, 200);
    const afterCheckinDashboard = await afterCheckinDashboardResponse.json();
    assert.equal(afterCheckinDashboard.next_best_action.action, 'take_next_test');
    assert.equal(Array.isArray(afterCheckinDashboard.drift_alerts), true);
    assert.equal(afterCheckinDashboard.drift_alerts.length >= 1, true);
  });
});

test('profile route and APIs satisfy T-3002 baseline requirements', async () => {
  await withServer(async (baseUrl) => {
    await assertSpaShell(baseUrl, '/app/profile');

    const profileResponse = await fetch(`${baseUrl}/v1/profile`);
    assert.equal(profileResponse.status, 200);
    const profileData = await profileResponse.json();
    assert.equal(typeof profileData.profile_completion_pct, 'number');
    assert.equal(typeof profileData.evidence_completion_pct, 'number');
    assert.equal(typeof profileData.confidence_meter.value, 'number');
    assert.equal(Array.isArray(profileData.timeline), true);

    const emptyEvidenceResponse = await fetch(`${baseUrl}/v1/profile/evidence`);
    assert.equal(emptyEvidenceResponse.status, 200);
    const emptyEvidenceData = await emptyEvidenceResponse.json();
    assert.equal(Array.isArray(emptyEvidenceData.items), true);
    assert.equal(emptyEvidenceData.items.length, 0);

    const invalidEvidenceResponse = await fetch(`${baseUrl}/v1/profile/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'portfolio',
        skill_id: 'problem_solving',
        evidence_strength: 1.4
      })
    });
    assert.equal(invalidEvidenceResponse.status, 400);

    const createEvidenceResponse = await fetch(`${baseUrl}/v1/profile/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'portfolio',
        skill_id: 'problem_solving',
        evidence_strength: 0.8,
        metadata: { link: 'https://example.com/project' }
      })
    });
    assert.equal(createEvidenceResponse.status, 201);
    const createdEvidence = await createEvidenceResponse.json();
    assert.equal(createdEvidence.source, 'portfolio');
    assert.equal(createdEvidence.skill_id, 'problem_solving');
    assert.equal(createdEvidence.evidence_strength, 0.8);

    const evidenceResponse = await fetch(`${baseUrl}/v1/profile/evidence`);
    assert.equal(evidenceResponse.status, 200);
    const evidenceData = await evidenceResponse.json();
    assert.equal(evidenceData.items.length, 1);

    const filteredEvidenceResponse = await fetch(`${baseUrl}/v1/profile/evidence?skill_id=problem_solving`);
    assert.equal(filteredEvidenceResponse.status, 200);
    const filteredEvidenceData = await filteredEvidenceResponse.json();
    assert.equal(filteredEvidenceData.items.length, 1);
  });
});

test('plan route and APIs satisfy T-3003 baseline requirements', async () => {
  await withServer(async (baseUrl) => {
    await assertSpaShell(baseUrl, '/app/plan');

    const initialPlanResponse = await fetch(`${baseUrl}/v1/plan`);
    assert.equal(initialPlanResponse.status, 200);
    const initialPlan = await initialPlanResponse.json();
    assert.equal(Array.isArray(initialPlan.month_themes), true);
    assert.equal(Array.isArray(initialPlan.missions), true);
    assert.equal(typeof initialPlan.streak_days, 'number');
    assert.equal(typeof initialPlan.progress_pct, 'number');

    const completedMissionId = initialPlan.missions[0]?.mission_id ?? null;
    const checkinResponse = await fetch(`${baseUrl}/v1/execution/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_index: 1,
        time_spent_min: 150,
        energy: 6,
        blockers: ['Unexpected dependency delay'],
        completed_mission_ids: completedMissionId ? [completedMissionId] : []
      })
    });
    assert.equal(checkinResponse.status, 200);
    const checkinData = await checkinResponse.json();
    assert.equal(Array.isArray(checkinData.drift_alerts), true);
    assert.equal(Array.isArray(checkinData.next_missions), true);

    const updatedPlanResponse = await fetch(`${baseUrl}/v1/plan`);
    assert.equal(updatedPlanResponse.status, 200);
    const updatedPlan = await updatedPlanResponse.json();
    assert.equal(updatedPlan.streak_days >= 7, true);
    if (completedMissionId) {
      assert.equal(updatedPlan.progress_pct > 0, true);
    }

    const invalidCheckinResponse = await fetch(`${baseUrl}/v1/execution/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_index: 2,
        time_spent_min: 100,
        energy: 11,
        blockers: ['Blocked']
      })
    });
    assert.equal(invalidCheckinResponse.status, 400);
  });
});

test('assessments page route satisfies T-4001 baseline UI requirements', async () => {
  await withServer(async (baseUrl) => {
    await assertSpaShell(baseUrl, '/app/assessments');
  });
});

test('profile ingestion parse and confirm work', async () => {
  await withServer(async (baseUrl) => {
    const parseResponse = await fetch(`${baseUrl}/v1/profile/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'en-US' })
    });
    assert.equal(parseResponse.status, 200);
    const parseData = await parseResponse.json();
    assert.equal(Array.isArray(parseData.extracted_items), true);
    assert.equal(parseData.extracted_items.length > 0, true);

    const confirmResponse = await fetch(`${baseUrl}/v1/profile/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_items: [
          {
            org: 'Example Org',
            role_title: 'Software Engineer',
            start_date: '2023-01-01',
            end_date: null
          }
        ]
      })
    });
    assert.equal(confirmResponse.status, 200);
    const confirmData = await confirmResponse.json();
    assert.equal(confirmData.saved_count, 1);
  });
});

test('assessment lifecycle works', async () => {
  await withServer(async (baseUrl) => {
    const startResponse = await fetch(`${baseUrl}/v1/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessment_type: 'micro_test',
        role_family: 'software_engineering'
      })
    });

    assert.equal(startResponse.status, 200);
    const session = await startResponse.json();

    const eventsResponse = await fetch(`${baseUrl}/v1/assessments/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: session.attempt_id,
        events: [
          { t: 20, name: 'answer', data: { selected: 'A' } },
          { t: 40, name: 'answer', data: { selected: 'C' } }
        ]
      })
    });

    assert.equal(eventsResponse.status, 204);

    const completeResponse = await fetch(`${baseUrl}/v1/assessments/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempt_id: session.attempt_id })
    });

    assert.equal(completeResponse.status, 200);
    const result = await completeResponse.json();
    assert.equal(result.attempt_id, session.attempt_id);
    assert.equal(typeof result.scores.overall, 'number');
    assert.equal(result.reliability >= 0, true);
    assert.equal(result.reliability <= 1, true);
  });
});

test('assessment catalog and status endpoints satisfy contract', async () => {
  await withServer(async (baseUrl) => {
    const initialCatalogResponse = await fetch(`${baseUrl}/v1/assessments/catalog`);
    assert.equal(initialCatalogResponse.status, 200);
    const initialCatalog = await initialCatalogResponse.json();
    assert.equal(Array.isArray(initialCatalog.items), true);
    assert.equal(initialCatalog.items.length >= 3, true);
    const initialMicro = initialCatalog.items.find((item) => item.type === 'micro_test');
    assert.equal(initialMicro.status, 'not_started');

    const startResponse = await fetch(`${baseUrl}/v1/assessments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessment_type: 'micro_test',
        role_family: 'software_engineering'
      })
    });
    assert.equal(startResponse.status, 200);
    const startPayload = await startResponse.json();

    const inProgressCatalogResponse = await fetch(`${baseUrl}/v1/assessments/catalog`);
    const inProgressCatalog = await inProgressCatalogResponse.json();
    const inProgressMicro = inProgressCatalog.items.find((item) => item.type === 'micro_test');
    assert.equal(inProgressMicro.status, 'in_progress');
    assert.equal(inProgressMicro.reliability, null);

    const attemptStatusResponse = await fetch(`${baseUrl}/v1/assessments/${startPayload.attempt_id}`);
    assert.equal(attemptStatusResponse.status, 200);
    const attemptStatus = await attemptStatusResponse.json();
    assert.equal(attemptStatus.status, 'started');
    assert.equal(attemptStatus.completed_at, null);

    const invalidEventsResponse = await fetch(`${baseUrl}/v1/assessments/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: startPayload.attempt_id,
        events: [
          { t: 30, name: 'answer', data: { selected: 'A' } },
          { t: 20, name: 'answer', data: { selected: 'B' } }
        ]
      })
    });
    assert.equal(invalidEventsResponse.status, 400);

    const validEventsResponse = await fetch(`${baseUrl}/v1/assessments/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: startPayload.attempt_id,
        events: [
          { t: 20, name: 'answer', data: { selected: 'A' } },
          { t: 40, name: 'answer', data: { selected: 'B' } }
        ]
      })
    });
    assert.equal(validEventsResponse.status, 204);

    const completeResponse = await fetch(`${baseUrl}/v1/assessments/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempt_id: startPayload.attempt_id })
    });
    assert.equal(completeResponse.status, 200);
    const completePayload = await completeResponse.json();
    assert.equal(typeof completePayload.reliability, 'number');

    const completedStatusResponse = await fetch(`${baseUrl}/v1/assessments/${startPayload.attempt_id}`);
    assert.equal(completedStatusResponse.status, 200);
    const completedStatus = await completedStatusResponse.json();
    assert.equal(completedStatus.status, 'completed');
    assert.equal(completedStatus.completed_at !== null, true);
    assert.equal(typeof completedStatus.result.reliability, 'number');

    const completedCatalogResponse = await fetch(`${baseUrl}/v1/assessments/catalog`);
    const completedCatalog = await completedCatalogResponse.json();
    const completedMicro = completedCatalog.items.find((item) => item.type === 'micro_test');
    assert.equal(completedMicro.status, 'completed');
    assert.equal(typeof completedMicro.reliability, 'number');
  });
});

test('blueprint and export flow works', async () => {
  await withServer(async (baseUrl) => {
    await assertSpaShell(baseUrl, '/app/blueprint');

    const generateResponse = await fetch(`${baseUrl}/v1/blueprint/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        region: 'US-NYC',
        target_roles: ['15-1252.00'],
        scenarios: ['safe', 'aggressive'],
        constraints: { time_per_week_hours: 6 }
      })
    });

    assert.equal(generateResponse.status, 202);
    const generateData = await generateResponse.json();

    const blueprintResponse = await fetch(`${baseUrl}/v1/blueprint/${generateData.blueprint_id}`);
    assert.equal(blueprintResponse.status, 200);

    const blueprintData = await blueprintResponse.json();
    assert.equal(blueprintData.blueprint_id, generateData.blueprint_id);
    assert.equal(Array.isArray(blueprintData.scenarios), true);
    assert.equal(Array.isArray(blueprintData.drivers), true);
    assert.equal(Array.isArray(blueprintData.risks), true);

    const currentBlueprintResponse = await fetch(`${baseUrl}/v1/blueprint/current`);
    assert.equal(currentBlueprintResponse.status, 200);
    const currentBlueprint = await currentBlueprintResponse.json();
    assert.equal(currentBlueprint.blueprint_id, generateData.blueprint_id);
    assert.equal(Array.isArray(currentBlueprint.next_three_actions), true);

    const shareResponse = await fetch(`${baseUrl}/v1/blueprint/${generateData.blueprint_id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expires_in_hours: 48 })
    });
    assert.equal(shareResponse.status, 201);
    const sharePayload = await shareResponse.json();
    assert.equal(typeof sharePayload.url, 'string');
    assert.equal(sharePayload.url.includes(generateData.blueprint_id), true);
    assert.equal(typeof sharePayload.expires_at, 'string');

    const pdfResponse = await fetch(`${baseUrl}/v1/blueprint/${generateData.blueprint_id}/pdf`);
    assert.equal(pdfResponse.status, 200);
    assert.equal(pdfResponse.headers.get('content-type'), 'application/pdf');

    const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
    const signature = Buffer.from(pdfBytes.slice(0, 4)).toString('utf8');
    assert.equal(signature, '%PDF');
  });
});

test('settings endpoints and compatibility aliases satisfy API sanity', async () => {
  await withServer(async (baseUrl) => {
    const initialSettingsResponse = await fetch(`${baseUrl}/v1/settings`);
    assert.equal(initialSettingsResponse.status, 200);
    const initialSettings = await initialSettingsResponse.json();
    assert.equal(typeof initialSettings.consent_flags.profiling_accepted, 'boolean');
    assert.equal(typeof initialSettings.notification_prefs.weekly_checkin_reminders, 'boolean');

    const consentViaAliasResponse = await fetch(`${baseUrl}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: true,
        research_opt_in: false
      })
    });
    assert.equal(consentViaAliasResponse.status, 200);

    const patchSettingsResponse = await fetch(`${baseUrl}/v1/settings/consents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiling_accepted: true,
        market_data_linking_accepted: false,
        research_opt_in: true
      })
    });
    assert.equal(patchSettingsResponse.status, 200);
    const patchedSettings = await patchSettingsResponse.json();
    assert.equal(patchedSettings.consent_flags.market_data_linking_accepted, false);
    assert.equal(patchedSettings.consent_flags.research_opt_in, true);

    const exportResponse = await fetch(`${baseUrl}/v1/settings/export`, {
      method: 'POST'
    });
    assert.equal(exportResponse.status, 202);
    const exportPayload = await exportResponse.json();
    assert.equal(typeof exportPayload.request_id, 'string');
    assert.equal(exportPayload.status, 'queued');

    const deleteResponse = await fetch(`${baseUrl}/v1/settings/delete-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Testing flow' })
    });
    assert.equal(deleteResponse.status, 202);
    const deletePayload = await deleteResponse.json();
    assert.equal(typeof deletePayload.request_id, 'string');
    assert.equal(deletePayload.status, 'queued');
    assert.equal(deletePayload.grace_period_days, 30);

    const meResponse = await fetch(`${baseUrl}/me`);
    assert.equal(meResponse.status, 200);
    const mePayload = await meResponse.json();
    assert.equal(typeof mePayload.onboarding.next_step, 'string');
    assert.equal(typeof mePayload.model_summary.confidence_meter.value, 'number');
  });
});

test('weekly checkin returns missions and drift alerts', async () => {
  await withServer(async (baseUrl) => {
    const checkinResponse = await fetch(`${baseUrl}/v1/execution/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week_index: 3,
        time_spent_min: 80,
        energy: 3,
        blockers: ['No uninterrupted deep-work time']
      })
    });

    assert.equal(checkinResponse.status, 200);
    const data = await checkinResponse.json();

    assert.equal(Array.isArray(data.drift_alerts), true);
    assert.equal(data.drift_alerts.length >= 1, true);
    assert.equal(Array.isArray(data.next_missions), true);
    assert.equal(data.next_missions.length >= 1, true);
  });
});

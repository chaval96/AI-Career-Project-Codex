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

test('auth and taxonomy routes work', async () => {
  await withServer(async (baseUrl) => {
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

test('blueprint and export flow works', async () => {
  await withServer(async (baseUrl) => {
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

    const pdfResponse = await fetch(`${baseUrl}/v1/blueprint/${generateData.blueprint_id}/pdf`);
    assert.equal(pdfResponse.status, 200);
    assert.equal(pdfResponse.headers.get('content-type'), 'application/pdf');

    const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
    const signature = Buffer.from(pdfBytes.slice(0, 4)).toString('utf8');
    assert.equal(signature, '%PDF');
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

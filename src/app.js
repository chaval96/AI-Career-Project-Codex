import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildBlueprint } from './blueprint.js';
import { createMinimalPdf } from './pdf.js';
import { createMemoryStore } from './store.js';

const ASSESSMENT_TYPES = new Set(['micro_test', 'simulation', 'game', 'survey']);
const ALLOWED_SCENARIOS = new Set(['safe', 'aggressive', 'pivot']);

const ROLE_CATALOG = [
  { id: '15-1252.00', name: 'Software Developers', taxonomy: 'ONET', version: '29.1' },
  { id: '15-1254.00', name: 'Web Developers', taxonomy: 'ONET', version: '29.1' },
  { id: '2512.1', name: 'Software developers', taxonomy: 'ESCO', version: '1.2.0' },
  { id: 'data_scientist', name: 'Data Scientist', taxonomy: 'ESCO', version: '1.2.0' }
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..', 'web');
const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sendJson(res, statusCode, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data)
  });
  res.end(data);
}

function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

function sendBinary(res, statusCode, payload, contentType) {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': payload.length
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function parseJsonBody(req, allowEmpty = false) {
  const raw = await readBody(req);
  if (raw.length === 0) {
    if (allowEmpty) {
      return {};
    }
    throw httpError(400, 'Request body is required.');
  }

  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw httpError(400, 'Invalid JSON body.');
  }
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateResumeItem(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }
  return (
    typeof item.org === 'string' &&
    item.org.length > 0 &&
    typeof item.role_title === 'string' &&
    item.role_title.length > 0 &&
    isIsoDate(item.start_date)
  );
}

function scoreAttempt(events) {
  const eventCount = events.length;
  const overall = Math.min(1, 0.35 + eventCount * 0.03);

  return {
    overall: Number(overall.toFixed(2)),
    subscores: {
      reasoning: Number(Math.min(1, overall * 0.95).toFixed(2)),
      debugging: Number(Math.min(1, overall * 1.02).toFixed(2)),
      communication: Number(Math.max(0.2, overall * 0.88).toFixed(2))
    }
  };
}

async function selectMissionsForCheckin(store) {
  const latestBlueprint = await store.getLatestBlueprint();

  if (latestBlueprint?.execution_plan?.missions?.length) {
    return latestBlueprint.execution_plan.missions.slice(0, 3);
  }

  return [
    {
      mission_id: randomUUID(),
      title: 'Complete one micro-test for your target role',
      expected_time_min: 60,
      skill_targets: ['problem_solving']
    },
    {
      mission_id: randomUUID(),
      title: 'Draft one role-tailored portfolio update',
      expected_time_min: 90,
      skill_targets: ['domain_depth']
    }
  ];
}

async function serveStaticFile(pathname, res) {
  const target = pathname === '/' ? '/index.html' : pathname;
  if (target !== '/index.html' && !target.startsWith('/assets/')) {
    return false;
  }

  const decodedPath = decodeURIComponent(target);
  const absolutePath = path.resolve(WEB_ROOT, `.${decodedPath}`);
  if (!absolutePath.startsWith(WEB_ROOT + path.sep) && absolutePath !== path.join(WEB_ROOT, 'index.html')) {
    return false;
  }

  try {
    const extension = path.extname(absolutePath);
    const contentType = STATIC_MIME[extension] ?? 'application/octet-stream';
    const payload = await readFile(absolutePath);
    sendBinary(res, 200, payload, contentType);
    return true;
  } catch {
    return false;
  }
}

export function createApp(options = {}) {
  const store = options.store ?? createMemoryStore();
  const now = options.now ?? (() => new Date().toISOString());

  const server = http.createServer(async (req, res) => {
    const method = req.method ?? 'GET';
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = url.pathname;

    try {
      if (method === 'GET' && pathname === '/health') {
        const dbReady = typeof store.ping === 'function' ? await store.ping() : true;
        sendJson(res, 200, {
          status: 'ok',
          service: 'career-intel-os-api',
          store_backend: store.backend ?? 'memory',
          db_ready: dbReady
        });
        return;
      }

      if (method === 'POST' && pathname === '/v1/auth/magic-link') {
        const body = await parseJsonBody(req);
        if (typeof body.email !== 'string' || !body.email.includes('@')) {
          throw httpError(400, 'Valid email is required.');
        }

        sendJson(res, 202, { status: 'accepted' });
        return;
      }

      if (method === 'POST' && pathname === '/v1/profile/resume') {
        const contentType = (req.headers['content-type'] ?? '').toLowerCase();

        if (contentType.includes('application/json')) {
          await parseJsonBody(req, true);
        } else {
          const raw = await readBody(req);
          if (raw.length === 0) {
            throw httpError(400, 'Resume payload is required.');
          }
        }

        sendJson(res, 200, {
          extracted_items: [
            {
              org: 'Example Org',
              role_title: 'Software Engineer',
              start_date: '2022-01-01',
              end_date: null,
              industry: 'Technology',
              achievements: 'Delivered product features with measurable impact',
              tools: ['Node.js', 'PostgreSQL'],
              self_claimed_skills: ['API Design', 'Testing'],
              canonical_role_id: '15-1252.00',
              mapping_confidence: 0.82
            }
          ],
          mapping_notes: ['Initial extraction uses deterministic parser heuristics in scaffold mode.']
        });
        return;
      }

      if (method === 'POST' && pathname === '/v1/profile/confirm') {
        const body = await parseJsonBody(req);

        if (!Array.isArray(body.resume_items) || body.resume_items.length === 0) {
          throw httpError(400, 'resume_items must be a non-empty array.');
        }

        for (const item of body.resume_items) {
          if (!validateResumeItem(item)) {
            throw httpError(400, 'Each resume item must contain org, role_title, and start_date.');
          }
        }

        const savedCount = await store.saveResumeItems(body.resume_items);
        sendJson(res, 200, { saved_count: savedCount });
        return;
      }

      if (method === 'GET' && pathname === '/v1/taxonomy/roles') {
        const query = url.searchParams.get('q');
        if (!query) {
          throw httpError(400, 'Query parameter q is required.');
        }

        const limitRaw = url.searchParams.get('limit');
        const limit = Math.min(100, Math.max(1, Number(limitRaw ?? 20) || 20));

        const roles = ROLE_CATALOG
          .map((role) => {
            const index = role.name.toLowerCase().indexOf(query.toLowerCase());
            if (index === -1) {
              return null;
            }

            const score = Number((1 / (1 + index)).toFixed(2));
            return { ...role, score };
          })
          .filter(Boolean)
          .slice(0, limit);

        sendJson(res, 200, { roles });
        return;
      }

      if (method === 'POST' && pathname === '/v1/assessments/start') {
        const body = await parseJsonBody(req);
        if (!ASSESSMENT_TYPES.has(body.assessment_type)) {
          throw httpError(400, 'assessment_type must be one of micro_test, simulation, game, survey.');
        }

        const attemptId = randomUUID();
        const assessmentId = randomUUID();

        await store.createAttempt({
          attempt_id: attemptId,
          assessment_id: assessmentId,
          type: body.assessment_type,
          role_family: body.role_family ?? null,
          version: body.version ?? '0.1.0',
          created_at: now(),
          events: [],
          completed_at: null,
          result: null
        });

        sendJson(res, 200, {
          attempt_id: attemptId,
          assessment_id: assessmentId,
          manifest: {
            assessment_type: body.assessment_type,
            expected_duration_min: 5,
            prompts: ['Describe your decision strategy in one sentence.']
          }
        });
        return;
      }

      if (method === 'POST' && pathname === '/v1/assessments/events') {
        const body = await parseJsonBody(req);

        if (typeof body.attempt_id !== 'string') {
          throw httpError(400, 'attempt_id is required.');
        }
        if (!Array.isArray(body.events)) {
          throw httpError(400, 'events must be an array.');
        }

        for (const event of body.events) {
          if (typeof event !== 'object' || typeof event.name !== 'string' || typeof event.t !== 'number') {
            throw httpError(400, 'Each event must include numeric t and string name.');
          }
        }

        const updatedAttempt = await store.appendAttemptEvents(body.attempt_id, body.events);
        if (!updatedAttempt) {
          throw httpError(404, 'Assessment attempt not found.');
        }

        sendNoContent(res);
        return;
      }

      if (method === 'POST' && pathname === '/v1/assessments/complete') {
        const body = await parseJsonBody(req);

        if (typeof body.attempt_id !== 'string') {
          throw httpError(400, 'attempt_id is required.');
        }

        const attempt = await store.getAttempt(body.attempt_id);
        if (!attempt) {
          throw httpError(404, 'Assessment attempt not found.');
        }

        const scores = scoreAttempt(attempt.events);
        const reliability = Number(Math.min(1, 0.6 + attempt.events.length * 0.02).toFixed(2));
        const result = {
          attempt_id: attempt.attempt_id,
          scores,
          reliability,
          evidence_items_created: Math.max(1, Math.round(scores.overall * 4))
        };

        await store.completeAttempt(attempt.attempt_id, result, now());
        sendJson(res, 200, result);
        return;
      }

      if (method === 'POST' && pathname === '/v1/blueprint/generate') {
        const body = await parseJsonBody(req);

        if (typeof body.region !== 'string' || body.region.length === 0) {
          throw httpError(400, 'region is required.');
        }
        if (!Array.isArray(body.scenarios) || body.scenarios.length === 0) {
          throw httpError(400, 'scenarios must be a non-empty array.');
        }
        if (body.scenarios.some((scenario) => !ALLOWED_SCENARIOS.has(scenario))) {
          throw httpError(400, 'scenarios can only include safe, aggressive, pivot.');
        }

        const blueprintId = randomUUID();
        const blueprint = buildBlueprint(blueprintId, body, now());
        await store.saveBlueprint(blueprint);

        sendJson(res, 202, { blueprint_id: blueprintId, status: 'queued' });
        return;
      }

      const blueprintPdfMatch = pathname.match(/^\/v1\/blueprint\/([0-9a-fA-F-]{36})\/pdf$/);
      if (method === 'GET' && blueprintPdfMatch) {
        const blueprintId = blueprintPdfMatch[1];
        const blueprint = await store.getBlueprint(blueprintId);
        if (!blueprint) {
          throw httpError(404, 'Blueprint not found.');
        }

        const pdf = createMinimalPdf(`Career Intelligence OS Blueprint ${blueprintId}`);
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="blueprint-${blueprintId}.pdf"`,
          'Content-Length': pdf.length
        });
        res.end(pdf);
        return;
      }

      const blueprintMatch = pathname.match(/^\/v1\/blueprint\/([0-9a-fA-F-]{36})$/);
      if (method === 'GET' && blueprintMatch) {
        const blueprintId = blueprintMatch[1];
        const blueprint = await store.getBlueprint(blueprintId);
        if (!blueprint) {
          throw httpError(404, 'Blueprint not found.');
        }

        sendJson(res, 200, blueprint);
        return;
      }

      if (method === 'POST' && pathname === '/v1/execution/checkin') {
        const body = await parseJsonBody(req);

        if (!Number.isInteger(body.week_index) || body.week_index < 1) {
          throw httpError(400, 'week_index must be an integer >= 1.');
        }

        const driftAlerts = [];
        if (typeof body.time_spent_min === 'number' && body.time_spent_min < 120) {
          driftAlerts.push('Low weekly effort detected; mission scope reduced for next week.');
        }
        if (typeof body.energy === 'number' && body.energy <= 3) {
          driftAlerts.push('Low energy trend detected; add one recovery day before intensive tasks.');
        }
        if (Array.isArray(body.blockers) && body.blockers.length > 0) {
          driftAlerts.push('Active blockers present; prioritize unblock mission before skill expansion.');
        }

        const nextMissions = await selectMissionsForCheckin(store);
        await store.addCheckin({ ...body, created_at: now(), drift_alerts: driftAlerts });

        sendJson(res, 200, {
          drift_alerts: driftAlerts,
          next_missions: nextMissions
        });
        return;
      }

      if (method === 'GET') {
        const wasServed = await serveStaticFile(pathname, res);
        if (wasServed) {
          return;
        }
      }

      throw httpError(404, 'Route not found.');
    } catch (error) {
      const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
      const message = statusCode === 500 ? 'Internal server error.' : error.message;
      sendJson(res, statusCode, { error: message });
    }
  });

  return { server, store };
}

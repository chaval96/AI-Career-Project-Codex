import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAssessmentResultFromAttempt } from './assessment_scoring.js';
import { buildBlueprint } from './blueprint.js';
import { createMinimalPdf } from './pdf.js';
import { createMemoryStore } from './store.js';
import { enrichResumeWithTaxonomy } from './taxonomy-adapter.js';

const ASSESSMENT_TYPES = new Set(['micro_test', 'simulation', 'game', 'survey']);
const ALLOWED_SCENARIOS = new Set(['safe', 'aggressive', 'pivot']);
const GOAL_TYPES = new Set(['promotion', 'switch_role', 'switch_industry', 'freelancing', 'relocate']);
const GOAL_HORIZONS = new Set([3, 6, 12]);
const EVIDENCE_SOURCES = new Set(['assessment', 'portfolio', 'cert', 'self_report']);
const QUICK_PREFERENCE_FIELDS = [
  'autonomy_vs_structure',
  'stability_vs_growth',
  'income_vs_impact',
  'team_vs_solo',
  'hands_on_vs_strategic'
];

const ROLE_CATALOG = [
  { id: '15-1252.00', name: 'Software Developers', taxonomy: 'ONET', version: '29.1' },
  { id: '15-1254.00', name: 'Web Developers', taxonomy: 'ONET', version: '29.1' },
  { id: '2512.1', name: 'Software developers', taxonomy: 'ESCO', version: '1.2.0' },
  { id: 'data_scientist', name: 'Data Scientist', taxonomy: 'ESCO', version: '1.2.0' }
];
const ASSESSMENT_CATALOG_TEMPLATES = [
  {
    assessment_id: '00000000-0000-0000-0000-000000000101',
    type: 'micro_test',
    title: 'Core Problem Solving Micro-Test',
    duration_min: 6,
    why_we_ask: 'Measures baseline reasoning and task-structuring reliability.'
  },
  {
    assessment_id: '00000000-0000-0000-0000-000000000102',
    type: 'simulation',
    title: 'Decision Simulation',
    duration_min: 7,
    why_we_ask: 'Captures decision quality under uncertainty and trade-off pressure.'
  },
  {
    assessment_id: '00000000-0000-0000-0000-000000000103',
    type: 'survey',
    title: 'Motivation Snapshot',
    duration_min: 4,
    why_we_ask: 'Calibrates motivational fit and sustainability assumptions.'
  }
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_SOURCE_ROOT = path.resolve(__dirname, '..', 'web');
const WEB_DIST_ROOT = path.resolve(WEB_SOURCE_ROOT, 'dist');
const WEB_ROOT = existsSync(WEB_DIST_ROOT) ? WEB_DIST_ROOT : WEB_SOURCE_ROOT;
const STATIC_ROUTE_MAP = {
  '/': '/index.html',
  '/landing': '/index.html',
  '/auth/login': '/index.html',
  '/auth/login/': '/index.html',
  '/onboarding/consent': '/index.html',
  '/onboarding/goals': '/index.html',
  '/onboarding/upload': '/index.html',
  '/onboarding/confirm': '/index.html',
  '/onboarding/quick-preferences': '/index.html',
  '/onboarding/first-test': '/index.html',
  '/app/dashboard': '/index.html',
  '/app/dashboard/': '/index.html',
  '/app/blueprint': '/index.html',
  '/app/blueprint/': '/index.html',
  '/app/profile': '/index.html',
  '/app/profile/': '/index.html',
  '/app/assessments': '/index.html',
  '/app/assessments/': '/index.html',
  '/app/plan': '/index.html',
  '/app/plan/': '/index.html',
  '/app/settings': '/index.html',
  '/app/settings/': '/index.html',
  '/admin': '/index.html'
};
const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.json': 'application/json; charset=utf-8'
};
const ROUTE_ALIASES = {
  '/consent': '/v1/onboarding/consent',
  '/goals': '/v1/onboarding/goals',
  '/resume/parse': '/v1/onboarding/upload',
  '/resume/confirm': '/v1/onboarding/confirm',
  '/preferences': '/v1/onboarding/quick-preferences',
  '/assessments/start': '/v1/assessments/start',
  '/assessments/complete': '/v1/assessments/complete',
  '/blueprint/generate': '/v1/blueprint/generate',
  '/checkins/weekly': '/v1/execution/checkin',
  '/me': '/v1/me'
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

function sendBinary(res, statusCode, payload, contentType, headOnly = false) {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': payload.length
  });
  if (headOnly) {
    res.end();
    return;
  }

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

function validateGoalsPayload(body) {
  const errors = [];

  if (!GOAL_TYPES.has(body.goal_type)) {
    errors.push('goal_type must be one of: promotion, switch_role, switch_industry, freelancing, relocate.');
  }

  if (!GOAL_HORIZONS.has(body.time_horizon_months)) {
    errors.push('time_horizon_months must be one of: 3, 6, 12.');
  }

  if (typeof body.time_per_week_hours !== 'number' || body.time_per_week_hours <= 0) {
    errors.push('time_per_week_hours must be a positive number.');
  }

  if (typeof body.location !== 'string' || body.location.trim().length === 0) {
    errors.push('location is required.');
  }

  if (typeof body.relocation_ok !== 'boolean') {
    errors.push('relocation_ok must be a boolean.');
  }

  if (typeof body.remote_only !== 'boolean') {
    errors.push('remote_only must be a boolean.');
  }

  if (
    body.salary_floor !== undefined &&
    body.salary_floor !== null &&
    (typeof body.salary_floor !== 'number' || body.salary_floor < 0)
  ) {
    errors.push('salary_floor must be a number >= 0 when provided.');
  }

  return errors;
}

function validateQuickPreferencesPayload(body) {
  const errors = [];

  for (const field of QUICK_PREFERENCE_FIELDS) {
    if (!Number.isInteger(body[field]) || body[field] < 0 || body[field] > 100) {
      errors.push(`${field} must be an integer between 0 and 100.`);
    }
  }

  return errors;
}

function hasNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.every((item) => hasNonEmptyString(item));
}

function normalizeOptionalUrl(value) {
  if (!hasNonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function parseMultipartBody(rawBody, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    return { fields: {}, files: [] };
  }

  const boundary = boundaryMatch[1] ?? boundaryMatch[2];
  const separator = `--${boundary}`;
  const chunks = rawBody.toString('latin1').split(separator).slice(1, -1);
  const fields = {};
  const files = [];

  for (const rawChunk of chunks) {
    const chunk = rawChunk.replace(/^\r?\n/, '').replace(/\r?\n$/, '');
    if (!chunk || chunk === '--') {
      continue;
    }

    let headerSplitIndex = chunk.indexOf('\r\n\r\n');
    let separatorLength = 4;
    if (headerSplitIndex < 0) {
      headerSplitIndex = chunk.indexOf('\n\n');
      separatorLength = 2;
    }
    if (headerSplitIndex < 0) {
      continue;
    }

    const rawHeaders = chunk.slice(0, headerSplitIndex);
    const rawValue = chunk.slice(headerSplitIndex + separatorLength).replace(/\r?\n$/, '');
    const headerMap = {};
    for (const line of rawHeaders.split(/\r?\n/)) {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex <= 0) {
        continue;
      }
      const name = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      headerMap[name] = value;
    }

    const disposition = headerMap['content-disposition'];
    if (!disposition) {
      continue;
    }
    const fieldNameMatch = disposition.match(/name="([^"]+)"/i);
    if (!fieldNameMatch) {
      continue;
    }
    const fieldName = fieldNameMatch[1];
    const fileNameMatch = disposition.match(/filename="([^"]*)"/i);

    if (fileNameMatch && fileNameMatch[1]) {
      const mimeType = headerMap['content-type'] ?? 'application/octet-stream';
      const bytePayload = Buffer.from(rawValue, 'latin1');
      files.push({
        field_name: fieldName,
        file_name: fileNameMatch[1],
        mime_type: mimeType,
        size_bytes: bytePayload.length,
        text_content: mimeType.startsWith('text/') ? bytePayload.toString('utf8') : ''
      });
      continue;
    }

    fields[fieldName] = Buffer.from(rawValue, 'latin1').toString('utf8').trim();
  }

  return { fields, files };
}

function monthNumber(name) {
  const key = name.toLowerCase().slice(0, 3);
  const map = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12'
  };
  return map[key] ?? null;
}

function parseDateToken(token) {
  if (!hasNonEmptyString(token)) {
    return null;
  }
  const clean = token.trim().replace(/\./g, '');

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  const yearMonth = clean.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yearMonth) {
    const year = yearMonth[1];
    const month = String(Number(yearMonth[2])).padStart(2, '0');
    return `${year}-${month}-01`;
  }

  const monthYear = clean.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (monthYear) {
    const month = monthNumber(monthYear[1]);
    if (!month) {
      return null;
    }
    return `${monthYear[2]}-${month}-01`;
  }

  if (/^\d{4}$/.test(clean)) {
    return `${clean}-01-01`;
  }

  return null;
}

function parseDateRange(value) {
  if (!hasNonEmptyString(value)) {
    return { start_date: null, end_date: null };
  }
  const compact = value
    .replace(/[–—]/g, '-')
    .replace(/\bto\b/gi, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const [startRaw, endRaw] = compact.split(/\s*-\s*/, 2);
  const start = parseDateToken(startRaw);
  if (!endRaw) {
    return { start_date: start, end_date: null };
  }
  if (/present|current|now/i.test(endRaw)) {
    return { start_date: start, end_date: null };
  }

  return { start_date: start, end_date: parseDateToken(endRaw) };
}

function parseDelimitedValues(value) {
  if (!hasNonEmptyString(value)) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectSkillSignals(sourceText) {
  const text = sourceText.toLowerCase();
  const signalCatalog = [
    { pattern: /\bjavascript|typescript|node|react|frontend|backend\b/, tool: 'JavaScript', skill: 'Web Development' },
    { pattern: /\bpython|pandas|numpy|ml|machine learning|data\b/, tool: 'Python', skill: 'Data Analysis' },
    { pattern: /\bsql|postgres|mysql|database\b/, tool: 'SQL', skill: 'Data Modeling' },
    { pattern: /\baws|gcp|azure|cloud\b/, tool: 'Cloud', skill: 'Cloud Architecture' },
    { pattern: /\bexcel|sheets|tableau|power bi\b/, tool: 'Analytics Tools', skill: 'Business Analytics' },
    { pattern: /\bfigma|ux|ui|design\b/, tool: 'Figma', skill: 'UX Design' },
    { pattern: /\bgit|github|testing|ci\/cd|deployment\b/, tool: 'Git', skill: 'Delivery Quality' },
    { pattern: /\bsales|crm|account|pipeline\b/, tool: 'CRM', skill: 'Client Management' }
  ];

  const tools = [];
  const skills = [];
  for (const signal of signalCatalog) {
    if (signal.pattern.test(text)) {
      tools.push(signal.tool);
      skills.push(signal.skill);
    }
  }

  return {
    tools: [...new Set(tools)].slice(0, 5),
    skills: [...new Set(skills)].slice(0, 6)
  };
}

function parseHistoryLine(line, fallbackLocation) {
  const pipeParts = line.split('|').map((item) => item.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    const [org, role_title, dates = '', ...achievementParts] = pipeParts;
    const range = parseDateRange(dates);
    const achievement = achievementParts.join(' | ').trim();
    const skillSignals = detectSkillSignals([line, achievement].filter(Boolean).join(' '));
    return {
      org,
      role_title,
      start_date: range.start_date ?? '2023-01-01',
      end_date: range.end_date,
      location: fallbackLocation ?? '',
      level: '',
      achievements: achievement ? [achievement] : [],
      tools: skillSignals.tools,
      self_claimed_skills: skillSignals.skills
    };
  }

  const atPattern = line.match(/^(.+?)\s+at\s+(.+?)\s*\(([^)]+)\)\s*(.*)$/i);
  if (atPattern) {
    const [, role, org, dates, tail] = atPattern;
    const range = parseDateRange(dates);
    const achievement = tail.trim();
    const skillSignals = detectSkillSignals([line, achievement].filter(Boolean).join(' '));
    return {
      org: org.trim(),
      role_title: role.trim(),
      start_date: range.start_date ?? '2023-01-01',
      end_date: range.end_date,
      location: fallbackLocation ?? '',
      level: '',
      achievements: achievement ? [achievement] : [],
      tools: skillSignals.tools,
      self_claimed_skills: skillSignals.skills
    };
  }

  return null;
}

function inferGoalRole(goalType) {
  const map = {
    promotion: 'Current role contributor',
    switch_role: 'Transition candidate',
    switch_industry: 'Cross-industry candidate',
    freelancing: 'Freelance operator',
    relocate: 'Relocation candidate'
  };
  return map[goalType] ?? 'Career candidate';
}

function buildFallbackResumeItem({ fileName, linkedinUrl, goals }) {
  const now = new Date();
  const startYear = String(Math.max(now.getUTCFullYear() - 2, 2018));
  const profileSlug = linkedinUrl?.match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1];
  const profileName = profileSlug
    ? profileSlug
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : null;

  const evidenceSource = [fileName, linkedinUrl].filter(Boolean).join(' ');
  const signals = detectSkillSignals(evidenceSource);

  return {
    org: profileName ? `${profileName} profile` : 'Uploaded resume',
    role_title: inferGoalRole(goals?.goal_type),
    start_date: `${startYear}-01-01`,
    end_date: null,
    location: goals?.location ?? 'US',
    industry: null,
    level: null,
    achievements: ['Added baseline profile details during onboarding'],
    tools: signals.tools,
    self_claimed_skills: signals.skills
  };
}

function buildResumeParseResult({ fileName, linkedinUrl, pastedHistory, goals } = {}) {
  const notes = [];
  const items = [];
  const fallbackLocation = goals?.location ?? 'US';

  if (hasNonEmptyString(pastedHistory)) {
    const lines = pastedHistory
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (line.startsWith('-') && items.length > 0) {
        items[items.length - 1].achievements.push(line.slice(1).trim());
        continue;
      }

      const parsed = parseHistoryLine(line, fallbackLocation);
      if (parsed) {
        items.push(parsed);
      }
    }

    if (items.length > 0) {
      notes.push(`Parsed ${items.length} timeline row(s) from pasted history.`);
    } else {
      notes.push('Could not fully structure pasted history. Added a fallback row to edit manually.');
    }
  }

  if (items.length === 0 && hasNonEmptyString(linkedinUrl)) {
    notes.push('LinkedIn URL detected. Added baseline profile row.');
  }

  if (items.length === 0) {
    items.push(buildFallbackResumeItem({ fileName, linkedinUrl, goals }));
  }

  if (hasNonEmptyString(fileName)) {
    notes.push(`File attached: ${fileName}.`);
  }

  const enriched = enrichResumeWithTaxonomy(
    items.map((item) => ({
      ...item,
      achievements: Array.isArray(item.achievements) ? item.achievements.slice(0, 5) : [],
      tools: Array.isArray(item.tools) ? item.tools.slice(0, 5) : [],
      self_claimed_skills: Array.isArray(item.self_claimed_skills) ? item.self_claimed_skills.slice(0, 8) : []
    }))
  );

  notes.push('Review each row before confirmation. Your edits become source of truth.');

  return {
    extracted_items: enriched,
    mapping_notes: notes
  };
}

function deriveFirstTestRecommendation(goals, quickPreferences) {
  const goalType = goals?.goal_type ?? 'switch_role';
  let roleFamily = 'software_engineering';
  let rationale = 'Suggested from your stated goal and current transition target.';

  if (goalType === 'promotion') {
    roleFamily = 'career_advancement';
    rationale = 'Promotion goal detected, so calibration starts with advancement-focused scenarios.';
  } else if (goalType === 'switch_industry') {
    roleFamily = 'cross_industry_transition';
    rationale = 'Industry switch goal detected, so calibration focuses on transferability signals.';
  } else if (goalType === 'freelancing') {
    roleFamily = 'freelance_operator';
    rationale = 'Freelancing goal detected, so calibration emphasizes independent decision patterns.';
  } else if (goalType === 'relocate') {
    roleFamily = 'location_transition';
    rationale = 'Relocation goal detected, so calibration emphasizes market and adaptability fit.';
  }

  if (
    goalType === 'promotion' &&
    quickPreferences &&
    Number.isInteger(quickPreferences.hands_on_vs_strategic) &&
    quickPreferences.hands_on_vs_strategic >= 70
  ) {
    roleFamily = 'engineering_management';
    rationale = 'Strategic preference and promotion goal indicate a management-track calibration.';
  }

  return { role_family: roleFamily, rationale };
}

function getClusterFallbacks(roleFamily) {
  const defaults = ['software_engineering', 'data_analytics', 'product_strategy'];
  const byRole = {
    engineering_management: ['engineering_management', 'product_strategy', 'program_management'],
    career_advancement: ['career_advancement', 'software_engineering', 'technical_leadership'],
    cross_industry_transition: ['cross_industry_transition', 'business_analytics', 'product_operations'],
    freelance_operator: ['freelance_operator', 'growth_marketing', 'product_consulting'],
    location_transition: ['location_transition', 'software_engineering', 'data_analytics']
  };
  return byRole[roleFamily] ?? [roleFamily, ...defaults.filter((item) => item !== roleFamily)].slice(0, 3);
}

function buildStarterBlueprintPreview(recommendation, assessmentResult) {
  const cisMean = Math.max(35, Math.min(90, Math.round(42 + assessmentResult.scores.overall * 40)));
  const clusters = getClusterFallbacks(recommendation.role_family);

  return {
    top_role_clusters: clusters,
    cis: {
      cis_mean: cisMean,
      cis_p50: cisMean,
      cis_p90: Math.min(100, cisMean + 12)
    },
    missing_measurements: [
      'Second micro-test for higher reliability',
      'Role simulation for applied decision quality',
      'Motivation deep map for long-horizon sustainability'
    ],
    mini_plan: [
      {
        mission_id: randomUUID(),
        title: 'Complete one additional micro-test in your target cluster',
        expected_time_min: 45,
        skill_targets: ['problem_solving', 'decision_quality']
      },
      {
        mission_id: randomUUID(),
        title: 'Draft one measurable project artifact for target role evidence',
        expected_time_min: 90,
        skill_targets: ['execution', 'communication']
      },
      {
        mission_id: randomUUID(),
        title: 'Run weekly check-in and capture blocker patterns',
        expected_time_min: 20,
        skill_targets: ['self_management']
      },
      {
        mission_id: randomUUID(),
        title: 'Review market delta for your top role cluster',
        expected_time_min: 30,
        skill_targets: ['market_awareness']
      }
    ]
  };
}

function buildFirstTestManifest(recommendation) {
  return {
    assessment_type: 'micro_test',
    expected_duration_min: 5,
    suggested_role_family: recommendation.role_family,
    suggestion_rationale: recommendation.rationale,
    prompts: [
      'Prioritize three actions for a high-risk delivery week.',
      'Choose one trade-off and explain your decision criteria.',
      'Describe one recovery plan if your first approach fails.'
    ]
  };
}

function mapAttemptStatus(attempt) {
  return {
    attempt_id: attempt.attempt_id,
    assessment_id: attempt.assessment_id,
    status: attempt.completed_at ? 'completed' : 'started',
    started_at: attempt.created_at,
    completed_at: attempt.completed_at ?? null,
    result: attempt.result ?? null
  };
}

function mapOnboardingStepToRoute(step) {
  const routeByStep = {
    consent: '/onboarding/consent',
    goals: '/onboarding/goals',
    upload: '/onboarding/upload',
    confirm: '/onboarding/confirm',
    'quick-preferences': '/onboarding/quick-preferences',
    'first-test': '/onboarding/first-test',
    'app-dashboard': '/app/dashboard'
  };
  return routeByStep[step] ?? '/landing';
}

function buildDashboardPayload(onboardingState, latestBlueprint, latestCheckin, nowIso) {
  const firstTest = onboardingState?.first_test ?? null;
  const firstTestResult = firstTest?.result ?? null;
  const firstTestStarter = firstTest?.starter_blueprint ?? null;

  const cisSummary = latestBlueprint?.identity_model?.cis ?? firstTestStarter?.cis ?? {
    cis_mean: 0,
    cis_p50: 0,
    cis_p90: 0,
    drivers: ['Complete onboarding and first-test calibration to generate CIS.'],
    risks: ['Model confidence is low until measured evidence is captured.']
  };

  const confidenceValue = Number(
    (latestBlueprint?.identity_model?.cis?.cis_mean
      ? Math.min(1, latestBlueprint.identity_model.cis.cis_mean / 100)
      : firstTestResult?.reliability ?? Math.max(0.1, onboardingState.profile_completion_pct * 0.55)
    ).toFixed(2)
  );

  const confidenceMeter = {
    value: confidenceValue,
    rationale: [
      onboardingState.completed_steps.includes('first-test')
        ? 'Measured evidence from first test is included.'
        : 'No measured first-test evidence yet.',
      onboardingState.completed_steps.includes('quick-preferences')
        ? 'Preference snapshot improves recommendation context.'
        : 'Preference snapshot missing; confidence is reduced.'
    ]
  };

  const evidenceCoverage = latestBlueprint?.identity_model?.evidence_coverage ?? {
    measured_skills_pct: onboardingState.evidence_completion_pct ?? 0,
    inferred_skills_pct: onboardingState.completed_steps.includes('confirm') ? 0.35 : 0.1,
    behavioral_pct: onboardingState.completed_steps.includes('first-test') ? 0.2 : 0,
    motivation_pct: onboardingState.completed_steps.includes('quick-preferences') ? 0.2 : 0
  };

  let nextBestAction = {
    action: 'continue_setup',
    label: 'Continue onboarding',
    route: mapOnboardingStepToRoute(onboardingState.next_step)
  };

  if (onboardingState.next_step === 'app-dashboard') {
    if (!latestCheckin) {
      nextBestAction = {
        action: 'weekly_checkin',
        label: 'Do weekly check-in',
        route: '/app/dashboard#weekly-checkin'
      };
    } else {
      nextBestAction = {
        action: 'take_next_test',
        label: 'Take next test',
        route: '/app/dashboard#next-test'
      };
    }
  }

  const marketSnapshot = {
    top_opportunities: firstTestStarter?.top_role_clusters ?? ['software_engineering', 'data_analytics'],
    roi_skill: firstTestResult?.scores?.subscores?.reasoning >= 0.6 ? 'systems_design' : 'problem_solving',
    updated_at: nowIso
  };

  return {
    generated_at: nowIso,
    profile_completion_pct: onboardingState.profile_completion_pct,
    evidence_completion_pct: onboardingState.evidence_completion_pct,
    cis_summary: cisSummary,
    confidence_meter: confidenceMeter,
    evidence_coverage: evidenceCoverage,
    next_best_action: nextBestAction,
    drift_alerts: latestCheckin?.drift_alerts ?? [],
    market_snapshot: marketSnapshot
  };
}

function buildProfilePayload(onboardingState, resumeItems, evidenceItems) {
  const firstTest = onboardingState?.first_test ?? null;
  const targetRoles = firstTest?.starter_blueprint?.top_role_clusters
    ?? (onboardingState?.goals?.goal_type ? [onboardingState.goals.goal_type] : []);
  const location = onboardingState?.goals?.location ?? null;
  const confidenceValue = Number(
    (
      firstTest?.result?.reliability
      ?? Math.max(0.1, (onboardingState?.profile_completion_pct ?? 0) * 0.55)
    ).toFixed(2)
  );

  return {
    user_id: '00000000-0000-0000-0000-000000000001',
    location,
    target_roles: targetRoles,
    profile_completion_pct: onboardingState?.profile_completion_pct ?? 0,
    evidence_completion_pct: onboardingState?.evidence_completion_pct ?? 0,
    confidence_meter: {
      value: confidenceValue,
      rationale: [
        onboardingState?.completed_steps?.includes('confirm')
          ? 'Timeline confirmation is included in profile modeling.'
          : 'Timeline confirmation is still pending.',
        evidenceItems.length > 0
          ? 'Manual or assessment evidence exists for skill signals.'
          : 'No additional evidence uploaded yet.'
      ]
    },
    timeline: resumeItems,
    evidence_items: evidenceItems
  };
}

function normalizeBlueprintForView(blueprint) {
  if (!blueprint) {
    return null;
  }

  const cis = blueprint.identity_model?.cis ?? { cis_mean: 0, cis_p50: 0, cis_p90: 0 };
  const evidenceCoverage = blueprint.identity_model?.evidence_coverage ?? {
    measured_skills_pct: 0,
    inferred_skills_pct: 0,
    behavioral_pct: 0,
    motivation_pct: 0
  };
  const drivers = blueprint.drivers ?? cis.drivers ?? [];
  const risks = blueprint.risks ?? cis.risks ?? [];
  const nextThreeActions = blueprint.next_three_actions
    ?? blueprint.execution_plan?.missions?.slice(0, 3)
    ?? [];

  return {
    ...blueprint,
    drivers,
    risks,
    next_three_actions: nextThreeActions,
    identity_model: {
      cis,
      evidence_coverage: evidenceCoverage
    }
  };
}

function buildPlanPayload(latestBlueprint, checkins, missions) {
  const monthThemes = latestBlueprint?.scenarios?.slice(0, 3).map((scenario) => {
    const name = scenario.name?.charAt(0)?.toUpperCase() + scenario.name?.slice(1);
    return `${name} track focus`;
  }) ?? ['Calibration and foundation', 'Skill proof and portfolio', 'Transition execution'];

  const checkinsSorted = [...checkins].sort((a, b) => (b.week_index ?? 0) - (a.week_index ?? 0));
  let streakWeeks = 0;
  let expectedWeek = checkinsSorted[0]?.week_index ?? null;
  for (const checkin of checkinsSorted) {
    if (!Number.isInteger(checkin.week_index)) {
      continue;
    }
    if (expectedWeek === null || checkin.week_index === expectedWeek) {
      streakWeeks += 1;
      expectedWeek = checkin.week_index - 1;
      continue;
    }
    break;
  }
  const streakDays = streakWeeks * 7;

  const completedMissionIds = new Set(
    checkins.flatMap((checkin) => Array.isArray(checkin.completed_mission_ids) ? checkin.completed_mission_ids : [])
  );
  const missionCount = missions.length;
  const progressPct = missionCount > 0
    ? Math.min(100, Math.round((completedMissionIds.size / missionCount) * 100))
    : Math.min(100, checkins.length * 8);

  return {
    month_themes: monthThemes,
    missions,
    streak_days: streakDays,
    progress_pct: progressPct
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

async function serveStaticFile(pathname, res, options = {}) {
  const headOnly = options.headOnly ?? false;
  const mappedTarget = STATIC_ROUTE_MAP[pathname];
  const target = mappedTarget ?? pathname;
  if (!mappedTarget && !target.startsWith('/assets/')) {
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
    sendBinary(res, 200, payload, contentType, headOnly);
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
    const rawPathname = url.pathname;
    const pathname = ROUTE_ALIASES[rawPathname] ?? rawPathname;

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

      if (method === 'GET' && pathname === '/v1/onboarding/state') {
        const state = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : {
              completed_steps: [],
              next_step: 'consent',
              profile_completion_pct: 0,
              evidence_completion_pct: 0,
              consent: null
            };
        if (state?.goals) {
          state.first_test_suggestion = deriveFirstTestRecommendation(state.goals, state.quick_preferences);
        }
        sendJson(res, 200, state);
        return;
      }

      if (method === 'GET' && pathname === '/v1/me') {
        const onboardingState = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : {
              completed_steps: [],
              next_step: 'consent',
              profile_completion_pct: 0,
              evidence_completion_pct: 0
            };
        const latestBlueprint = typeof store.getLatestBlueprint === 'function'
          ? await store.getLatestBlueprint()
          : null;
        const latestCheckin = typeof store.getLatestCheckin === 'function'
          ? await store.getLatestCheckin()
          : null;
        const dashboard = buildDashboardPayload(onboardingState, latestBlueprint, latestCheckin, now());
        sendJson(res, 200, {
          onboarding: onboardingState,
          model_summary: {
            cis: dashboard.cis_summary,
            confidence_meter: dashboard.confidence_meter,
            evidence_coverage: dashboard.evidence_coverage,
            next_best_action: dashboard.next_best_action
          }
        });
        return;
      }

      if (method === 'GET' && pathname === '/v1/dashboard') {
        const onboardingState = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : {
              completed_steps: [],
              next_step: 'consent',
              profile_completion_pct: 0,
              evidence_completion_pct: 0
            };
        const latestBlueprint = typeof store.getLatestBlueprint === 'function'
          ? await store.getLatestBlueprint()
          : null;
        const latestCheckin = typeof store.getLatestCheckin === 'function'
          ? await store.getLatestCheckin()
          : null;

        const payload = buildDashboardPayload(onboardingState, latestBlueprint, latestCheckin, now());
        sendJson(res, 200, payload);
        return;
      }

      if (method === 'GET' && pathname === '/v1/profile') {
        const onboardingState = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : {
              completed_steps: [],
              next_step: 'consent',
              profile_completion_pct: 0,
              evidence_completion_pct: 0
            };
        const resumeItems = typeof store.getResumeItems === 'function'
          ? await store.getResumeItems()
          : [];
        const evidenceItems = typeof store.listEvidenceItems === 'function'
          ? await store.listEvidenceItems()
          : [];

        sendJson(res, 200, buildProfilePayload(onboardingState, resumeItems, evidenceItems));
        return;
      }

      if (method === 'GET' && pathname === '/v1/profile/evidence') {
        const skillId = url.searchParams.get('skill_id');
        const evidenceItems = typeof store.listEvidenceItems === 'function'
          ? await store.listEvidenceItems()
          : [];
        const items = skillId
          ? evidenceItems.filter((item) => item.skill_id === skillId)
          : evidenceItems;

        sendJson(res, 200, { items });
        return;
      }

      if (method === 'POST' && pathname === '/v1/profile/evidence') {
        const body = await parseJsonBody(req);

        if (!EVIDENCE_SOURCES.has(body.source)) {
          throw httpError(400, 'source must be one of: assessment, portfolio, cert, self_report.');
        }
        if (!hasNonEmptyString(body.skill_id)) {
          throw httpError(400, 'skill_id is required.');
        }
        if (
          typeof body.evidence_strength !== 'number'
          || body.evidence_strength < 0
          || body.evidence_strength > 1
        ) {
          throw httpError(400, 'evidence_strength must be a number between 0 and 1.');
        }
        if (body.metadata !== undefined && (body.metadata === null || typeof body.metadata !== 'object')) {
          throw httpError(400, 'metadata must be an object when provided.');
        }

        const evidenceItem = {
          id: randomUUID(),
          source: body.source,
          skill_id: body.skill_id,
          evidence_strength: body.evidence_strength,
          reliability: body.reliability ?? null,
          timestamp: now(),
          metadata: body.metadata ?? {}
        };
        const created = typeof store.addEvidenceItem === 'function'
          ? await store.addEvidenceItem(evidenceItem)
          : evidenceItem;
        sendJson(res, 201, created);
        return;
      }

      if (method === 'POST' && pathname === '/v1/onboarding/consent') {
        const body = await parseJsonBody(req);

        if (typeof body.profiling_accepted !== 'boolean') {
          throw httpError(400, 'profiling_accepted must be a boolean.');
        }
        if (!body.profiling_accepted) {
          throw httpError(400, 'Profiling consent is required to continue onboarding.');
        }

        const consent = {
          profiling_accepted: true,
          market_data_linking_accepted: Boolean(body.market_data_linking_accepted),
          research_opt_in: Boolean(body.research_opt_in),
          consent_version: '1.0',
          saved_at: now()
        };

        if (typeof store.saveConsent === 'function') {
          await store.saveConsent(consent);
        }

        sendJson(res, 200, {
          saved: true,
          consent_version: consent.consent_version,
          saved_at: consent.saved_at
        });
        return;
      }

      if (method === 'POST' && pathname === '/v1/onboarding/goals') {
        const body = await parseJsonBody(req);
        const consent = typeof store.getConsent === 'function' ? await store.getConsent() : null;
        if (!consent?.profiling_accepted) {
          throw httpError(400, 'Complete consent step first before saving goals.');
        }

        const errors = validateGoalsPayload(body);
        if (errors.length > 0) {
          throw httpError(400, `Goals validation failed: ${errors.join(' ')}`);
        }

        const goals = {
          goal_type: body.goal_type,
          time_horizon_months: body.time_horizon_months,
          time_per_week_hours: body.time_per_week_hours,
          salary_floor: body.salary_floor ?? null,
          location: body.location,
          relocation_ok: body.relocation_ok,
          remote_only: body.remote_only,
          saved_at: now()
        };

        if (typeof store.saveGoals === 'function') {
          await store.saveGoals(goals);
        }

        const onboardingState = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : { profile_completion_pct: 0 };

        sendJson(res, 200, {
          saved: true,
          profile_completion_pct: onboardingState.profile_completion_pct
        });
        return;
      }

      if (method === 'POST' && pathname === '/v1/onboarding/upload') {
        const consent = typeof store.getConsent === 'function' ? await store.getConsent() : null;
        if (!consent?.profiling_accepted) {
          throw httpError(400, 'Complete consent step first before uploading experience.');
        }

        const goals = typeof store.getGoals === 'function' ? await store.getGoals() : null;
        if (!goals) {
          throw httpError(400, 'Complete goals step first before uploading experience.');
        }

        const contentTypeHeader = String(req.headers['content-type'] ?? '');
        const contentType = contentTypeHeader.toLowerCase();
        let hasFile = false;
        let hasLinkedin = false;
        let hasPastedHistory = false;
        let fileName = null;
        let linkedinUrl = null;
        let pastedHistory = null;

        if (contentType.includes('application/json')) {
          const body = await parseJsonBody(req, true);
          fileName = hasNonEmptyString(body.file_name) ? body.file_name.trim() : null;
          linkedinUrl = hasNonEmptyString(body.linkedin_url) ? body.linkedin_url.trim() : null;
          pastedHistory = hasNonEmptyString(body.pasted_history) ? body.pasted_history.trim() : null;
        } else {
          const raw = await readBody(req);
          if (raw.length === 0) {
            throw httpError(400, 'Upload payload is required.');
          }

          const parsed = parseMultipartBody(raw, contentTypeHeader);
          const parsedFile = parsed.files.find((entry) => entry.field_name === 'file') ?? parsed.files[0] ?? null;
          fileName = hasNonEmptyString(parsedFile?.file_name) ? parsedFile.file_name.trim() : null;
          linkedinUrl = hasNonEmptyString(parsed.fields.linkedin_url) ? parsed.fields.linkedin_url : null;
          pastedHistory = hasNonEmptyString(parsed.fields.pasted_history)
            ? parsed.fields.pasted_history
            : hasNonEmptyString(parsedFile?.text_content)
              ? parsedFile.text_content
              : null;
        }

        const normalizedLinkedinUrl = normalizeOptionalUrl(linkedinUrl);
        hasFile = hasNonEmptyString(fileName);
        hasLinkedin = hasNonEmptyString(normalizedLinkedinUrl);
        hasPastedHistory = hasNonEmptyString(pastedHistory);

        if (!hasFile && !hasLinkedin && !hasPastedHistory) {
          throw httpError(
            400,
            'Provide at least one input method: file, linkedin_url, or pasted_history.'
          );
        }
        if (hasNonEmptyString(linkedinUrl) && !normalizedLinkedinUrl && !hasFile && !hasPastedHistory) {
          throw httpError(400, 'linkedin_url must be a valid URL.');
        }

        if (typeof store.saveOnboardingUpload === 'function') {
          await store.saveOnboardingUpload({
            has_file: hasFile,
            has_linkedin_url: hasLinkedin,
            has_pasted_history: hasPastedHistory,
            parsed_at: now()
          });
        }

        sendJson(
          res,
          200,
          buildResumeParseResult({
            fileName,
            linkedinUrl: normalizedLinkedinUrl,
            pastedHistory,
            goals
          })
        );
        return;
      }

      if (method === 'POST' && pathname === '/v1/onboarding/confirm') {
        const consent = typeof store.getConsent === 'function' ? await store.getConsent() : null;
        if (!consent?.profiling_accepted) {
          throw httpError(400, 'Complete consent step first before confirming timeline.');
        }

        const goals = typeof store.getGoals === 'function' ? await store.getGoals() : null;
        if (!goals) {
          throw httpError(400, 'Complete goals step first before confirming timeline.');
        }

        const upload = typeof store.getOnboardingUpload === 'function'
          ? await store.getOnboardingUpload()
          : null;
        if (!upload) {
          throw httpError(400, 'Complete upload step first before confirming timeline.');
        }

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

      if (method === 'POST' && pathname === '/v1/onboarding/quick-preferences') {
        const consent = typeof store.getConsent === 'function' ? await store.getConsent() : null;
        if (!consent?.profiling_accepted) {
          throw httpError(400, 'Complete consent step first before saving preferences.');
        }

        const goals = typeof store.getGoals === 'function' ? await store.getGoals() : null;
        if (!goals) {
          throw httpError(400, 'Complete goals step first before saving preferences.');
        }

        const upload = typeof store.getOnboardingUpload === 'function'
          ? await store.getOnboardingUpload()
          : null;
        if (!upload) {
          throw httpError(400, 'Complete upload step first before saving preferences.');
        }

        const onboardingState = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : { completed_steps: [] };
        if (!onboardingState.completed_steps.includes('confirm')) {
          throw httpError(400, 'Complete confirm step first before saving preferences.');
        }

        const body = await parseJsonBody(req);
        const errors = validateQuickPreferencesPayload(body);
        if (errors.length > 0) {
          throw httpError(400, `Quick preferences validation failed: ${errors.join(' ')}`);
        }

        const snapshot = {
          autonomy_vs_structure: body.autonomy_vs_structure,
          stability_vs_growth: body.stability_vs_growth,
          income_vs_impact: body.income_vs_impact,
          team_vs_solo: body.team_vs_solo,
          hands_on_vs_strategic: body.hands_on_vs_strategic,
          type: 'quick',
          saved_at: now()
        };

        if (typeof store.saveQuickPreferences === 'function') {
          await store.saveQuickPreferences(snapshot);
        }

        const updatedState = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : { profile_completion_pct: 0 };

        sendJson(res, 200, {
          saved: true,
          profile_completion_pct: updatedState.profile_completion_pct
        });
        return;
      }

      if (method === 'POST' && pathname === '/v1/onboarding/first-test/start') {
        const onboardingState = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : { completed_steps: [] };
        if (!onboardingState.completed_steps.includes('quick-preferences')) {
          throw httpError(400, 'Complete quick preferences step first before starting first test.');
        }

        const body = await parseJsonBody(req, true);
        const recommendation = deriveFirstTestRecommendation(
          onboardingState.goals,
          onboardingState.quick_preferences
        );
        if (hasNonEmptyString(body.preferred_role_family)) {
          recommendation.role_family = body.preferred_role_family.trim();
          recommendation.rationale = 'Using your selected preferred role family for calibration.';
        }

        const attemptId = randomUUID();
        const assessmentId = randomUUID();
        const startedAt = now();
        await store.createAttempt({
          attempt_id: attemptId,
          assessment_id: assessmentId,
          type: 'micro_test',
          role_family: recommendation.role_family,
          version: '0.1.0',
          created_at: startedAt,
          events: [],
          completed_at: null,
          result: null
        });

        const manifest = buildFirstTestManifest(recommendation);
        if (typeof store.saveOnboardingFirstTest === 'function') {
          await store.saveOnboardingFirstTest({
            attempt_id: attemptId,
            assessment_id: assessmentId,
            recommended_role_family: recommendation.role_family,
            recommendation_rationale: recommendation.rationale,
            status: 'started',
            progress_pct: 0,
            started_at: startedAt,
            completed_at: null,
            result: null,
            starter_blueprint: null
          });
        }

        sendJson(res, 200, {
          attempt_id: attemptId,
          assessment_id: assessmentId,
          manifest
        });
        return;
      }

      if (method === 'POST' && pathname === '/v1/onboarding/first-test/complete') {
        const onboardingState = typeof store.getOnboardingState === 'function'
          ? await store.getOnboardingState()
          : { completed_steps: [] };
        if (!onboardingState.completed_steps.includes('quick-preferences')) {
          throw httpError(400, 'Complete quick preferences step first before completing first test.');
        }

        const body = await parseJsonBody(req);
        if (typeof body.attempt_id !== 'string') {
          throw httpError(400, 'attempt_id is required.');
        }

        const attempt = await store.getAttempt(body.attempt_id);
        if (!attempt) {
          throw httpError(404, 'Assessment attempt not found.');
        }

        const assessmentResult = buildAssessmentResultFromAttempt(attempt);
        const completedAt = now();
        await store.completeAttempt(attempt.attempt_id, assessmentResult, completedAt);

        const recommendation = deriveFirstTestRecommendation(
          onboardingState.goals,
          onboardingState.quick_preferences
        );
        const starterBlueprint = buildStarterBlueprintPreview(recommendation, assessmentResult);
        const currentFirstTest = typeof store.getOnboardingFirstTest === 'function'
          ? await store.getOnboardingFirstTest()
          : null;

        if (typeof store.saveOnboardingFirstTest === 'function') {
          await store.saveOnboardingFirstTest({
            attempt_id: attempt.attempt_id,
            assessment_id: attempt.assessment_id,
            recommended_role_family: recommendation.role_family,
            recommendation_rationale: recommendation.rationale,
            status: 'completed',
            progress_pct: 100,
            started_at: currentFirstTest?.started_at ?? attempt.created_at ?? completedAt,
            completed_at: completedAt,
            result: assessmentResult,
            starter_blueprint: starterBlueprint
          });
        }

        sendJson(res, 200, {
          assessment_result: assessmentResult,
          starter_blueprint: starterBlueprint,
          next_action: {
            type: 'generate_starter_blueprint',
            label: 'Generate starter blueprint',
            route: '/app/dashboard'
          }
        });
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

        sendJson(res, 200, buildResumeParseResult());
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

      if (method === 'GET' && pathname === '/v1/assessments/catalog') {
        const attempts = typeof store.listAttempts === 'function' ? await store.listAttempts() : [];
        const latestByType = new Map();
        const sortedAttempts = [...attempts].sort(
          (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
        );
        for (const attempt of sortedAttempts) {
          if (!latestByType.has(attempt.type)) {
            latestByType.set(attempt.type, attempt);
          }
        }

        const items = ASSESSMENT_CATALOG_TEMPLATES.map((template) => {
          const latest = latestByType.get(template.type);
          const status = !latest ? 'not_started' : latest.completed_at ? 'completed' : 'in_progress';
          return {
            ...template,
            status,
            reliability: latest?.result?.reliability ?? null
          };
        });

        sendJson(res, 200, { items });
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
        if (body.events.length === 0) {
          throw httpError(400, 'events must include at least one event.');
        }

        const attempt = await store.getAttempt(body.attempt_id);
        if (!attempt) {
          throw httpError(404, 'Assessment attempt not found.');
        }
        if (attempt.completed_at) {
          throw httpError(409, 'Assessment attempt is already completed.');
        }

        let previousT = Number.isFinite(attempt.events.at(-1)?.t) ? attempt.events.at(-1).t : -1;

        for (const event of body.events) {
          if (
            typeof event !== 'object' ||
            typeof event.name !== 'string' ||
            event.name.trim().length === 0 ||
            typeof event.t !== 'number' ||
            !Number.isFinite(event.t) ||
            event.t < 0
          ) {
            throw httpError(400, 'Each event must include numeric t and string name.');
          }
          if (event.t <= previousT) {
            throw httpError(400, 'Event timestamps must be strictly increasing.');
          }
          previousT = event.t;
        }

        const updatedAttempt = await store.appendAttemptEvents(body.attempt_id, body.events);
        if (!updatedAttempt) {
          throw httpError(500, 'Failed to append events.');
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
        if (attempt.completed_at) {
          sendJson(res, 200, attempt.result ?? buildAssessmentResultFromAttempt(attempt));
          return;
        }

        const result = buildAssessmentResultFromAttempt(attempt);

        await store.completeAttempt(attempt.attempt_id, result, now());
        sendJson(res, 200, result);
        return;
      }

      const assessmentAttemptMatch = pathname.match(/^\/v1\/assessments\/([0-9a-fA-F-]{36})$/);
      if (method === 'GET' && assessmentAttemptMatch) {
        const attemptId = assessmentAttemptMatch[1];
        const attempt = await store.getAttempt(attemptId);
        if (!attempt) {
          throw httpError(404, 'Assessment attempt not found.');
        }

        sendJson(res, 200, mapAttemptStatus(attempt));
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

      if (method === 'GET' && pathname === '/v1/blueprint/current') {
        const latestBlueprint = typeof store.getLatestBlueprint === 'function'
          ? await store.getLatestBlueprint()
          : null;
        if (!latestBlueprint) {
          throw httpError(404, 'No blueprint generated yet.');
        }

        sendJson(res, 200, normalizeBlueprintForView(latestBlueprint));
        return;
      }

      const blueprintShareMatch = pathname.match(/^\/v1\/blueprint\/([0-9a-fA-F-]{36})\/share$/);
      if (method === 'POST' && blueprintShareMatch) {
        const blueprintId = blueprintShareMatch[1];
        const blueprint = await store.getBlueprint(blueprintId);
        if (!blueprint) {
          throw httpError(404, 'Blueprint not found.');
        }

        const body = await parseJsonBody(req, true);
        const expiresInHours = Number.isInteger(body.expires_in_hours) && body.expires_in_hours > 0
          ? Math.min(168, body.expires_in_hours)
          : 72;
        const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
        const token = randomUUID().replace(/-/g, '');

        sendJson(res, 201, {
          url: `https://share.careerintel.example.com/blueprint/${blueprintId}?token=${token}`,
          expires_at: expiresAt
        });
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

        sendJson(res, 200, normalizeBlueprintForView(blueprint));
        return;
      }

      if (method === 'GET' && pathname === '/v1/plan') {
        const latestBlueprintRaw = typeof store.getLatestBlueprint === 'function'
          ? await store.getLatestBlueprint()
          : null;
        const latestBlueprint = normalizeBlueprintForView(latestBlueprintRaw);
        const checkins = typeof store.listCheckins === 'function'
          ? await store.listCheckins()
          : [];
        const missions = latestBlueprint?.execution_plan?.missions?.length
          ? latestBlueprint.execution_plan.missions
          : await selectMissionsForCheckin(store);

        sendJson(res, 200, buildPlanPayload(latestBlueprint, checkins, missions));
        return;
      }

      if (method === 'POST' && pathname === '/v1/execution/checkin') {
        const body = await parseJsonBody(req);

        if (!Number.isInteger(body.week_index) || body.week_index < 1) {
          throw httpError(400, 'week_index must be an integer >= 1.');
        }
        if (body.time_spent_min !== undefined && !isNonNegativeInteger(body.time_spent_min)) {
          throw httpError(400, 'time_spent_min must be an integer >= 0.');
        }
        if (
          body.energy !== undefined
          && (!Number.isInteger(body.energy) || body.energy < 1 || body.energy > 10)
        ) {
          throw httpError(400, 'energy must be an integer between 1 and 10.');
        }
        if (body.blockers !== undefined && !isNonEmptyStringArray(body.blockers)) {
          throw httpError(400, 'blockers must be an array of non-empty strings.');
        }
        if (body.completed_mission_ids !== undefined && !isNonEmptyStringArray(body.completed_mission_ids)) {
          throw httpError(400, 'completed_mission_ids must be an array of non-empty strings.');
        }
        if (body.evidence_links !== undefined && !isNonEmptyStringArray(body.evidence_links)) {
          throw httpError(400, 'evidence_links must be an array of non-empty strings.');
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

      if (method === 'GET' && pathname === '/v1/settings') {
        if (typeof store.getSettings === 'function') {
          const settings = await store.getSettings();
          sendJson(res, 200, settings);
          return;
        }

        const consent = typeof store.getConsent === 'function' ? await store.getConsent() : null;
        sendJson(res, 200, {
          consent_flags: {
            profiling_accepted: Boolean(consent?.profiling_accepted),
            market_data_linking_accepted: Boolean(consent?.market_data_linking_accepted),
            research_opt_in: Boolean(consent?.research_opt_in)
          },
          notification_prefs: {
            weekly_checkin_reminders: true,
            drift_alert_notifications: true
          }
        });
        return;
      }

      if (method === 'PATCH' && pathname === '/v1/settings/consents') {
        const body = await parseJsonBody(req);
        if (typeof body.profiling_accepted !== 'boolean') {
          throw httpError(400, 'profiling_accepted must be a boolean.');
        }
        if (!body.profiling_accepted) {
          throw httpError(400, 'Profiling consent is required for core features.');
        }

        const currentConsent = typeof store.getConsent === 'function' ? await store.getConsent() : null;
        const consent = {
          profiling_accepted: true,
          market_data_linking_accepted: Boolean(body.market_data_linking_accepted),
          research_opt_in: Boolean(body.research_opt_in),
          consent_version: currentConsent?.consent_version ?? '1.0',
          saved_at: now()
        };

        let settings;
        if (typeof store.updateSettingsConsents === 'function') {
          settings = await store.updateSettingsConsents(consent);
        } else {
          if (typeof store.saveConsent === 'function') {
            await store.saveConsent(consent);
          }
          settings = {
            consent_flags: {
              profiling_accepted: consent.profiling_accepted,
              market_data_linking_accepted: consent.market_data_linking_accepted,
              research_opt_in: consent.research_opt_in
            },
            notification_prefs: {
              weekly_checkin_reminders: true,
              drift_alert_notifications: true
            }
          };
        }

        sendJson(res, 200, settings);
        return;
      }

      if (method === 'POST' && pathname === '/v1/settings/export') {
        const request = {
          request_id: randomUUID(),
          status: 'queued',
          created_at: now()
        };

        if (typeof store.createDataExportRequest === 'function') {
          await store.createDataExportRequest(request);
        }

        sendJson(res, 202, {
          request_id: request.request_id,
          status: request.status
        });
        return;
      }

      if (method === 'POST' && pathname === '/v1/settings/delete-request') {
        const body = await parseJsonBody(req, true);
        const request = {
          request_id: randomUUID(),
          status: 'queued',
          grace_period_days: 30,
          reason: hasNonEmptyString(body.reason) ? body.reason.trim() : null,
          requested_at: now()
        };

        if (typeof store.createDeletionRequest === 'function') {
          await store.createDeletionRequest(request);
        }

        sendJson(res, 202, {
          request_id: request.request_id,
          status: request.status,
          grace_period_days: request.grace_period_days
        });
        return;
      }

      if (method === 'GET' || method === 'HEAD') {
        const wasServed = await serveStaticFile(rawPathname, res, { headOnly: method === 'HEAD' });
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

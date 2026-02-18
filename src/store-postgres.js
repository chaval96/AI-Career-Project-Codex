import { randomUUID } from 'node:crypto';

const SCHEMA_QUERIES = [
  `
  CREATE TABLE IF NOT EXISTS resume_items (
    id uuid PRIMARY KEY,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS evidence_items (
    id uuid PRIMARY KEY,
    source text NOT NULL,
    skill_id text NOT NULL,
    evidence_strength double precision NOT NULL,
    reliability double precision,
    metadata jsonb,
    created_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS assessment_attempts (
    attempt_id uuid PRIMARY KEY,
    assessment_id uuid NOT NULL,
    type text NOT NULL,
    role_family text,
    version text NOT NULL,
    created_at timestamptz NOT NULL,
    completed_at timestamptz,
    events jsonb NOT NULL DEFAULT '[]'::jsonb,
    result jsonb
  )
  `,
  'CREATE INDEX IF NOT EXISTS idx_assessment_attempts_created_at ON assessment_attempts (created_at DESC)',
  `
  CREATE TABLE IF NOT EXISTS blueprints (
    blueprint_id uuid PRIMARY KEY,
    generated_at timestamptz NOT NULL,
    payload jsonb NOT NULL
  )
  `,
  'CREATE INDEX IF NOT EXISTS idx_blueprints_generated_at ON blueprints (generated_at DESC)',
  `
  CREATE TABLE IF NOT EXISTS checkins (
    id uuid PRIMARY KEY,
    created_at timestamptz NOT NULL,
    payload jsonb NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS consent_events (
    id uuid PRIMARY KEY,
    profiling_accepted boolean NOT NULL,
    market_data_linking_accepted boolean NOT NULL,
    research_opt_in boolean NOT NULL,
    consent_version text NOT NULL,
    saved_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS onboarding_goals (
    id uuid PRIMARY KEY,
    payload jsonb NOT NULL,
    saved_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS onboarding_upload_events (
    id uuid PRIMARY KEY,
    payload jsonb NOT NULL,
    parsed_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS preference_snapshots (
    id uuid PRIMARY KEY,
    type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS onboarding_first_test_runs (
    id uuid PRIMARY KEY,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS notification_settings (
    id uuid PRIMARY KEY,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS report_exports (
    id uuid PRIMARY KEY,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS deletion_requests (
    id uuid PRIMARY KEY,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL
  )
  `
];

function mapAttemptRow(row) {
  if (!row) {
    return null;
  }

  return {
    attempt_id: row.attempt_id,
    assessment_id: row.assessment_id,
    type: row.type,
    role_family: row.role_family,
    version: row.version,
    created_at: row.created_at.toISOString(),
    completed_at: row.completed_at ? row.completed_at.toISOString() : null,
    events: row.events ?? [],
    result: row.result ?? null
  };
}

async function initializeSchema(pool) {
  for (const queryText of SCHEMA_QUERIES) {
    await pool.query(queryText);
  }
}

export async function createPostgresStore(options = {}) {
  let Pool;
  try {
    ({ Pool } = await import('pg'));
  } catch (error) {
    throw new Error(
      'Postgres backend requires the "pg" package. Run "npm install" before using STORE_BACKEND=postgres.'
    );
  }

  const connectionString = options.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required when STORE_BACKEND=postgres.');
  }

  const pool = new Pool({ connectionString });
  await initializeSchema(pool);

  return {
    backend: 'postgres',
    async saveResumeItems(items) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const item of items) {
          await client.query(
            `
            INSERT INTO resume_items (id, payload, created_at)
            VALUES ($1, $2::jsonb, $3)
            `,
            [randomUUID(), JSON.stringify(item), new Date().toISOString()]
          );
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      return items.length;
    },
    async getResumeItems() {
      const result = await pool.query(
        `
        SELECT payload
        FROM resume_items
        ORDER BY created_at DESC
        `
      );

      return result.rows.map((row) => row.payload);
    },
    async addEvidenceItem(item) {
      await pool.query(
        `
        INSERT INTO evidence_items (id, source, skill_id, evidence_strength, reliability, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        `,
        [
          item.id,
          item.source,
          item.skill_id,
          item.evidence_strength,
          item.reliability,
          JSON.stringify(item.metadata ?? {}),
          item.timestamp
        ]
      );

      return item;
    },
    async listEvidenceItems() {
      const result = await pool.query(
        `
        SELECT id, source, skill_id, evidence_strength, reliability, metadata, created_at
        FROM evidence_items
        ORDER BY created_at DESC
        `
      );

      return result.rows.map((row) => ({
        id: row.id,
        source: row.source,
        skill_id: row.skill_id,
        evidence_strength: row.evidence_strength,
        reliability: row.reliability,
        timestamp: row.created_at.toISOString(),
        metadata: row.metadata ?? {}
      }));
    },
    async createAttempt(attempt) {
      await pool.query(
        `
        INSERT INTO assessment_attempts (
          attempt_id,
          assessment_id,
          type,
          role_family,
          version,
          created_at,
          completed_at,
          events,
          result
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
        `,
        [
          attempt.attempt_id,
          attempt.assessment_id,
          attempt.type,
          attempt.role_family,
          attempt.version,
          attempt.created_at,
          attempt.completed_at,
          JSON.stringify(attempt.events ?? []),
          JSON.stringify(attempt.result)
        ]
      );

      return attempt;
    },
    async getAttempt(attemptId) {
      const result = await pool.query(
        `
        SELECT attempt_id, assessment_id, type, role_family, version, created_at, completed_at, events, result
        FROM assessment_attempts
        WHERE attempt_id = $1
        `,
        [attemptId]
      );

      return mapAttemptRow(result.rows[0]);
    },
    async listAttempts() {
      const result = await pool.query(
        `
        SELECT attempt_id, assessment_id, type, role_family, version, created_at, completed_at, events, result
        FROM assessment_attempts
        ORDER BY created_at DESC
        `
      );

      return result.rows.map((row) => mapAttemptRow(row));
    },
    async appendAttemptEvents(attemptId, events) {
      const result = await pool.query(
        `
        UPDATE assessment_attempts
        SET events = COALESCE(events, '[]'::jsonb) || $2::jsonb
        WHERE attempt_id = $1
        RETURNING attempt_id, assessment_id, type, role_family, version, created_at, completed_at, events, result
        `,
        [attemptId, JSON.stringify(events)]
      );

      return mapAttemptRow(result.rows[0]);
    },
    async completeAttempt(attemptId, resultPayload, completedAt) {
      const result = await pool.query(
        `
        UPDATE assessment_attempts
        SET completed_at = $2, result = $3::jsonb
        WHERE attempt_id = $1
        RETURNING attempt_id, assessment_id, type, role_family, version, created_at, completed_at, events, result
        `,
        [attemptId, completedAt, JSON.stringify(resultPayload)]
      );

      return mapAttemptRow(result.rows[0]);
    },
    async saveBlueprint(blueprint) {
      await pool.query(
        `
        INSERT INTO blueprints (blueprint_id, generated_at, payload)
        VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (blueprint_id) DO UPDATE
        SET generated_at = EXCLUDED.generated_at,
            payload = EXCLUDED.payload
        `,
        [blueprint.blueprint_id, blueprint.generated_at, JSON.stringify(blueprint)]
      );

      return blueprint;
    },
    async getBlueprint(blueprintId) {
      const result = await pool.query(
        `
        SELECT payload
        FROM blueprints
        WHERE blueprint_id = $1
        `,
        [blueprintId]
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0].payload;
    },
    async getLatestBlueprint() {
      const result = await pool.query(
        `
        SELECT payload
        FROM blueprints
        ORDER BY generated_at DESC
        LIMIT 1
        `
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0].payload;
    },
    async addCheckin(checkin) {
      await pool.query(
        `
        INSERT INTO checkins (id, created_at, payload)
        VALUES ($1, $2, $3::jsonb)
        `,
        [randomUUID(), checkin.created_at, JSON.stringify(checkin)]
      );

      return checkin;
    },
    async getLatestCheckin() {
      const result = await pool.query(
        `
        SELECT payload
        FROM checkins
        ORDER BY created_at DESC
        LIMIT 1
        `
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0].payload;
    },
    async listCheckins() {
      const result = await pool.query(
        `
        SELECT payload
        FROM checkins
        ORDER BY created_at DESC
        `
      );

      return result.rows.map((row) => row.payload);
    },
    async saveConsent(consent) {
      await pool.query(
        `
        INSERT INTO consent_events (
          id,
          profiling_accepted,
          market_data_linking_accepted,
          research_opt_in,
          consent_version,
          saved_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          randomUUID(),
          consent.profiling_accepted,
          consent.market_data_linking_accepted,
          consent.research_opt_in,
          consent.consent_version,
          consent.saved_at
        ]
      );

      return consent;
    },
    async getConsent() {
      const result = await pool.query(
        `
        SELECT profiling_accepted, market_data_linking_accepted, research_opt_in, consent_version, saved_at
        FROM consent_events
        ORDER BY saved_at DESC
        LIMIT 1
        `
      );

      if (result.rowCount === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        profiling_accepted: row.profiling_accepted,
        market_data_linking_accepted: row.market_data_linking_accepted,
        research_opt_in: row.research_opt_in,
        consent_version: row.consent_version,
        saved_at: row.saved_at.toISOString()
      };
    },
    async getSettings() {
      const consent = await this.getConsent();
      const notificationsResult = await pool.query(
        `
        SELECT payload
        FROM notification_settings
        ORDER BY created_at DESC
        LIMIT 1
        `
      );
      const notificationPrefs = notificationsResult.rowCount > 0
        ? notificationsResult.rows[0].payload
        : {
            weekly_checkin_reminders: true,
            drift_alert_notifications: true
          };

      return {
        consent_flags: {
          profiling_accepted: Boolean(consent?.profiling_accepted),
          market_data_linking_accepted: Boolean(consent?.market_data_linking_accepted),
          research_opt_in: Boolean(consent?.research_opt_in)
        },
        notification_prefs: {
          weekly_checkin_reminders: Boolean(notificationPrefs.weekly_checkin_reminders),
          drift_alert_notifications: Boolean(notificationPrefs.drift_alert_notifications)
        }
      };
    },
    async updateSettingsConsents(consent) {
      await this.saveConsent(consent);
      return this.getSettings();
    },
    async createDataExportRequest(request) {
      await pool.query(
        `
        INSERT INTO report_exports (id, payload, created_at)
        VALUES ($1, $2::jsonb, $3)
        `,
        [request.request_id, JSON.stringify(request), request.created_at]
      );
      return request;
    },
    async createDeletionRequest(request) {
      await pool.query(
        `
        INSERT INTO deletion_requests (id, payload, created_at)
        VALUES ($1, $2::jsonb, $3)
        `,
        [request.request_id, JSON.stringify(request), request.requested_at]
      );
      return request;
    },
    async saveGoals(goals) {
      await pool.query(
        `
        INSERT INTO onboarding_goals (id, payload, saved_at)
        VALUES ($1, $2::jsonb, $3)
        `,
        [randomUUID(), JSON.stringify(goals), goals.saved_at]
      );

      return goals;
    },
    async getGoals() {
      const result = await pool.query(
        `
        SELECT payload
        FROM onboarding_goals
        ORDER BY saved_at DESC
        LIMIT 1
        `
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0].payload;
    },
    async saveOnboardingUpload(upload) {
      await pool.query(
        `
        INSERT INTO onboarding_upload_events (id, payload, parsed_at)
        VALUES ($1, $2::jsonb, $3)
        `,
        [randomUUID(), JSON.stringify(upload), upload.parsed_at]
      );

      return upload;
    },
    async getOnboardingUpload() {
      const result = await pool.query(
        `
        SELECT payload
        FROM onboarding_upload_events
        ORDER BY parsed_at DESC
        LIMIT 1
        `
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0].payload;
    },
    async saveQuickPreferences(snapshot) {
      await pool.query(
        `
        INSERT INTO preference_snapshots (id, type, payload, created_at)
        VALUES ($1, $2, $3::jsonb, $4)
        `,
        [randomUUID(), 'quick', JSON.stringify(snapshot), snapshot.saved_at]
      );

      return snapshot;
    },
    async getQuickPreferences() {
      const result = await pool.query(
        `
        SELECT payload
        FROM preference_snapshots
        WHERE type = 'quick'
        ORDER BY created_at DESC
        LIMIT 1
        `
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0].payload;
    },
    async saveOnboardingFirstTest(firstTest) {
      const createdAt = firstTest.completed_at ?? firstTest.started_at ?? new Date().toISOString();
      await pool.query(
        `
        INSERT INTO onboarding_first_test_runs (id, payload, created_at)
        VALUES ($1, $2::jsonb, $3)
        `,
        [randomUUID(), JSON.stringify(firstTest), createdAt]
      );

      return firstTest;
    },
    async getOnboardingFirstTest() {
      const result = await pool.query(
        `
        SELECT payload
        FROM onboarding_first_test_runs
        ORDER BY created_at DESC
        LIMIT 1
        `
      );

      if (result.rowCount === 0) {
        return null;
      }

      return result.rows[0].payload;
    },
    async getResumeItemCount() {
      const result = await pool.query('SELECT COUNT(*)::int AS count FROM resume_items');
      return result.rows[0]?.count ?? 0;
    },
    async getOnboardingState() {
      const consent = await this.getConsent();
      const goals = await this.getGoals();
      const upload = await this.getOnboardingUpload();
      const quickPreferences = await this.getQuickPreferences();
      const firstTest = await this.getOnboardingFirstTest();
      const resumeItemCount = await this.getResumeItemCount();
      const completedSteps = [];
      if (consent?.profiling_accepted) {
        completedSteps.push('consent');
      }
      if (goals) {
        completedSteps.push('goals');
      }
      if (goals && upload) {
        completedSteps.push('upload');
      }
      if (goals && upload && resumeItemCount > 0) {
        completedSteps.push('confirm');
      }
      if (goals && upload && resumeItemCount > 0 && quickPreferences) {
        completedSteps.push('quick-preferences');
      }
      if (firstTest?.status === 'completed') {
        completedSteps.push('first-test');
      }

      let nextStep = 'consent';
      if (completedSteps.includes('consent') && !completedSteps.includes('goals')) {
        nextStep = 'goals';
      }
      if (
        completedSteps.includes('consent') &&
        completedSteps.includes('goals') &&
        !completedSteps.includes('upload')
      ) {
        nextStep = 'upload';
      }
      if (completedSteps.includes('upload')) {
        nextStep = 'confirm';
      }
      if (completedSteps.includes('confirm')) {
        nextStep = 'quick-preferences';
      }
      if (completedSteps.includes('quick-preferences')) {
        nextStep = 'first-test';
      }
      if (completedSteps.includes('first-test')) {
        nextStep = 'app-dashboard';
      }

      return {
        completed_steps: completedSteps,
        next_step: nextStep,
        profile_completion_pct: completedSteps.includes('first-test')
          ? 1
          : completedSteps.includes('quick-preferences')
            ? 0.85
            : completedSteps.includes('confirm')
              ? 0.7
              : completedSteps.includes('upload')
                ? 0.55
                : completedSteps.includes('goals')
                  ? 0.4
                  : completedSteps.includes('consent')
                    ? 0.2
                    : 0,
        evidence_completion_pct: completedSteps.includes('first-test') ? 0.2 : 0,
        consent,
        goals,
        upload,
        quick_preferences: quickPreferences,
        first_test: firstTest
      };
    },
    async ping() {
      try {
        await pool.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },
    async close() {
      await pool.end();
    }
  };
}

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
  const { Pool } = await import('pg');

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
    async close() {
      await pool.end();
    }
  };
}

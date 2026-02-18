export function createMemoryStore() {
  const data = {
    resumeItems: [],
    attempts: new Map(),
    blueprints: new Map(),
    checkins: []
  };

  return {
    backend: 'memory',
    async saveResumeItems(items) {
      data.resumeItems.push(...items);
      return items.length;
    },
    async createAttempt(attempt) {
      data.attempts.set(attempt.attempt_id, attempt);
      return attempt;
    },
    async getAttempt(attemptId) {
      return data.attempts.get(attemptId) ?? null;
    },
    async appendAttemptEvents(attemptId, events) {
      const attempt = data.attempts.get(attemptId);
      if (!attempt) {
        return null;
      }

      attempt.events.push(...events);
      return attempt;
    },
    async completeAttempt(attemptId, result, completedAt) {
      const attempt = data.attempts.get(attemptId);
      if (!attempt) {
        return null;
      }

      attempt.completed_at = completedAt;
      attempt.result = result;
      return attempt;
    },
    async saveBlueprint(blueprint) {
      data.blueprints.set(blueprint.blueprint_id, blueprint);
      return blueprint;
    },
    async getBlueprint(blueprintId) {
      return data.blueprints.get(blueprintId) ?? null;
    },
    async getLatestBlueprint() {
      return [...data.blueprints.values()].sort(
        (a, b) => Date.parse(b.generated_at) - Date.parse(a.generated_at)
      )[0] ?? null;
    },
    async addCheckin(checkin) {
      data.checkins.push(checkin);
      return checkin;
    },
    async ping() {
      return true;
    },
    async close() {}
  };
}

export function createMemoryStore() {
  const data = {
    resumeItems: [],
    evidenceItems: [],
    attempts: new Map(),
    blueprints: new Map(),
    checkins: [],
    consent: null,
    goals: null,
    upload: null,
    quickPreferences: null,
    firstTest: null,
    notificationPrefs: {
      weekly_checkin_reminders: true,
      drift_alert_notifications: true
    },
    exportRequests: [],
    deletionRequests: []
  };

  return {
    backend: 'memory',
    async saveResumeItems(items) {
      data.resumeItems.push(...items);
      return items.length;
    },
    async getResumeItems() {
      return [...data.resumeItems];
    },
    async addEvidenceItem(item) {
      data.evidenceItems.push(item);
      return item;
    },
    async listEvidenceItems() {
      return [...data.evidenceItems].sort(
        (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
      );
    },
    async createAttempt(attempt) {
      data.attempts.set(attempt.attempt_id, attempt);
      return attempt;
    },
    async getAttempt(attemptId) {
      return data.attempts.get(attemptId) ?? null;
    },
    async listAttempts() {
      return [...data.attempts.values()];
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
    async getLatestCheckin() {
      return [...data.checkins].sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
      )[0] ?? null;
    },
    async listCheckins() {
      return [...data.checkins].sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
      );
    },
    async saveConsent(consent) {
      data.consent = consent;
      return consent;
    },
    async getConsent() {
      return data.consent;
    },
    async getSettings() {
      return {
        consent_flags: {
          profiling_accepted: Boolean(data.consent?.profiling_accepted),
          market_data_linking_accepted: Boolean(data.consent?.market_data_linking_accepted),
          research_opt_in: Boolean(data.consent?.research_opt_in)
        },
        notification_prefs: { ...data.notificationPrefs }
      };
    },
    async updateSettingsConsents(consent) {
      data.consent = consent;
      return this.getSettings();
    },
    async createDataExportRequest(request) {
      data.exportRequests.push(request);
      return request;
    },
    async createDeletionRequest(request) {
      data.deletionRequests.push(request);
      return request;
    },
    async saveGoals(goals) {
      data.goals = goals;
      return goals;
    },
    async getGoals() {
      return data.goals;
    },
    async saveOnboardingUpload(upload) {
      data.upload = upload;
      return upload;
    },
    async getOnboardingUpload() {
      return data.upload;
    },
    async saveQuickPreferences(snapshot) {
      data.quickPreferences = snapshot;
      return snapshot;
    },
    async getQuickPreferences() {
      return data.quickPreferences;
    },
    async saveOnboardingFirstTest(firstTest) {
      data.firstTest = firstTest;
      return firstTest;
    },
    async getOnboardingFirstTest() {
      return data.firstTest;
    },
    async getOnboardingState() {
      const completedSteps = [];
      if (data.consent?.profiling_accepted) {
        completedSteps.push('consent');
      }
      if (data.goals) {
        completedSteps.push('goals');
      }
      if (data.goals && data.upload) {
        completedSteps.push('upload');
      }
      if (data.goals && data.upload && data.resumeItems.length > 0) {
        completedSteps.push('confirm');
      }
      if (data.goals && data.upload && data.resumeItems.length > 0 && data.quickPreferences) {
        completedSteps.push('quick-preferences');
      }
      if (data.firstTest?.status === 'completed') {
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
        consent: data.consent,
        goals: data.goals,
        upload: data.upload,
        quick_preferences: data.quickPreferences,
        first_test: data.firstTest
      };
    },
    async ping() {
      return true;
    },
    async close() {}
  };
}

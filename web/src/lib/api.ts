import type { OnboardingState } from './onboarding';

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed: ${response.status}`);
  }

  return payload as T;
}

export const api = {
  getOnboardingState: () => requestJson<OnboardingState>('/v1/onboarding/state'),
  saveConsent: (body: {
    profiling_accepted: boolean;
    market_data_linking_accepted: boolean;
    research_opt_in: boolean;
  }) => requestJson<{ saved: boolean; consent_version: string; saved_at: string }>('/v1/onboarding/consent', {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  saveGoals: (body: Record<string, unknown>) => requestJson<{ saved: boolean; profile_completion_pct: number }>(
    '/v1/onboarding/goals',
    {
      method: 'POST',
      body: JSON.stringify(body)
    }
  ),
  saveUpload: (body: Record<string, unknown>) => requestJson<Record<string, unknown>>('/v1/onboarding/upload', {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  confirmResume: (body: { resume_items: Array<Record<string, unknown>> }) =>
    requestJson<{ saved_count: number }>('/v1/onboarding/confirm', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  savePreferences: (body: Record<string, unknown>) =>
    requestJson<{ saved: boolean; profile_completion_pct: number }>('/v1/onboarding/quick-preferences', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  startFirstTest: (body: Record<string, unknown> = {}) =>
    requestJson<Record<string, unknown>>('/v1/onboarding/first-test/start', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  appendAssessmentEvents: (attemptId: string, events: Array<Record<string, unknown>>) =>
    requestJson<null>('/v1/assessments/events', {
      method: 'POST',
      body: JSON.stringify({ attempt_id: attemptId, events })
    }),
  completeFirstTest: (attemptId: string) =>
    requestJson<Record<string, unknown>>('/v1/onboarding/first-test/complete', {
      method: 'POST',
      body: JSON.stringify({ attempt_id: attemptId })
    }),
  generateBlueprint: (body: Record<string, unknown>) =>
    requestJson<{ blueprint_id: string; status: string }>('/v1/blueprint/generate', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  dashboard: () => requestJson<Record<string, unknown>>('/v1/dashboard'),
  profile: () => requestJson<Record<string, unknown>>('/v1/profile'),
  assessmentsCatalog: () => requestJson<Record<string, unknown>>('/v1/assessments/catalog'),
  blueprintCurrent: () => requestJson<Record<string, unknown>>('/v1/blueprint/current'),
  plan: () => requestJson<Record<string, unknown>>('/v1/plan'),
  weeklyCheckin: (body: Record<string, unknown>) =>
    requestJson<Record<string, unknown>>('/v1/execution/checkin', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  getSettings: () => requestJson<Record<string, unknown>>('/v1/settings'),
  updateSettingsConsents: (body: Record<string, unknown>) =>
    requestJson<Record<string, unknown>>('/v1/settings/consents', {
      method: 'PATCH',
      body: JSON.stringify(body)
    }),
  requestDataExport: () =>
    requestJson<Record<string, unknown>>('/v1/settings/export', {
      method: 'POST'
    }),
  requestDelete: (body: Record<string, unknown>) =>
    requestJson<Record<string, unknown>>('/v1/settings/delete-request', {
      method: 'POST',
      body: JSON.stringify(body)
    })
};

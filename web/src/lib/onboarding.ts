export type OnboardingStep =
  | 'consent'
  | 'goals'
  | 'upload'
  | 'confirm'
  | 'quick-preferences'
  | 'first-test'
  | 'app-dashboard';

export type OnboardingState = {
  completed_steps: string[];
  next_step: OnboardingStep;
  profile_completion_pct: number;
  evidence_completion_pct: number;
  consent?: {
    profiling_accepted: boolean;
    market_data_linking_accepted: boolean;
    research_opt_in: boolean;
    consent_version: string;
    saved_at: string;
  } | null;
  goals?: Record<string, unknown> | null;
  quick_preferences?: Record<string, unknown> | null;
  first_test?: Record<string, unknown> | null;
};

export const onboardingRouteByStep: Record<OnboardingStep, string> = {
  consent: '/onboarding/consent',
  goals: '/onboarding/goals',
  upload: '/onboarding/upload',
  confirm: '/onboarding/confirm',
  'quick-preferences': '/onboarding/quick-preferences',
  'first-test': '/onboarding/first-test',
  'app-dashboard': '/app/dashboard'
};

export const onboardingStepOrder: Array<{ key: OnboardingStep; label: string }> = [
  { key: 'consent', label: 'Consent' },
  { key: 'goals', label: 'Goals' },
  { key: 'upload', label: 'Upload' },
  { key: 'confirm', label: 'Confirm' },
  { key: 'quick-preferences', label: 'Preferences' },
  { key: 'first-test', label: 'First Test' }
];

export function routeForOnboardingStep(step: OnboardingStep): string {
  return onboardingRouteByStep[step] ?? '/onboarding/consent';
}

export function isOnboardingComplete(state: OnboardingState | null): boolean {
  return state?.next_step === 'app-dashboard' || state?.completed_steps.includes('first-test') === true;
}

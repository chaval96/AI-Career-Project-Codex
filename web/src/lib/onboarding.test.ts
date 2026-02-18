import { describe, expect, it } from 'vitest';

import { isOnboardingComplete, routeForOnboardingStep } from './onboarding';

describe('onboarding route helpers', () => {
  it('maps required onboarding steps to routes', () => {
    expect(routeForOnboardingStep('consent')).toBe('/onboarding/consent');
    expect(routeForOnboardingStep('first-test')).toBe('/onboarding/first-test');
    expect(routeForOnboardingStep('app-dashboard')).toBe('/app/dashboard');
  });

  it('detects completion by next step or completed step marker', () => {
    expect(
      isOnboardingComplete({
        completed_steps: ['consent', 'goals', 'upload', 'confirm', 'quick-preferences', 'first-test'],
        next_step: 'app-dashboard',
        profile_completion_pct: 1,
        evidence_completion_pct: 0.2
      })
    ).toBe(true);

    expect(
      isOnboardingComplete({
        completed_steps: ['consent', 'goals'],
        next_step: 'upload',
        profile_completion_pct: 0.55,
        evidence_completion_pct: 0
      })
    ).toBe(false);
  });
});

import { Navigate, useLocation } from 'react-router-dom';

import { routeForOnboardingStep, type OnboardingStep } from '../lib/onboarding';
import { useOnboardingState } from '../state/useOnboardingState';
import { RetryBanner } from './RetryBanner';

type GuardProps = {
  children: JSX.Element;
};

type OnboardingGuardProps = GuardProps & {
  step: OnboardingStep;
};

function LoadingCard() {
  return <div className="rounded-2xl border border-line bg-white p-4">Loading...</div>;
}

export function AppRouteGuard({ children }: GuardProps) {
  const { state, loading, error, refresh } = useOnboardingState();

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return <RetryBanner message={error} onRetry={refresh} />;
  }

  if (!state || state.next_step !== 'app-dashboard') {
    const nextRoute = routeForOnboardingStep(state?.next_step ?? 'consent');
    return <Navigate to={nextRoute} replace />;
  }

  return children;
}

export function OnboardingRouteGuard({ step, children }: OnboardingGuardProps) {
  const { state, loading, error, refresh } = useOnboardingState();
  const location = useLocation();

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return <RetryBanner message={error} onRetry={refresh} />;
  }

  if (!state) {
    return <Navigate to="/onboarding/consent" replace />;
  }

  if (state.next_step === 'app-dashboard') {
    return <Navigate to="/app/dashboard" replace />;
  }

  const expectedRoute = routeForOnboardingStep(state.next_step);
  const completed = new Set(state.completed_steps);
  const currentRoute = location.pathname;

  if (!completed.has(step) && currentRoute !== expectedRoute) {
    return <Navigate to={expectedRoute} replace />;
  }

  return children;
}

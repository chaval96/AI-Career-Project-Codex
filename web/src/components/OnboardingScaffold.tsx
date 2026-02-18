import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { OnboardingStepper } from './OnboardingStepper';
import type { OnboardingStep } from '../lib/onboarding';

type Props = {
  step: OnboardingStep;
  title: string;
  why: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function OnboardingScaffold({ step, title, why, children, actions }: Props) {
  return (
    <section>
      <OnboardingStepper currentStep={step} />
      <article className="rounded-2xl border border-line bg-white p-5">
        <h2 className="m-0 text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-2 rounded-lg bg-mint/50 p-3 text-sm text-slate-700">Why we ask this: {why}</p>
        <div className="mt-4 grid gap-4">{children}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {actions}
          <Link to="/auth/login" className="rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink">
            Save and resume later
          </Link>
        </div>
      </article>
    </section>
  );
}

import { onboardingStepOrder, type OnboardingStep } from '../lib/onboarding';

type Props = {
  currentStep: OnboardingStep;
};

export function OnboardingStepper({ currentStep }: Props) {
  const currentIndex = onboardingStepOrder.findIndex((step) => step.key === currentStep);

  return (
    <ol className="mb-6 grid gap-2 rounded-2xl border border-line bg-white p-4 sm:grid-cols-6">
      {onboardingStepOrder.map((step, index) => {
        const active = step.key === currentStep;
        const done = index < currentIndex;
        return (
          <li
            key={step.key}
            className={`rounded-xl px-3 py-2 text-sm ${
              active ? 'bg-sea text-white' : done ? 'bg-mint text-ink' : 'bg-sand text-slate-600'
            }`}
          >
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">
              {index + 1}
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

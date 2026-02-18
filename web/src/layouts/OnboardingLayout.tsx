import { Outlet } from 'react-router-dom';

export function OnboardingLayout() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Career Path OS</p>
        <h1 className="m-0 text-4xl font-bold text-ink">Guided Onboarding</h1>
      </header>
      <Outlet />
    </div>
  );
}

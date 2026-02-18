import { Link, Outlet, useLocation } from 'react-router-dom';

import { ProgressBars } from '../components/ProgressBars';
import { useOnboardingState } from '../state/useOnboardingState';

const links = [
  { to: '/app/dashboard', label: 'Home' },
  { to: '/app/blueprint', label: 'Blueprint' },
  { to: '/app/assessments', label: 'Assessments' },
  { to: '/app/plan', label: 'Plan' },
  { to: '/app/profile', label: 'Profile' },
  { to: '/app/settings', label: 'Settings' }
];

export function AppLayout() {
  const location = useLocation();
  const { state } = useOnboardingState();

  const confidence = Math.round(Math.max(0, Math.min(100, (state?.evidence_completion_pct ?? 0) * 100)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Career Intelligence OS</p>
          <h1 className="m-0 text-4xl font-bold text-ink">AI Career Path OS</h1>
        </div>
        <div className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">Confidence meter: {confidence}%</div>
      </header>

      <nav className="mb-4 flex flex-wrap gap-2">
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                active ? 'border-sea bg-sea text-white' : 'border-line bg-white text-ink'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
        <aside className="grid gap-4">
          <ProgressBars
            profileCompletionPct={state?.profile_completion_pct ?? 0}
            evidenceCompletionPct={state?.evidence_completion_pct ?? 0}
          />
          <div className="rounded-2xl border border-line bg-white p-4 text-sm text-slate-600">
            <p className="m-0 font-semibold text-ink">Context CTA</p>
            <p className="mt-2">Use this area for next-best-action in each page.</p>
          </div>
        </aside>

        <main className="grid gap-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

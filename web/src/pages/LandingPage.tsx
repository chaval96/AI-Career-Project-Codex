import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <main className="mx-auto mt-10 max-w-4xl rounded-3xl border border-line bg-white p-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">AI Career Path OS</p>
        <Link to="/auth/login" className="text-sm font-semibold text-sea">
          Sign in
        </Link>
      </div>
      <h1 className="text-4xl font-bold text-ink">Quantified career identity with forecasts and weekly execution.</h1>
      <p className="text-lg text-slate-600">
        Build a reliable plan from goals, measured evidence, market context, and weekly mission feedback.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/auth/login" className="rounded-xl bg-sea px-4 py-2 font-semibold text-white">
          Get Started
        </Link>
        <Link to="/auth/login" className="rounded-xl border border-line px-4 py-2 font-semibold text-ink">
          I already have an account
        </Link>
      </div>
    </main>
  );
}

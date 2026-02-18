import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto mt-10 max-w-xl rounded-2xl border border-line bg-white p-6 text-center">
      <h1 className="m-0 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">Use the primary flow routes to continue onboarding or open the app.</p>
      <Link to="/landing" className="mt-4 inline-block rounded-xl bg-sea px-4 py-2 font-semibold text-white">
        Go to landing
      </Link>
    </main>
  );
}

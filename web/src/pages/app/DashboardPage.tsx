import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../../lib/api';

export function DashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setData(await api.dashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cis = (data?.cis_summary as Record<string, number> | undefined) ?? {};
  const confidence = (data?.confidence_meter as Record<string, number> | undefined)?.value;
  const next = (data?.next_best_action as Record<string, string> | undefined) ?? null;

  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-line bg-white p-4">
        <h2 className="m-0 text-2xl font-bold text-ink">Home / Overview</h2>
        <p className="mt-2 text-sm text-slate-600">Status, confidence, and the most important next action.</p>
      </article>

      {error ? (
        <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={load}>
            Retry
          </button>
        </article>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-line bg-white p-4">
          <p className="m-0 text-xs uppercase tracking-wider text-slate-500">CIS</p>
          <p className="mt-2 text-3xl font-bold text-ink">{cis.cis_mean ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-line bg-white p-4">
          <p className="m-0 text-xs uppercase tracking-wider text-slate-500">Confidence</p>
          <p className="mt-2 text-3xl font-bold text-ink">{Math.round(Number(confidence ?? 0) * 100)}%</p>
        </article>
        <article className="rounded-2xl border border-line bg-white p-4">
          <p className="m-0 text-xs uppercase tracking-wider text-slate-500">Evidence</p>
          <p className="mt-2 text-3xl font-bold text-ink">
            {Math.round(Number(data?.evidence_completion_pct ?? 0) * 100)}%
          </p>
        </article>
      </div>

      <article className="rounded-2xl border border-line bg-white p-4">
        <p className="m-0 text-xs uppercase tracking-wider text-slate-500">Next best action</p>
        <p className="mt-2 text-base font-semibold text-ink">{next?.label ?? 'Continue setup'}</p>
        <Link to={next?.route ?? '/onboarding/consent'} className="mt-3 inline-block rounded-xl bg-sea px-4 py-2 font-semibold text-white">
          {next?.label ?? 'Continue onboarding'}
        </Link>
      </article>
    </section>
  );
}

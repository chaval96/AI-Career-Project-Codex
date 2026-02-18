import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

export function AssessmentsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const payload = await api.assessmentsCatalog();
      setItems((payload.items as Array<Record<string, unknown>> | undefined) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessments.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-line bg-white p-4">
        <h2 className="m-0 text-2xl font-bold text-ink">Assessments</h2>
        <p className="mt-2 text-sm text-slate-600">Why we ask this: reliability-calibrated signals improve fit accuracy.</p>
      </article>

      {error ? (
        <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={load}>
            Retry
          </button>
        </article>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article key={String(item.assessment_id)} className="rounded-2xl border border-line bg-white p-4">
            <p className="m-0 text-base font-semibold text-ink">{String(item.title)}</p>
            <p className="mt-1 text-sm text-slate-600">Duration: {String(item.duration_min)} min</p>
            <p className="mt-1 text-sm text-slate-600">Status: {String(item.status)}</p>
            <p className="mt-1 text-sm text-slate-600">Reliability: {String(item.reliability ?? 'n/a')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

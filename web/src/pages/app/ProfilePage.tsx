import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

export function ProfilePage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setData(await api.profile());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const timeline = (data?.timeline as Array<Record<string, string>> | undefined) ?? [];
  const evidence = (data?.evidence_items as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-line bg-white p-4">
        <h2 className="m-0 text-2xl font-bold text-ink">Profile</h2>
        <p className="mt-2 text-sm text-slate-600">Timeline, skill evidence, motivation, and artifacts.</p>
      </article>

      {error ? (
        <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={load}>
            Retry
          </button>
        </article>
      ) : null}

      <article className="rounded-2xl border border-line bg-white p-4">
        <h3 className="m-0 text-lg font-semibold text-ink">Timeline</h3>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
          {timeline.length > 0 ? (
            timeline.map((row, idx) => (
              <li key={`timeline-${idx}`}>
                {(row.role_title as string) || 'Role'} at {(row.org as string) || 'Company'} ({(row.start_date as string) || 'n/a'})
              </li>
            ))
          ) : (
            <li>No timeline entries yet.</li>
          )}
        </ul>
      </article>

      <article className="rounded-2xl border border-line bg-white p-4">
        <h3 className="m-0 text-lg font-semibold text-ink">Skills Evidence</h3>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
          {evidence.length > 0 ? (
            evidence.map((item, idx) => (
              <li key={`ev-${idx}`}>
                {String(item.skill_id)} (strength {String(item.evidence_strength)})
              </li>
            ))
          ) : (
            <li>No evidence uploaded yet.</li>
          )}
        </ul>
      </article>
    </section>
  );
}

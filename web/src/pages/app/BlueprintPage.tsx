import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

export function BlueprintPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setData(await api.blueprintCurrent());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No blueprint available yet.');
      setData(null);
    }
  }

  async function generateDefault() {
    setError(null);
    try {
      await api.generateBlueprint({
        region: 'US-NYC',
        target_roles: ['15-1252.00'],
        scenarios: ['safe', 'aggressive', 'pivot'],
        constraints: { time_per_week_hours: 8 }
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate blueprint.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cis = (data?.identity_model as Record<string, unknown> | undefined)?.cis as
    | Record<string, number>
    | undefined;
  const coverage = (data?.identity_model as Record<string, unknown> | undefined)?.evidence_coverage as
    | Record<string, number>
    | undefined;
  const drivers = (data?.drivers as string[] | undefined) ?? [];
  const risks = (data?.risks as string[] | undefined) ?? [];
  const scenarios = (data?.scenarios as Array<Record<string, unknown>> | undefined) ?? [];
  const actions = (data?.next_three_actions as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-line bg-white p-4">
        <h2 className="m-0 text-2xl font-bold text-ink">Blueprint</h2>
        <p className="mt-2 text-sm text-slate-600">Identity report, scenarios, and next actions.</p>
      </article>

      {error ? (
        <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={generateDefault}>
            Retry / Generate
          </button>
        </article>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-4">
          <p className="m-0 text-xs uppercase tracking-wider text-slate-500">CIS + confidence</p>
          <p className="mt-2 text-3xl font-bold text-ink">{cis?.cis_mean ?? 0}</p>
          <p className="mt-1 text-sm text-slate-600">
            p50 {cis?.cis_p50 ?? 0} / p90 {cis?.cis_p90 ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Evidence coverage: measured {Math.round(Number(coverage?.measured_skills_pct ?? 0) * 100)}% / inferred{' '}
            {Math.round(Number(coverage?.inferred_skills_pct ?? 0) * 100)}%
          </p>
        </article>

        <article className="rounded-2xl border border-line bg-white p-4">
          <p className="m-0 text-sm font-semibold text-ink">Top drivers</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {drivers.slice(0, 5).map((driver, idx) => (
              <li key={`driver-${idx}`}>{driver}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold text-ink">Top risks</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {risks.slice(0, 3).map((risk, idx) => (
              <li key={`risk-${idx}`}>{risk}</li>
            ))}
          </ul>
        </article>
      </div>

      <article className="rounded-2xl border border-line bg-white p-4">
        <p className="m-0 text-sm font-semibold text-ink">Scenario cards</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {scenarios.map((scenario) => {
            const time = scenario.time_to_transition_months as Record<string, number> | undefined;
            const pay = scenario.earnings_3yr as Record<string, number> | undefined;
            return (
              <div key={String(scenario.name)} className="rounded-xl border border-line p-3">
                <p className="m-0 font-semibold text-ink">{String(scenario.name)}</p>
                <p className="mt-2 text-sm text-slate-600">Time: {time?.p10 ?? 0}-{time?.p90 ?? 0} months</p>
                <p className="text-sm text-slate-600">Salary: ${pay?.p10 ?? 0} - ${pay?.p90 ?? 0}</p>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-2xl border border-line bg-white p-4">
        <p className="m-0 text-sm font-semibold text-ink">Next 3 actions</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {actions.slice(0, 3).map((action, idx) => (
            <li key={`action-${idx}`}>{String(action.title ?? action.mission_id ?? 'Mission')}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

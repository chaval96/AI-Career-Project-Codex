import { FormEvent, useEffect, useState } from 'react';

import { api } from '../../lib/api';

type PlanData = {
  month_themes: string[];
  missions: Array<{ mission_id: string; title: string; expected_time_min: number; skill_targets: string[] }>;
  streak_days: number;
  progress_pct: number;
};

export function PlanPage() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('idle');
  const [driftAlerts, setDriftAlerts] = useState<string[]>([]);
  const [nextMissions, setNextMissions] = useState<string[]>([]);

  async function load() {
    setError(null);
    try {
      setPlan((await api.plan()) as unknown as PlanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const blockers = String(form.get('blockers') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const payload = {
      week_index: Number(form.get('week_index')),
      time_spent_min: Number(form.get('time_spent_min')),
      energy: Number(form.get('energy')),
      blockers,
      completed_mission_ids: String(form.get('completed_mission_ids') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      evidence_links: String(form.get('evidence_links') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };

    setStatus('saving');
    setError(null);
    try {
      const data = await api.weeklyCheckin(payload);
      setDriftAlerts((data.drift_alerts as string[] | undefined) ?? []);
      setNextMissions(
        ((data.next_missions as Array<{ title?: string }> | undefined) ?? []).map((mission) => mission.title ?? 'Mission')
      );
      setStatus('saved');
      await load();
      const modal = document.getElementById('weekly-checkin-modal') as HTMLDialogElement | null;
      modal?.close();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not submit check-in.');
    }
  }

  function openModal() {
    const modal = document.getElementById('weekly-checkin-modal') as HTMLDialogElement | null;
    modal?.showModal();
  }

  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-line bg-white p-4">
        <h2 className="m-0 text-2xl font-bold text-ink">Plan</h2>
        <p className="mt-2 text-sm text-slate-600">Month themes, weekly missions, and check-in modal.</p>
      </article>

      {error ? (
        <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={load}>
            Retry
          </button>
        </article>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white p-4">
          <p className="m-0 text-sm font-semibold text-ink">Month themes</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {(plan?.month_themes ?? []).map((theme, idx) => (
              <li key={`theme-${idx}`}>{theme}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-line bg-white p-4">
          <p className="m-0 text-sm font-semibold text-ink">Progress</p>
          <p className="mt-2 text-slate-700">Streak: {plan?.streak_days ?? 0} days</p>
          <p className="mt-1 text-slate-700">Plan completion: {Math.round(plan?.progress_pct ?? 0)}%</p>
          <button className="mt-3 rounded-xl bg-sea px-4 py-2 font-semibold text-white" onClick={openModal} type="button">
            Open weekly check-in
          </button>
          <p className="mt-2 text-xs text-slate-500">State: {status}</p>
        </article>
      </div>

      <article className="rounded-2xl border border-line bg-white p-4">
        <p className="m-0 text-sm font-semibold text-ink">Week missions</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {(plan?.missions ?? []).map((mission) => (
            <li key={mission.mission_id}>
              {mission.title} ({mission.expected_time_min}m) - {mission.skill_targets.join(', ')}
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-2xl border border-line bg-white p-4">
        <p className="m-0 text-sm font-semibold text-ink">Drift alerts</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {driftAlerts.length > 0 ? driftAlerts.map((alert, idx) => <li key={`alert-${idx}`}>{alert}</li>) : <li>None</li>}
        </ul>
        <p className="mt-3 text-sm font-semibold text-ink">Next missions</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {nextMissions.length > 0 ? nextMissions.map((mission, idx) => <li key={`next-${idx}`}>{mission}</li>) : <li>None</li>}
        </ul>
      </article>

      <dialog id="weekly-checkin-modal" className="w-[min(720px,calc(100vw-32px))] rounded-2xl border border-line p-4">
        <form className="grid gap-3" onSubmit={onSubmit}>
          <h3 className="m-0 text-lg font-semibold text-ink">Weekly check-in</h3>
          <p className="text-sm text-slate-600">Why we ask this: check-ins keep mission recommendations adaptive and reliable.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Week index
              <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" type="number" name="week_index" min={1} defaultValue={1} required />
            </label>
            <label className="text-sm">
              Time spent (minutes)
              <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" type="number" name="time_spent_min" min={0} defaultValue={120} required />
            </label>
            <label className="text-sm">
              Energy (1-10)
              <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" type="number" name="energy" min={1} max={10} defaultValue={6} required />
            </label>
            <label className="text-sm">
              Completed mission IDs
              <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" name="completed_mission_ids" />
            </label>
          </div>
          <label className="text-sm">
            Blockers (comma separated)
            <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" name="blockers" required />
          </label>
          <label className="text-sm">
            Evidence links
            <input className="mt-1 w-full rounded-xl border border-line px-3 py-2" name="evidence_links" />
          </label>
          <div className="mt-1 flex gap-2">
            <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="submit">
              Submit check-in
            </button>
            <button
              className="rounded-xl border border-line px-4 py-2 font-semibold text-ink"
              type="button"
              onClick={() => (document.getElementById('weekly-checkin-modal') as HTMLDialogElement | null)?.close()}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

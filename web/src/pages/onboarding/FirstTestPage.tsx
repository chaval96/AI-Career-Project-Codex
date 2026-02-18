import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { OnboardingScaffold } from '../../components/OnboardingScaffold';
import { api } from '../../lib/api';
import { useOnboardingState } from '../../state/useOnboardingState';

type TestSession = {
  attempt_id: string;
  manifest?: {
    suggested_role_family?: string;
    suggestion_rationale?: string;
    expected_duration_min?: number;
  };
};

export function FirstTestPage() {
  const { state } = useOnboardingState();
  const [session, setSession] = useState<TestSession | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [starterBlueprint, setStarterBlueprint] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suggestedRole = useMemo(() => {
    const suggestion = (state as Record<string, unknown> | null)?.first_test_suggestion as
      | Record<string, string>
      | undefined;
    return suggestion?.role_family ?? 'software_engineering';
  }, [state]);

  async function startTest() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const payload = (await api.startFirstTest()) as unknown as TestSession;
      setSession(payload);
      setProgressPct(35);
      await api.appendAssessmentEvents(payload.attempt_id, [{ t: 15, name: 'answer', data: { value: 'A' } }]);
      setProgressPct(70);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start test.');
    } finally {
      setBusy(false);
    }
  }

  async function completeTestAndGenerateBlueprint() {
    if (!session?.attempt_id) {
      setError('Start the test first.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const completion = await api.completeFirstTest(session.attempt_id);
      setResult((completion.assessment_result as Record<string, unknown>) ?? null);
      setStarterBlueprint((completion.starter_blueprint as Record<string, unknown>) ?? null);
      setProgressPct(100);

      const region = (state?.goals as Record<string, unknown> | undefined)?.location;
      await api.generateBlueprint({
        region: typeof region === 'string' && region.length > 0 ? region : 'US-NYC',
        target_roles: [suggestedRole],
        scenarios: ['safe', 'aggressive', 'pivot'],
        constraints: {
          time_per_week_hours: (state?.goals as Record<string, unknown> | undefined)?.time_per_week_hours ?? 8
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete first test.');
    } finally {
      setBusy(false);
    }
  }

  const topClusters = (starterBlueprint?.top_role_clusters as string[] | undefined) ?? [];
  const miniPlan = (starterBlueprint?.mini_plan as Array<{ title?: string }> | undefined) ?? [];
  const cis = (starterBlueprint?.cis as Record<string, number> | undefined) ?? null;

  return (
    <OnboardingScaffold
      step="first-test"
      title="Step 6/6: First calibration test"
      why="measured signals improve reliability and unlock your starter blueprint immediately."
      actions={
        <>
          <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="button" onClick={startTest}>
            {busy ? 'Working...' : 'Start test'}
          </button>
          <button
            className="rounded-xl bg-ink px-4 py-2 font-semibold text-white"
            type="button"
            onClick={completeTestAndGenerateBlueprint}
          >
            Complete and generate starter blueprint
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">Suggested test cluster: {suggestedRole}</p>
      <p className="rounded-lg bg-mint/50 p-3 text-sm text-slate-700">This is not an exam. It is calibration for better plan quality.</p>
      <div>
        <p className="mb-1 text-xs text-slate-600">Progress</p>
        <div className="h-2 rounded-full bg-slate-200">
          <div className="h-2 rounded-full bg-sea" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
      {result ? (
        <div className="rounded-xl border border-line p-3 text-sm">
          <p className="m-0 font-semibold text-ink">Result summary</p>
          <p className="mt-2 text-slate-600">Score: {(result.scores as Record<string, number>)?.overall ?? 'n/a'}</p>
          <p className="mt-1 text-slate-600">Reliability: {String(result.reliability ?? 'n/a')}</p>
        </div>
      ) : null}

      {starterBlueprint ? (
        <div className="rounded-xl border border-line p-3 text-sm">
          <p className="m-0 text-lg font-semibold text-ink">Starter Blueprint</p>
          <p className="mt-2 text-slate-700">Top 3 role clusters: {topClusters.join(', ') || 'n/a'}</p>
          <p className="mt-1 text-slate-700">
            CIS: {cis?.cis_mean ?? 'n/a'} (confidence range p50 {cis?.cis_p50 ?? 'n/a'} / p90 {cis?.cis_p90 ?? 'n/a'})
          </p>
          <p className="mt-2 font-semibold text-ink">4-week mini missions</p>
          <ul className="mt-1 list-disc pl-5 text-slate-700">
            {miniPlan.slice(0, 4).map((item, index) => (
              <li key={`mission-${index}`}>{item.title ?? 'Mission'}</li>
            ))}
          </ul>
          <Link className="mt-3 inline-block rounded-xl bg-sea px-4 py-2 font-semibold text-white" to="/app/dashboard">
            Open dashboard
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={session ? completeTestAndGenerateBlueprint : startTest}>
            Retry
          </button>
        </div>
      ) : null}
    </OnboardingScaffold>
  );
}

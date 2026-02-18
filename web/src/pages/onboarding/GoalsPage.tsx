import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OnboardingScaffold } from '../../components/OnboardingScaffold';
import { api } from '../../lib/api';

const goalTypes = [
  { value: 'promotion', label: 'Promotion' },
  { value: 'switch_role', label: 'Switch role' },
  { value: 'switch_industry', label: 'Switch industry' },
  { value: 'freelancing', label: 'Start freelancing' },
  { value: 'relocate', label: 'Relocate' }
];

export function GoalsPage() {
  const navigate = useNavigate();
  const [goalType, setGoalType] = useState('switch_role');
  const [timeHorizonMonths, setTimeHorizonMonths] = useState(12);
  const [timePerWeek, setTimePerWeek] = useState(8);
  const [location, setLocation] = useState('US-NYC');
  const [salaryFloor, setSalaryFloor] = useState('');
  const [relocationOk, setRelocationOk] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!goalType) {
      return 'Goal type is required.';
    }
    if (![3, 6, 12].includes(timeHorizonMonths)) {
      return 'Time horizon must be 3, 6, or 12 months.';
    }
    if (!location.trim()) {
      return 'Location is required.';
    }
    if (timePerWeek <= 0) {
      return 'Time/week must be greater than 0.';
    }
    return null;
  }, [goalType, location, timeHorizonMonths, timePerWeek]);

  async function onContinue() {
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.saveGoals({
        goal_type: goalType,
        time_horizon_months: timeHorizonMonths,
        time_per_week_hours: timePerWeek,
        location,
        salary_floor: salaryFloor ? Number(salaryFloor) : null,
        relocation_ok: relocationOk,
        remote_only: remoteOnly
      });
      navigate('/onboarding/upload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save goals.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step="goals"
      title="Step 2/6: Goals and constraints"
      why="goal constraints define realistic scenario timing and mission sizing."
      actions={
        <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="button" onClick={onContinue}>
          {saving ? 'Saving...' : 'Continue'}
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-ink">
          Goal type
          <select
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
          >
            {goalTypes.map((goal) => (
              <option key={goal.value} value={goal.value}>
                {goal.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-ink">
          Time horizon
          <select
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={timeHorizonMonths}
            onChange={(e) => setTimeHorizonMonths(Number(e.target.value))}
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-ink">
          Time per week (hours)
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            type="number"
            min={1}
            value={timePerWeek}
            onChange={(e) => setTimePerWeek(Number(e.target.value))}
          />
        </label>

        <label className="text-sm font-semibold text-ink">
          Salary floor (optional)
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            type="number"
            min={0}
            value={salaryFloor}
            onChange={(e) => setSalaryFloor(e.target.value)}
            placeholder="120000"
          />
        </label>

        <label className="text-sm font-semibold text-ink sm:col-span-2">
          Region
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="US-NYC"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={relocationOk} onChange={(e) => setRelocationOk(e.target.checked)} />
          Willing to relocate
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
          Remote only
        </label>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}{' '}
          <button type="button" className="font-semibold underline" onClick={onContinue}>
            Retry
          </button>
        </div>
      ) : null}
    </OnboardingScaffold>
  );
}

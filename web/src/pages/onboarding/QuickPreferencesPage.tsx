import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OnboardingScaffold } from '../../components/OnboardingScaffold';
import { api } from '../../lib/api';

type Sliders = {
  autonomy_vs_structure: number;
  stability_vs_growth: number;
  income_vs_impact: number;
  team_vs_solo: number;
  hands_on_vs_strategic: number;
};

const labels: Record<keyof Sliders, string> = {
  autonomy_vs_structure: 'Autonomy vs structure',
  stability_vs_growth: 'Stability vs growth',
  income_vs_impact: 'Income vs impact',
  team_vs_solo: 'Team vs solo',
  hands_on_vs_strategic: 'Hands-on vs strategic'
};

const defaults: Sliders = {
  autonomy_vs_structure: 50,
  stability_vs_growth: 50,
  income_vs_impact: 50,
  team_vs_solo: 50,
  hands_on_vs_strategic: 50
};

export function QuickPreferencesPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<Sliders>(defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onContinue() {
    setSaving(true);
    setError(null);
    try {
      await api.savePreferences(values);
      navigate('/onboarding/first-test');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step="quick-preferences"
      title="Step 5/6: Quick preferences"
      why="preference signals improve role fit confidence and scenario durability."
      actions={
        <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="button" onClick={onContinue}>
          {saving ? 'Saving...' : 'Continue'}
        </button>
      }
    >
      <div className="grid gap-3">
        {(Object.keys(values) as Array<keyof Sliders>).map((key) => (
          <label key={key} className="rounded-xl border border-line p-3 text-sm font-semibold text-ink">
            <span className="block">{labels[key]}</span>
            <input
              className="mt-2 w-full"
              type="range"
              min={0}
              max={100}
              value={values[key]}
              onChange={(event) => {
                const next = Number(event.target.value);
                setValues((prev) => ({ ...prev, [key]: next }));
              }}
            />
            <span className="text-xs text-slate-500">Value: {values[key]}</span>
          </label>
        ))}
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

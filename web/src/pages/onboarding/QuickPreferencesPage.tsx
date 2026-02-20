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

const preferenceMeta: Record<keyof Sliders, { label: string; minLabel: string; maxLabel: string; hint: string }> = {
  autonomy_vs_structure: {
    label: 'Autonomy vs structure',
    minLabel: 'Structured',
    maxLabel: 'Autonomous',
    hint: 'How much ownership vs process guidance helps you perform best?'
  },
  stability_vs_growth: {
    label: 'Stability vs growth',
    minLabel: 'Stable',
    maxLabel: 'Fast growth',
    hint: 'Do you prefer predictable environments or high-change upside?'
  },
  income_vs_impact: {
    label: 'Income vs impact',
    minLabel: 'Impact-first',
    maxLabel: 'Income-first',
    hint: 'Which trade-off matters more in your next 12 months?'
  },
  team_vs_solo: {
    label: 'Team vs solo',
    minLabel: 'Solo-heavy',
    maxLabel: 'Team-heavy',
    hint: 'Where do you naturally deliver stronger outcomes?'
  },
  hands_on_vs_strategic: {
    label: 'Hands-on vs strategic',
    minLabel: 'Hands-on builder',
    maxLabel: 'Strategic planner',
    hint: 'Which work mode should your plan prioritize?'
  }
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
      <p className="text-sm text-slate-600">Move each slider to reflect your natural preference, not what sounds ideal.</p>
      <div className="grid gap-3">
        {(Object.keys(values) as Array<keyof Sliders>).map((key) => (
          <label key={key} className="rounded-xl border border-line p-3 text-sm font-semibold text-ink">
            <span className="block">{preferenceMeta[key].label}</span>
            <span className="mt-1 block text-xs font-normal text-slate-500">{preferenceMeta[key].hint}</span>
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
            <span className="mt-1 block text-xs text-slate-500">
              {preferenceMeta[key].minLabel} - <strong>{values[key]}</strong> - {preferenceMeta[key].maxLabel}
            </span>
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

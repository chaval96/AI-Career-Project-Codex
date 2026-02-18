import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OnboardingScaffold } from '../../components/OnboardingScaffold';
import { api } from '../../lib/api';

export function ConsentPage() {
  const navigate = useNavigate();
  const [profilingAccepted, setProfilingAccepted] = useState(true);
  const [marketAccepted, setMarketAccepted] = useState(false);
  const [researchOptIn, setResearchOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onContinue() {
    setSaving(true);
    setError(null);
    try {
      await api.saveConsent({
        profiling_accepted: profilingAccepted,
        market_data_linking_accepted: marketAccepted,
        research_opt_in: researchOptIn
      });
      navigate('/onboarding/goals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save consent.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step="consent"
      title="Step 1/6: Consent and privacy"
      why="we use your data to calibrate fit, scenarios, and weekly recommendations with transparent controls."
      actions={
        <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="button" onClick={onContinue}>
          {saving ? 'Saving...' : 'Save and continue'}
        </button>
      }
    >
      <p className="text-sm text-slate-600">
        Required for core features: profiling consent. Optional controls can be changed later in settings.
      </p>
      <label className="flex items-center gap-3 rounded-xl border border-line p-3">
        <input
          type="checkbox"
          checked={profilingAccepted}
          onChange={(event) => setProfilingAccepted(event.target.checked)}
        />
        Profiling consent (required)
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-line p-3">
        <input type="checkbox" checked={marketAccepted} onChange={(event) => setMarketAccepted(event.target.checked)} />
        Market linking (optional)
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-line p-3">
        <input type="checkbox" checked={researchOptIn} onChange={(event) => setResearchOptIn(event.target.checked)} />
        Research opt-in (optional)
      </label>
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

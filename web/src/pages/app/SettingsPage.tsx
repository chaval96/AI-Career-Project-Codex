import { useEffect, useState } from 'react';

import { api } from '../../lib/api';

export function SettingsPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      setData(await api.getSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateConsent(patch: Record<string, boolean>) {
    if (!data) {
      return;
    }
    const existing = (data.consent_flags as Record<string, boolean> | undefined) ?? {};
    setSaving(true);
    setError(null);
    try {
      const next = await api.updateSettingsConsents({ ...existing, ...patch });
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update settings.');
    } finally {
      setSaving(false);
    }
  }

  async function requestExport() {
    setError(null);
    try {
      await api.requestDataExport();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request export.');
    }
  }

  async function requestDelete() {
    setError(null);
    try {
      await api.requestDelete({ reason: 'User requested account deletion.' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request deletion.');
    }
  }

  const consentFlags = (data?.consent_flags as Record<string, boolean> | undefined) ?? {};

  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-line bg-white p-4">
        <h2 className="m-0 text-2xl font-bold text-ink">Settings</h2>
        <p className="mt-2 text-sm text-slate-600">Privacy controls, consent, data export, and deletion requests.</p>
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
        <p className="m-0 text-sm font-semibold text-ink">Consent controls</p>
        <div className="mt-3 grid gap-2 text-sm text-ink">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(consentFlags.profiling_accepted)}
              onChange={(event) => updateConsent({ profiling_accepted: event.target.checked })}
            />
            Profiling
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(consentFlags.market_data_linking_accepted)}
              onChange={(event) => updateConsent({ market_data_linking_accepted: event.target.checked })}
            />
            Market linking
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(consentFlags.research_opt_in)}
              onChange={(event) => updateConsent({ research_opt_in: event.target.checked })}
            />
            Research opt-in
          </label>
        </div>
      </article>

      <article className="rounded-2xl border border-line bg-white p-4">
        <p className="m-0 text-sm font-semibold text-ink">Data controls</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink" type="button" onClick={requestExport}>
            Download my data
          </button>
          <button className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700" type="button" onClick={requestDelete}>
            Request deletion
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Saving state: {saving ? 'in progress' : 'idle'}</p>
      </article>
    </section>
  );
}

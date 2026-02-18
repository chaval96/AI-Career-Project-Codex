import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OnboardingScaffold } from '../../components/OnboardingScaffold';
import { api } from '../../lib/api';

type ResumeItem = {
  org: string;
  role_title: string;
  start_date: string;
  end_date?: string | null;
  location?: string;
  level?: string;
};

function readParsedResume(): ResumeItem[] {
  const raw = sessionStorage.getItem('parsed_resume_result');
  if (!raw) {
    return [{ org: '', role_title: '', start_date: '' }];
  }

  try {
    const payload = JSON.parse(raw) as { extracted_items?: ResumeItem[] };
    if (!Array.isArray(payload.extracted_items) || payload.extracted_items.length === 0) {
      return [{ org: '', role_title: '', start_date: '' }];
    }
    return payload.extracted_items.map((item) => ({
      org: item.org ?? '',
      role_title: item.role_title ?? '',
      start_date: item.start_date ?? '',
      end_date: item.end_date ?? null,
      location: item.location ?? '',
      level: item.level ?? ''
    }));
  } catch {
    return [{ org: '', role_title: '', start_date: '' }];
  }
}

export function ConfirmPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ResumeItem[]>(() => readParsedResume());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    const hasInvalid = rows.some((row) => !row.org.trim() || !row.role_title.trim() || !row.start_date.trim());
    return hasInvalid ? 'Company, role title, and start date are required for each row.' : null;
  }, [rows]);

  function updateRow(index: number, patch: Partial<ResumeItem>) {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  async function onContinue() {
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.confirmResume({
        resume_items: rows.map((row) => ({
          org: row.org,
          role_title: row.role_title,
          start_date: row.start_date,
          end_date: row.end_date || null,
          location: row.location || undefined,
          level: row.level || undefined
        }))
      });
      navigate('/onboarding/quick-preferences');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save timeline confirmation.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step="confirm"
      title="Step 4/6: Confirm extraction"
      why="your edits override parser assumptions and improve recommendation quality."
      actions={
        <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="button" onClick={onContinue}>
          {saving ? 'Saving...' : 'Confirm extraction'}
        </button>
      }
    >
      <div className="grid gap-3">
        {rows.map((row, index) => (
          <div key={`row-${index}`} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-ink">
              Company
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={row.org}
                onChange={(event) => updateRow(index, { org: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              Role title
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={row.role_title}
                onChange={(event) => updateRow(index, { role_title: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              Start date
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                type="date"
                value={row.start_date}
                onChange={(event) => updateRow(index, { start_date: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              Location
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={row.location ?? ''}
                onChange={(event) => updateRow(index, { location: event.target.value })}
              />
            </label>
          </div>
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

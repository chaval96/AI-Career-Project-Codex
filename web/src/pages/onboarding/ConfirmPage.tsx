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
  level?: string | null;
  achievements?: string[];
  tools?: string[];
  self_claimed_skills?: string[];
};

type ParsedResumeState = {
  rows: ResumeItem[];
  notes: string[];
};

function emptyRow(): ResumeItem {
  return {
    org: '',
    role_title: '',
    start_date: '',
    end_date: null,
    location: '',
    level: '',
    achievements: [],
    tools: [],
    self_claimed_skills: []
  };
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function readParsedResume(): ParsedResumeState {
  const raw = sessionStorage.getItem('parsed_resume_result');
  if (!raw) {
    return { rows: [emptyRow()], notes: [] };
  }

  try {
    const payload = JSON.parse(raw) as { extracted_items?: ResumeItem[]; mapping_notes?: string[] };
    if (!Array.isArray(payload.extracted_items) || payload.extracted_items.length === 0) {
      return { rows: [emptyRow()], notes: payload.mapping_notes ?? [] };
    }
    return {
      notes: payload.mapping_notes ?? [],
      rows: payload.extracted_items.map((item) => ({
        org: item.org ?? '',
        role_title: item.role_title ?? '',
        start_date: item.start_date ?? '',
        end_date: item.end_date ?? null,
        location: item.location ?? '',
        level: item.level ?? '',
        achievements: item.achievements ?? [],
        tools: item.tools ?? [],
        self_claimed_skills: item.self_claimed_skills ?? []
      }))
    };
  } catch {
    return { rows: [emptyRow()], notes: [] };
  }
}

export function ConfirmPage() {
  const navigate = useNavigate();
  const [parsed] = useState<ParsedResumeState>(() => readParsedResume());
  const [rows, setRows] = useState<ResumeItem[]>(parsed.rows);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    const hasInvalid = rows.some((row) => !row.org.trim() || !row.role_title.trim() || !row.start_date.trim());
    return hasInvalid ? 'Company, role title, and start date are required for each row.' : null;
  }, [rows]);

  function updateRow(index: number, patch: Partial<ResumeItem>) {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
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
          level: row.level || undefined,
          achievements: row.achievements?.slice(0, 8) ?? [],
          tools: row.tools?.slice(0, 6) ?? [],
          self_claimed_skills: row.self_claimed_skills?.slice(0, 10) ?? []
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
      {parsed.notes.length > 0 ? (
        <div className="rounded-xl border border-line bg-mint/40 p-3 text-sm text-slate-700">
          <p className="m-0 font-semibold text-ink">Parsing notes</p>
          <ul className="mt-2 list-disc pl-5">
            {parsed.notes.map((note, index) => (
              <li key={`note-${index}`}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

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
              End date (optional)
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                type="date"
                value={row.end_date ?? ''}
                onChange={(event) => updateRow(index, { end_date: event.target.value || null })}
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
            <label className="text-sm font-semibold text-ink">
              Level (optional)
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={row.level ?? ''}
                onChange={(event) => updateRow(index, { level: event.target.value })}
                placeholder="junior, mid, senior"
              />
            </label>
            <label className="text-sm font-semibold text-ink sm:col-span-2">
              Achievements (one per line)
              <textarea
                className="mt-1 min-h-24 w-full rounded-xl border border-line px-3 py-2"
                value={(row.achievements ?? []).join('\n')}
                onChange={(event) => updateRow(index, { achievements: parseLines(event.target.value) })}
              />
            </label>
            <label className="text-sm font-semibold text-ink sm:col-span-2">
              Tools detected (comma-separated)
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={(row.tools ?? []).join(', ')}
                onChange={(event) => updateRow(index, { tools: parseCsv(event.target.value) })}
                placeholder="React, SQL, Figma"
              />
            </label>
            <label className="text-sm font-semibold text-ink sm:col-span-2">
              Skills detected (comma-separated)
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={(row.self_claimed_skills ?? []).join(', ')}
                onChange={(event) => updateRow(index, { self_claimed_skills: parseCsv(event.target.value) })}
                placeholder="Problem solving, Communication, Data analysis"
              />
            </label>
          </div>
        ))}
      </div>

      <div>
        <button className="rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink" type="button" onClick={addRow}>
          Add another role
        </button>
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

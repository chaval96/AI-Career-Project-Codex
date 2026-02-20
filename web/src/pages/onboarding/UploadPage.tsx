import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { OnboardingScaffold } from '../../components/OnboardingScaffold';
import { api } from '../../lib/api';

const SUPPORTED_RESUME_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt']);

function extensionForFileName(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() ?? '' : '';
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname.includes('.')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [pastedHistory, setPastedHistory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setNote(null);
  }

  async function onContinue() {
    if (!file && !linkedinUrl.trim() && !pastedHistory.trim()) {
      setError('Provide at least one input method (upload, linkedin, or pasted history).');
      return;
    }

    if (file) {
      const ext = extensionForFileName(file.name);
      if (!SUPPORTED_RESUME_EXTENSIONS.has(ext)) {
        setError('Upload a PDF, DOC, DOCX, or TXT file.');
        return;
      }
    }

    const normalizedLinkedin = normalizeUrl(linkedinUrl);
    if (linkedinUrl.trim() && !normalizedLinkedin && !file && !pastedHistory.trim()) {
      setError('Enter a valid LinkedIn URL, upload a file, or paste your work history.');
      return;
    }

    setSaving(true);
    setError(null);
    setNote(null);
    try {
      const form = new FormData();
      if (file) {
        form.append('file', file, file.name);
      }
      if (normalizedLinkedin) {
        form.append('linkedin_url', normalizedLinkedin);
      }
      if (pastedHistory.trim()) {
        form.append('pasted_history', pastedHistory.trim());
      }

      const result = await api.saveUpload(form);
      sessionStorage.setItem('parsed_resume_result', JSON.stringify(result));
      if (linkedinUrl.trim() && !normalizedLinkedin) {
        setNote('LinkedIn URL was ignored because it was not a valid URL.');
      }
      navigate('/onboarding/confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not parse upload.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScaffold
      step="upload"
      title="Step 3/6: Add experience"
      why="career history provides baseline role transitions and skill evidence candidates."
      actions={
        <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="button" onClick={onContinue}>
          {saving ? 'Parsing...' : 'Parse now'}
        </button>
      }
    >
      <div className="grid gap-4">
        <label className="text-sm font-semibold text-ink">
          Upload CV (PDF/DOC/DOCX/TXT)
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            onChange={onFileChange}
          />
          <p className="mt-1 text-xs font-normal text-slate-500">
            {file ? `Selected: ${file.name}` : 'Optional if you prefer LinkedIn URL or pasted history.'}
          </p>
        </label>

        <label className="text-sm font-semibold text-ink">
          LinkedIn URL (optional)
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </label>

        <label className="text-sm font-semibold text-ink">
          Paste work history (optional)
          <textarea
            className="mt-1 min-h-24 w-full rounded-xl border border-line px-3 py-2"
            value={pastedHistory}
            onChange={(e) => setPastedHistory(e.target.value)}
            placeholder="Company | Role | Dates | Achievements"
          />
        </label>
      </div>

      {note ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{note}</div> : null}

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

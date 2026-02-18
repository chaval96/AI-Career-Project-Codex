import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { OnboardingScaffold } from '../../components/OnboardingScaffold';
import { api } from '../../lib/api';

export function UploadPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [pastedHistory, setPastedHistory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onContinue() {
    if (!fileName.trim() && !linkedinUrl.trim() && !pastedHistory.trim()) {
      setError('Provide at least one input method (upload, linkedin, or pasted history).');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await api.saveUpload({
        file_name: fileName.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        pasted_history: pastedHistory.trim() || undefined
      });
      sessionStorage.setItem('parsed_resume_result', JSON.stringify(result));
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
          Upload CV file name (PDF/DOCX)
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="resume.pdf"
          />
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

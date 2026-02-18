type Props = {
  profileCompletionPct: number;
  evidenceCompletionPct: number;
};

function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-sea" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ProgressBars({ profileCompletionPct, evidenceCompletionPct }: Props) {
  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-white p-4">
      <Meter label="Profile completeness" value={profileCompletionPct} />
      <Meter label="Evidence completeness" value={evidenceCompletionPct} />
    </div>
  );
}

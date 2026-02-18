import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle');
  const navigate = useNavigate();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes('@')) {
      setState('error');
      return;
    }
    setState('sent');
    setTimeout(() => {
      navigate('/onboarding/consent');
    }, 250);
  }

  return (
    <main className="mx-auto mt-10 max-w-xl rounded-3xl border border-line bg-white p-8">
      <h1 className="m-0 text-3xl font-bold text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-600">No password required. Use magic link to continue.</p>
      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        <label className="text-sm font-semibold text-ink">
          Email
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button className="rounded-xl bg-sea px-4 py-2 font-semibold text-white" type="submit">
          Send magic link
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">State: {state}</p>
    </main>
  );
}

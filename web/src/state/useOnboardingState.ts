import { useCallback, useEffect, useState } from 'react';

import { api } from '../lib/api';
import type { OnboardingState } from '../lib/onboarding';

export function useOnboardingState() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await api.getOnboardingState();
      setState(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding state.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, loading, error, refresh };
}

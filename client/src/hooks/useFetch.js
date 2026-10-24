import { useCallback, useEffect, useState } from 'react';

// Runs an async function and exposes { data, loading, error, reload }.
// Ignores results that arrive after the component changed or unmounted.
export function useFetch(fn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: '' });
      return undefined;
    }
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick, ...deps]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  return { ...state, reload };
}

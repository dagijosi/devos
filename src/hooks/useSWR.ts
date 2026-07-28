import { useState, useEffect, useRef, useCallback } from 'react';

interface SWRState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
}

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000;

export function useSWR<T>(key: string, fetcher: () => Promise<T>): SWRState<T> {
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(key);
    return cached && Date.now() - cached.ts < CACHE_TTL ? cached.data as T : null;
  });
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!data);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);

  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (mounted.current) {
        setData(result);
        cache.set(key, { data: result, ts: Date.now() });
      }
    } catch (e: any) {
      if (mounted.current) setError(e);
      // Serve stale cache on error
      const cached = cache.get(key);
      if (cached && mounted.current) setData(cached.data as T);
    }
    if (mounted.current) setLoading(false);
  }, [key]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [load]);

  return { data, error, loading, refetch: load };
}

export function invalidateSWR(key: string) {
  cache.delete(key);
}


import { useState, useEffect, useCallback } from 'react';

// This is a generic hook that can be adapted for various data fetching needs
// For this project, it's a template. Specific implementations will be in the screens.

interface FetchOptions<T> {
  fetcher: () => Promise<T>;
}

export const useGoogleSheetData = <T,>({ fetcher }: FetchOptions<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

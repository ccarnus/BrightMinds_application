import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchLabOverview } from '@features/lab/utils/labApi';

const REFRESH_AFTER_MS = 10 * 60 * 1000;

/**
 * Loads the labs overview. `error` is only set while there is nothing to show; a failed background
 * refresh keeps the map the user is looking at.
 */
const useLabOverview = () => {
  const [labs, setLabs] = useState(null);
  const [error, setError] = useState(null);
  const loadedAt = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchLabOverview();
      if (!mounted.current) return;
      loadedAt.current = Date.now();
      setLabs(data);
      setError(null);
    } catch (failure) {
      console.error('Failed to load the labs:', failure);
      if (mounted.current) setError(failure);
    }
  }, []);

  const retry = useCallback(() => {
    setError(null);
    load();
  }, [load]);

  // First load, and a quiet refresh when coming back to the tab after a while.
  useFocusEffect(
    useCallback(() => {
      if (!loadedAt.current || Date.now() - loadedAt.current > REFRESH_AFTER_MS) load();
    }, [load])
  );

  return { labs, error: labs ? null : error, loading: !labs && !error, retry };
};

export default useLabOverview;

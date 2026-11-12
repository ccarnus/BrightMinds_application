import { useCallback, useEffect, useRef, useState } from 'react';
import { SEARCH_CATEGORIES, searchContent } from '@features/cast/utils/castSearch';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * State of the home search: the query, the category, the (debounced) results and their loading
 * and error state. Stale responses never overwrite newer ones.
 */
const useCastSearch = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(SEARCH_CATEGORIES[0]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const castCacheRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setResults([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);
    const requestId = ++requestRef.current;
    const isLatest = () => requestId === requestRef.current;

    const timer = setTimeout(async () => {
      try {
        const found = await searchContent(category, text, castCacheRef);
        if (isLatest()) setResults(found);
      } catch (searchError) {
        console.error(`Error searching ${category}:`, searchError);
        if (isLatest()) {
          setResults([]);
          setError(searchError);
        }
      } finally {
        if (isLatest()) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      // Invalidate any in-flight request so stale results never overwrite newer ones.
      requestRef.current += 1;
    };
  }, [query, category, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  const reset = useCallback(() => {
    setQuery('');
    castCacheRef.current = null;
  }, []);

  return { query, setQuery, category, setCategory, results, loading, error, retry, reset };
};

export default useCastSearch;

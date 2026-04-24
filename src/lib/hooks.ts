import { useState, useEffect, useRef, useCallback } from 'react';
import { dataCache } from './cache';

/**
 * useProgressiveLoad - Hook for loading data in visible batches
 * Instead of waiting for ALL data, it loads items in chunks (e.g., 5 at a time)
 * so the user sees content appearing progressively.
 */
export function useProgressiveLoad<T>(
  allItems: T[],
  batchSize: number = 6,
  intervalMs: number = 150
) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset when source data changes
    if (!allItems || allItems.length === 0) {
      if (visibleItems.length > 0) setVisibleItems([]);
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    
    // We don't always want to clear visibleItems immediately if we are doing SWR
    // but if it's a completely new set (like new search), we do.
    // For simplicity, we just restart streaming.
    
    let currentIndex = 0;
    const loadNextBatch = () => {
      const nextIndex = Math.min(currentIndex + batchSize, allItems.length);
      setVisibleItems(allItems.slice(0, nextIndex));
      currentIndex = nextIndex;

      if (currentIndex < allItems.length) {
        timeoutRef.current = setTimeout(loadNextBatch, intervalMs);
      } else {
        setIsStreaming(false);
      }
    };

    loadNextBatch();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [allItems, batchSize, intervalMs]);

  return {
    visibleItems,
    isStreaming,
    totalCount: allItems ? allItems.length : 0,
    loadedCount: visibleItems.length,
    progress: (allItems && allItems.length > 0) ? Math.round((visibleItems.length / allItems.length) * 100) : 0
  };
}

/**
 * useStreamingFetch - Hook that fetches data with SWR (Stale-While-Revalidate)
 * If data exists in cache, it's returned immediately while fresh data is fetched in bg.
 */
export function useStreamingFetch<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = [],
  cacheKey?: string
) {
  // Try to recover from cache immediately if cacheKey is provided
  const initialData = cacheKey ? dataCache.get<T>(cacheKey) : null;
  
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const [refreshToggle, setRefreshToggle] = useState(0);

  const refetch = useCallback(async () => {
    setRefreshToggle(prev => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    // If we don't have cached data, show loading
    if (!data) setLoading(true);
    
    fetchFn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
          // Update cache if key exists
          if (cacheKey) dataCache.set(cacheKey, result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshToggle]);

  return { data, loading, error, refetch };
}

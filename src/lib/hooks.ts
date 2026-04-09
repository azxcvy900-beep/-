'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
    if (allItems.length === 0) {
      setVisibleItems([]);
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    setVisibleItems([]);

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

    // Load first batch immediately
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
    totalCount: allItems.length,
    loadedCount: visibleItems.length,
    progress: allItems.length > 0 ? Math.round((visibleItems.length / allItems.length) * 100) : 0
  };
}

/**
 * useStreamingFetch - Hook that fetches data and streams it progressively
 * Fetches multiple data sources independently so each section loads as fast as possible
 */
export function useStreamingFetch<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    fetchFn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
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
  }, deps);

  return { data, loading, error };
}

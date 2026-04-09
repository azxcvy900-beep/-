/**
 * Smart in-memory cache for Firestore data.
 * Prevents redundant network requests when navigating between pages.
 * Each entry has a TTL (time-to-live) after which it becomes stale.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get cached data if it exists and hasn't expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache with a TTL in seconds.
   */
  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  /**
   * Invalidate a specific cache entry.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching a prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const dataCache = new DataCache();

/**
 * Edge-compatible cache using Next.js unstable_cache (Vercel Data Cache).
 * Works reliably in serverless/edge: shared across instances, survives cold starts.
 * Falls back gracefully in dev (uses in-process dedup).
 *
 * Default TTL: 10 minutes (600 s).
 */

import { unstable_cache } from "next/cache";

class EdgeCache {
  private defaultTTL: number;

  constructor(defaultTTL = 600) {
    this.defaultTTL = defaultTTL;
  }

  /**
   * Returns just the cached data (no status tracking).
   * Use when you don't need HIT/MISS info (e.g. server-component rendering).
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const revalidate = ttl ?? this.defaultTTL;
    const cached = unstable_cache(
      async () => await factory(),
      [key],
      { revalidate, tags: [key] },
    );
    return cached();
  }

  /**
   * Returns data + reliable HIT/MISS indicator.
   * Embeds a timestamp; if the stored ts is >500 ms old the data was cached.
   */
  async getOrSetWithStatus<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<{ data: T; cacheStatus: "HIT" | "MISS" }> {
    const revalidate = ttl ?? this.defaultTTL;
    const cached = unstable_cache(
      async () => ({ payload: await factory(), ts: Date.now() }),
      [key],
      { revalidate, tags: [key] },
    );
    const result = await cached();
    const cacheStatus = (Date.now() - result.ts) > 500 ? "HIT" as const : "MISS" as const;
    return { data: result.payload as T, cacheStatus };
  }
}

// Singleton — used by panels API and reader page
export const panelCache = new EdgeCache(600);

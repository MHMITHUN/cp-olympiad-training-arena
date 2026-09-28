/**
 * Fixed-window in-memory rate limiter.
 *
 * Buckets live in a Map stored on globalThis so the counter survives Next.js
 * dev HMR (module re-evaluation would otherwise reset it on every edit).
 *
 * Honest limits of this design (documented in the README too):
 * - In-memory only: each server INSTANCE keeps its own counters. On a
 *   single Node process (this app's demo/self-hosted mode) the limit is
 *   global; on serverless / multi-instance deployments every instance
 *   counts separately, so the effective limit is `max` per window per
 *   instance. A shared store (e.g. Redis) would be needed for a global
 *   limit across instances.
 * - Counters reset when the process restarts.
 * - Pruning: expired buckets are dropped opportunistically so the Map does
 *   not grow without bound under key churn (e.g. one key per login email).
 */

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  /** false when the caller is over the limit and must be rejected. */
  ok: boolean;
  /** Seconds until the window resets (0 when ok). */
  retryAfterSec: number;
}

const globalForRateLimit = globalThis as unknown as {
  __cpArenaRateLimitBuckets?: Map<string, RateLimitBucket>;
};

const buckets: Map<string, RateLimitBucket> =
  globalForRateLimit.__cpArenaRateLimitBuckets ?? new Map();
globalForRateLimit.__cpArenaRateLimitBuckets = buckets;

/** Drop expired buckets once the Map grows past this size. */
const PRUNE_THRESHOLD = 10_000;

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Count one hit against `key` and report whether it is allowed.
 * Fixed window: up to `max` hits per `windowMs`, then rejections until the
 * window resets. Not counted-at: a rejected call does not extend the window.
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size > PRUNE_THRESHOLD) pruneExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Test helper: forget all buckets (each vitest file gets a fresh module,
 * but individual tests may want a clean slate between cases). */
export function resetRateLimitForTests(): void {
  buckets.clear();
}

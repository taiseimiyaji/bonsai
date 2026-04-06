type RateLimitEntry = {
  timestamps: number[];
};

// Limitation: in-memory storage — not shared across multiple server instances or serverless environments.
// For production multi-instance deployments, migrate to Redis or similar shared store.
const store = new Map<string, RateLimitEntry>();

type RateLimitResult = {
  allowed: boolean;
  retryAfterMs?: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { timestamps: [now] });
    return { allowed: true };
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length === 0) {
    store.delete(key);
    store.set(key, { timestamps: [now] });
    return { allowed: true };
  }

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestInWindow);
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { allowed: true };
}

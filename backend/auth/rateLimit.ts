// Simple fixed-window rate limiter kept in process memory.
// On serverless hosting each instance keeps its own counters, so this slows
// down brute-force attempts but is not a global guarantee.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key);
  });
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientIp(headers: Headers | Record<string, unknown> | undefined): string {
  if (!headers) return "unknown";

  const read = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined;
    const value = headers[name];
    return Array.isArray(value) ? value[0] : typeof value === "string" ? value : undefined;
  };

  const forwarded = read("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || read("x-real-ip") || "unknown";
}

export function tooManyAttemptsMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

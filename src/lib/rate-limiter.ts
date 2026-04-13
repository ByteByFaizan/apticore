/* ═══════════════════════════════════════════════
   In-Memory Rate Limiter — Token Bucket
   Per-IP throttling for API routes
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { apiError } from "./api-response";

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// [js-set-map-lookups] O(1) lookup per request
const buckets = new Map<string, TokenBucket>();

// Cleanup stale buckets every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const STALE_THRESHOLD = 10 * 60 * 1000; // 10 min no activity

let lastCleanup = Date.now();

function cleanupStale() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > STALE_THRESHOLD) {
      buckets.delete(key);
    }
  }
}

/**
 * Rate limit config per endpoint category.
 */
export const RATE_LIMITS = {
  create: { maxTokens: 10, refillRate: 10, windowMs: 60_000 },   // 10/min
  upload: { maxTokens: 100, refillRate: 100, windowMs: 60_000 },  // 100/min
  process: { maxTokens: 5, refillRate: 5, windowMs: 60_000 },     // 5/min
  read: { maxTokens: 60, refillRate: 60, windowMs: 60_000 },      // 60/min
  write: { maxTokens: 30, refillRate: 30, windowMs: 60_000 },     // 30/min
} as const;

type RateLimitCategory = keyof typeof RATE_LIMITS;

/**
 * Extract client IP from request.
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit for a request.
 * Returns null if allowed, or an error Response if rate-limited.
 */
export function checkRateLimit(
  request: NextRequest,
  category: RateLimitCategory
): ReturnType<typeof apiError> | null {
  const ip = getClientIP(request);
  const key = `${ip}:${category}`;
  const config = RATE_LIMITS[category];
  const now = Date.now();

  cleanupStale();

  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const refill = (elapsed / config.windowMs) * config.refillRate;
  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + refill);
  bucket.lastRefill = now;

  // Consume token
  if (bucket.tokens < 1) {
    return apiError("Too many requests. Please try again later.", 429);
  }

  bucket.tokens -= 1;
  return null;
}

/* ═══════════════════════════════════════════════
   In-Memory Rate Limiter — Token Bucket
   Per-IP + per-user throttling for API routes

   Features:
   - Token bucket algorithm (smooth, burst-friendly)
   - IP-based + user-based composite keys
   - Configurable via environment variables
   - Rate limit response headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
   - Automatic stale bucket cleanup
   ═══════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";

/* ── Types ── */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;        // ms until full refill
  retryAfterMs: number;   // ms until 1 token available (0 if allowed)
}

/* ── Bucket Storage ── */

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

/* ── Rate Limit Config ── */

/**
 * Read config from env var or fall back to default.
 * Env var format: RATE_LIMIT_{CATEGORY} = "maxTokens" (per windowMs)
 */
function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  create:  { maxTokens: envInt("RATE_LIMIT_CREATE", 10),   refillRate: envInt("RATE_LIMIT_CREATE", 10),   windowMs: 60_000 },
  upload:  { maxTokens: envInt("RATE_LIMIT_UPLOAD", 100),  refillRate: envInt("RATE_LIMIT_UPLOAD", 100),  windowMs: 60_000 },
  process: { maxTokens: envInt("RATE_LIMIT_PROCESS", 5),   refillRate: envInt("RATE_LIMIT_PROCESS", 5),   windowMs: 60_000 },
  read:    { maxTokens: envInt("RATE_LIMIT_READ", 60),     refillRate: envInt("RATE_LIMIT_READ", 60),     windowMs: 60_000 },
  write:   { maxTokens: envInt("RATE_LIMIT_WRITE", 30),    refillRate: envInt("RATE_LIMIT_WRITE", 30),    windowMs: 60_000 },
  auth:    { maxTokens: envInt("RATE_LIMIT_AUTH", 5),      refillRate: envInt("RATE_LIMIT_AUTH", 5),      windowMs: 60_000 },
  health:  { maxTokens: envInt("RATE_LIMIT_HEALTH", 30),   refillRate: envInt("RATE_LIMIT_HEALTH", 30),   windowMs: 60_000 },
};

export type RateLimitCategory = keyof typeof RATE_LIMITS;

/* ── IP Extraction ── */

/**
 * Extract client IP from request.
 * Prefer Vercel's verified header to prevent x-forwarded-for spoofing.
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/* ── Core: Check Rate Limit ── */

/**
 * Check rate limit and return result with metadata.
 * Uses composite key: `{ip}:{userId?}:{category}`
 *
 * @param userId - Optional authenticated user ID for per-user limits
 */
export function checkRateLimit(
  request: NextRequest,
  category: string,
  userId?: string
): RateLimitResult {
  const ip = getClientIP(request);
  // Composite key: IP always present, userId added when available
  // This means an authenticated user gets their OWN bucket separate from IP-only
  const key = userId ? `${ip}:${userId}:${category}` : `${ip}:${category}`;
  const config = RATE_LIMITS[category] || RATE_LIMITS.read;
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

  // Calculate reset time (ms until full refill from current tokens)
  const tokensNeededForFull = config.maxTokens - bucket.tokens;
  const resetMs = tokensNeededForFull > 0
    ? Math.ceil((tokensNeededForFull / config.refillRate) * config.windowMs)
    : 0;

  // Check if allowed
  if (bucket.tokens < 1) {
    // Calculate time until 1 token available
    const tokensNeeded = 1 - bucket.tokens;
    const retryAfterMs = Math.ceil((tokensNeeded / config.refillRate) * config.windowMs);

    return {
      allowed: false,
      limit: config.maxTokens,
      remaining: 0,
      resetMs,
      retryAfterMs,
    };
  }

  // Consume token
  bucket.tokens -= 1;

  return {
    allowed: true,
    limit: config.maxTokens,
    remaining: Math.floor(bucket.tokens),
    resetMs,
    retryAfterMs: 0,
  };
}

/* ── Header Builders ── */

/**
 * Build rate limit headers for inclusion in ANY response.
 * Follows draft-ietf-httpapi-ratelimit-headers conventions.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)), // seconds
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(Math.ceil(result.retryAfterMs / 1000));
  }

  return headers;
}

/**
 * Create a 429 Too Many Requests response with proper headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { success: false, data: null, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    }
  );
}

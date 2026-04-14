/* ═══════════════════════════════════════════════
   CORS Configuration — Strict Origin Policy

   - Allowlist loaded from CORS_ALLOWED_ORIGINS env var
   - localhost auto-allowed in development
   - Explicit method + header allowlists
   - credentials: true (required for auth cookies/headers)
   - Proper preflight (OPTIONS) response builder
   ═══════════════════════════════════════════════ */

/**
 * Parse allowed origins from environment.
 * Format: comma-separated URLs
 * Example: CORS_ALLOWED_ORIGINS="https://apticore.vercel.app,https://apticore.web.app"
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS || "";
  const origins = envOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // In development, always allow localhost
  if (process.env.NODE_ENV === "development") {
    const devOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ];
    for (const dev of devOrigins) {
      if (!origins.includes(dev)) origins.push(dev);
    }
  }

  return origins;
}

/**
 * Allowed HTTP methods for API routes.
 */
const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];

/**
 * Allowed request headers.
 * Authorization: for Bearer tokens
 * Content-Type: for JSON/form bodies
 * X-Requested-With: CSRF defense-in-depth
 */
const ALLOWED_HEADERS = [
  "Authorization",
  "Content-Type",
  "X-Requested-With",
  "Accept",
];

/**
 * Max age for preflight cache (seconds).
 * 1 hour — reduces OPTIONS requests from browsers.
 */
const PREFLIGHT_MAX_AGE = "3600";

/**
 * Check if an origin is allowed.
 * Returns the origin string if allowed, or null if blocked.
 */
export function validateOrigin(origin: string | null): string | null {
  if (!origin) return null;

  const allowed = getAllowedOrigins();

  // No wildcard allowed — must be exact match
  if (allowed.includes(origin)) {
    return origin;
  }

  return null;
}

/**
 * Build CORS headers for a response.
 * Only sets Access-Control-Allow-Origin if origin is validated.
 *
 * SECURITY: Never use "*" with credentials.
 * We always reflect the specific validated origin.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  const validOrigin = validateOrigin(origin);

  const headers: Record<string, string> = {
    // Vary: Origin — required when origin-specific responses are returned.
    // Prevents cache poisoning: CDN/proxy won't serve response for origin A to origin B.
    Vary: "Origin",
  };

  if (validOrigin) {
    headers["Access-Control-Allow-Origin"] = validOrigin;
    headers["Access-Control-Allow-Methods"] = ALLOWED_METHODS.join(", ");
    headers["Access-Control-Allow-Headers"] = ALLOWED_HEADERS.join(", ");
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Access-Control-Max-Age"] = PREFLIGHT_MAX_AGE;
  }

  return headers;
}

/**
 * Build a preflight (OPTIONS) response.
 * Returns 204 No Content with CORS headers for valid origins,
 * or 403 Forbidden for invalid origins.
 */
export function preflightResponse(origin: string | null): Response {
  const validOrigin = validateOrigin(origin);

  if (!validOrigin) {
    return new Response(null, {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

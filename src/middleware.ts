/* ═══════════════════════════════════════════════
   Next.js Edge Middleware — Centralized Security Gate

   Runs BEFORE any API route handler.
   Responsibilities:
   1. CORS enforcement on all /api/* routes
   2. Preflight (OPTIONS) handling at edge (fast)
   3. CORS headers attached to every API response

   Auth + rate limiting stay in route handlers
   (they need body/params context unavailable here).
   ═══════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";

/* ── Inline CORS logic (edge runtime can't import Node modules) ── */

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS || "";
  const origins = envOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

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

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
const ALLOWED_HEADERS = "Authorization, Content-Type, X-Requested-With, Accept";
const PREFLIGHT_MAX_AGE = "3600";

function isOriginAllowed(origin: string | null): string | null {
  if (!origin) return null;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin) ? origin : null;
}

/* ── Middleware ── */

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const validOrigin = isOriginAllowed(origin);

  // ── Handle preflight (OPTIONS) ──
  if (request.method === "OPTIONS") {
    if (!validOrigin) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": validOrigin,
        "Access-Control-Allow-Methods": ALLOWED_METHODS,
        "Access-Control-Allow-Headers": ALLOWED_HEADERS,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": PREFLIGHT_MAX_AGE,
        Vary: "Origin",
      },
    });
  }

  // ── Non-preflight: attach CORS headers to response ──
  const response = NextResponse.next();

  if (validOrigin) {
    response.headers.set("Access-Control-Allow-Origin", validOrigin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

/* ── Matcher: only run on API routes ── */
export const config = {
  matcher: "/api/:path*",
};

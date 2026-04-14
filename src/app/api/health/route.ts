/* ═══════════════════════════════════════════════
   GET /api/health
   Health check — no auth required, rate-limited
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  // Rate limit — prevent health endpoint abuse
  const rl = checkRateLimit(request, "health");
  if (!rl.allowed) return rateLimitResponse(rl);

  return apiSuccess(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
    },
    200,
    rateLimitHeaders(rl)
  );
}

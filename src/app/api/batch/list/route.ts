/* ═══════════════════════════════════════════════
   GET /api/batch/list
   List all batches for authenticated user
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUserBatches } from "@/lib/firestore";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  // Rate limit (IP-only initially)
  const ipRl = checkRateLimit(request, "read");
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    const user = await verifyAuth(request);

    // User-based rate limit
    const userRl = checkRateLimit(request, "read", user.uid);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const rlHeaders = rateLimitHeaders(
      userRl.remaining < ipRl.remaining ? userRl : ipRl
    );

    const batches = await getUserBatches(user.uid);

    return apiSuccess({ batches, total: batches.length }, 200, rlHeaders);
  } catch (err) {
    return handleApiError(err, "batch/list", rateLimitHeaders(ipRl));
  }
}

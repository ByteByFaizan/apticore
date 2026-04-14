/* ═══════════════════════════════════════════════
   GET /api/batch/[batchId]/bias-report
   Fetch before/after bias analysis
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, verifyOwnership } from "@/lib/auth";
import { getJobBatch, getBiasReport } from "@/lib/firestore";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  // Rate limit (IP-only initially)
  const ipRl = checkRateLimit(request, "read");
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    // [async-api-routes] Start auth + params resolution in parallel
    const [user, { batchId }] = await Promise.all([
      verifyAuth(request),
      params,
    ]);

    // User-based rate limit
    const userRl = checkRateLimit(request, "read", user.uid);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const rlHeaders = rateLimitHeaders(
      userRl.remaining < ipRl.remaining ? userRl : ipRl
    );

    if (!batchId) {
      return apiError("Batch ID is required", 400, rlHeaders);
    }

    // Verify batch ownership
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return apiError("Batch not found", 404, rlHeaders);
    }
    verifyOwnership(batch.userId, user.uid);

    if (batch.status !== "COMPLETE") {
      return apiSuccess(
        { report: null, status: batch.status, message: "Batch processing not complete yet" },
        202,
        rlHeaders
      );
    }

    const report = await getBiasReport(batchId);
    if (!report) {
      return apiError("Bias report not found", 404, rlHeaders);
    }

    return apiSuccess({ report }, 200, rlHeaders);
  } catch (err) {
    return handleApiError(err, "batch/[batchId]/bias-report", rateLimitHeaders(ipRl));
  }
}

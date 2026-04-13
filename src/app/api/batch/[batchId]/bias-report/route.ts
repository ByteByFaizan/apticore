/* ═══════════════════════════════════════════════
   GET /api/batch/[batchId]/bias-report
   Fetch before/after bias analysis
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, verifyOwnership } from "@/lib/auth";
import { getJobBatch, getBiasReport } from "@/lib/firestore";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    // Rate limit
    const rateLimitError = checkRateLimit(request, "read");
    if (rateLimitError) return rateLimitError;

    // [async-api-routes] Start auth + params resolution in parallel
    const [user, { batchId }] = await Promise.all([
      verifyAuth(request),
      params,
    ]);

    if (!batchId) {
      return apiError("Batch ID is required", 400);
    }

    // Verify batch ownership
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return apiError("Batch not found", 404);
    }
    verifyOwnership(batch.userId, user.uid);

    if (batch.status !== "COMPLETE") {
      return apiSuccess(
        { report: null, status: batch.status, message: "Batch processing not complete yet" },
        202
      );
    }

    const report = await getBiasReport(batchId);
    if (!report) {
      return apiError("Bias report not found", 404);
    }

    return apiSuccess({ report });
  } catch (err) {
    return handleApiError(err, "batch/[batchId]/bias-report");
  }
}

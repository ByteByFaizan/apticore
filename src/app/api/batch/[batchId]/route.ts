/* ═══════════════════════════════════════════════
   GET /api/batch/[batchId]
   Fetch single batch details
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, verifyOwnership } from "@/lib/auth";
import { getJobBatch } from "@/lib/firestore";
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

    const batch = await getJobBatch(batchId);
    if (!batch) {
      return apiError("Batch not found", 404);
    }

    verifyOwnership(batch.userId, user.uid);

    return apiSuccess({ batch });
  } catch (err) {
    return handleApiError(err, "batch/[batchId]");
  }
}

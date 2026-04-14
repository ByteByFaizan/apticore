/* ═══════════════════════════════════════════════
   DELETE /api/batch/delete
   Delete a batch and all its subcollections
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, verifyOwnership } from "@/lib/auth";
import { getJobBatch, deleteJobBatch } from "@/lib/firestore";
import { DeleteBatchSchema } from "@/lib/validation";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

export async function DELETE(request: NextRequest) {
  // Rate limit (IP-only initially)
  const ipRl = checkRateLimit(request, "write");
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    // [async-api-routes] Start auth + body parse in parallel
    const authPromise = verifyAuth(request);
    const bodyPromise = request.json();

    const user = await authPromise;
    const body = await bodyPromise;

    // User-based rate limit
    const userRl = checkRateLimit(request, "write", user.uid);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const rlHeaders = rateLimitHeaders(
      userRl.remaining < ipRl.remaining ? userRl : ipRl
    );

    // Validate
    const { batchId } = DeleteBatchSchema.parse(body);

    // Verify batch exists + ownership
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return handleApiError(new Error("Batch not found"), "batch/delete", rlHeaders);
    }
    verifyOwnership(batch.userId, user.uid);

    // Don't allow deleting while processing
    const activeStatuses = ["PARSING", "ANALYZING_BIAS_BEFORE", "ANONYMIZING", "MATCHING", "RANKING", "EXPLAINING", "ANALYZING_BIAS_AFTER"];
    if (activeStatuses.includes(batch.status)) {
      return handleApiError(new Error("Cannot delete batch while processing is in progress"), "batch/delete", rlHeaders);
    }

    // Delete batch + subcollections
    await deleteJobBatch(batchId);

    logger.info("Batch deleted", { batchId, userId: user.uid });

    return apiSuccess({ message: "Batch deleted successfully", batchId }, 200, rlHeaders);
  } catch (err) {
    return handleApiError(err, "batch/delete", rateLimitHeaders(ipRl));
  }
}

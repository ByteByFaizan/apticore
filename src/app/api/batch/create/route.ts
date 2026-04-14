/* ═══════════════════════════════════════════════
   POST /api/batch/create
   Create new job batch + upload resume metadata
   ═══════════════════════════════════════════════ */

import { NextRequest, after } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { createJobBatch, incrementUserBatchCount } from "@/lib/firestore";
import { CreateBatchSchema } from "@/lib/validation";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  // Rate limit (IP-only initially, user-based after auth)
  const ipRl = checkRateLimit(request, "create");
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    // [async-api-routes] Start auth + body parse in parallel
    const authPromise = verifyAuth(request);
    const bodyPromise = request.json();

    const user = await authPromise;
    const body = await bodyPromise;

    // User-based rate limit (stricter per-user bucket)
    const userRl = checkRateLimit(request, "create", user.uid);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    // Use tighter limit headers between IP and user
    const rlHeaders = rateLimitHeaders(
      userRl.remaining < ipRl.remaining ? userRl : ipRl
    );

    // ── Validate with Zod ──
    const { jdText, fileCount } = CreateBatchSchema.parse(body);

    // ── Create batch ──
    const batchId = await createJobBatch(user.uid, jdText.trim(), fileCount);

    // [server-after-nonblocking] Increment count after response sent
    after(() => incrementUserBatchCount(user.uid).catch(() => {}));

    logger.info("Batch created", { batchId, userId: user.uid, fileCount });

    return apiSuccess(
      { batchId, message: "Batch created. Upload resumes next." },
      201,
      rlHeaders
    );
  } catch (err) {
    return handleApiError(err, "batch/create", rateLimitHeaders(ipRl));
  }
}

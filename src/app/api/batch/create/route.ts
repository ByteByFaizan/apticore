/* ═══════════════════════════════════════════════
   POST /api/batch/create
   Create new job batch + upload resume metadata
   ═══════════════════════════════════════════════ */

import { NextRequest, after } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { createJobBatch, incrementUserBatchCount } from "@/lib/firestore";
import { CreateBatchSchema } from "@/lib/validation";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitError = checkRateLimit(request, "create");
    if (rateLimitError) return rateLimitError;

    // [async-api-routes] Start auth + body parse in parallel
    const authPromise = verifyAuth(request);
    const bodyPromise = request.json();

    const user = await authPromise;
    const body = await bodyPromise;

    // ── Validate with Zod ──
    const { jdText, fileCount } = CreateBatchSchema.parse(body);

    // ── Create batch ──
    const batchId = await createJobBatch(user.uid, jdText.trim(), fileCount);

    // [server-after-nonblocking] Increment count after response sent
    after(() => incrementUserBatchCount(user.uid).catch(() => {}));

    logger.info("Batch created", { batchId, userId: user.uid, fileCount });

    return apiSuccess(
      { batchId, message: "Batch created. Upload resumes next." },
      201
    );
  } catch (err) {
    return handleApiError(err, "batch/create");
  }
}

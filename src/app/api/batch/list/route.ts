/* ═══════════════════════════════════════════════
   GET /api/batch/list
   List all batches for authenticated user
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUserBatches } from "@/lib/firestore";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitError = checkRateLimit(request, "read");
    if (rateLimitError) return rateLimitError;

    const user = await verifyAuth(request);
    const batches = await getUserBatches(user.uid);

    return apiSuccess({ batches, total: batches.length });
  } catch (err) {
    return handleApiError(err, "batch/list");
  }
}

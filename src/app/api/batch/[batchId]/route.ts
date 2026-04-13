/* ═══════════════════════════════════════════════
   GET /api/batch/[batchId]
   Fetch single batch details
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, verifyOwnership } from "@/lib/auth";
import { getJobBatch } from "@/lib/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    // [async-api-routes] Start auth + params resolution in parallel
    const [user, { batchId }] = await Promise.all([
      verifyAuth(request),
      params,
    ]);

    const batch = await getJobBatch(batchId);
    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }

    verifyOwnership(batch.userId, user.uid);

    return Response.json({ batch });
  } catch (err) {
    return authErrorResponse(err);
  }
}

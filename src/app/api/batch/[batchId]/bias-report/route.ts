/* ═══════════════════════════════════════════════
   GET /api/batch/[batchId]/bias-report
   Fetch before/after bias analysis
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, verifyOwnership } from "@/lib/auth";
import { getJobBatch, getBiasReport } from "@/lib/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await verifyAuth(request);
    const { batchId } = await params;

    // Verify batch ownership
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }
    verifyOwnership(batch.userId, user.uid);

    if (batch.status !== "COMPLETE") {
      return Response.json(
        { error: "Batch processing not complete yet", status: batch.status },
        { status: 202 }
      );
    }

    const report = await getBiasReport(batchId);
    if (!report) {
      return Response.json({ error: "Bias report not found" }, { status: 404 });
    }

    return Response.json({ report });
  } catch (err) {
    return authErrorResponse(err);
  }
}

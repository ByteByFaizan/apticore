/* ═══════════════════════════════════════════════
   GET /api/batch/list
   List all batches for authenticated user
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse } from "@/lib/auth";
import { getUserBatches } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const batches = await getUserBatches(user.uid);

    return Response.json({
      batches,
      total: batches.length,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}

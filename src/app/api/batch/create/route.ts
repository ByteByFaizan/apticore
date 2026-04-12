/* ═══════════════════════════════════════════════
   POST /api/batch/create
   Create new job batch + upload resume metadata
   ═══════════════════════════════════════════════ */

import { NextRequest, after } from "next/server";
import { verifyAuth, authErrorResponse } from "@/lib/auth";
import { createJobBatch, incrementUserBatchCount } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    // [async-api-routes] Start auth + body parse in parallel
    const authPromise = verifyAuth(request);
    const bodyPromise = request.json();

    const user = await authPromise;
    const { jdText, fileCount } = await bodyPromise;

    // ── Validation ──
    if (!jdText || typeof jdText !== "string") {
      return Response.json(
        { error: "Job description text is required" },
        { status: 400 }
      );
    }

    if (jdText.trim().length < 50) {
      return Response.json(
        { error: "Job description is too short. Please provide at least 50 characters for accurate matching." },
        { status: 400 }
      );
    }

    if (!fileCount || fileCount < 1) {
      return Response.json(
        { error: "At least one resume file is required" },
        { status: 400 }
      );
    }

    if (fileCount > 50) {
      return Response.json(
        { error: "Maximum 50 resumes per batch" },
        { status: 400 }
      );
    }

    // ── Create batch ──
    const batchId = await createJobBatch(user.uid, jdText.trim(), fileCount);

    // [server-after-nonblocking] Increment count after response sent
    after(() => incrementUserBatchCount(user.uid).catch(() => {}));

    return Response.json({ batchId, message: "Batch created. Upload resumes next." });
  } catch (err) {
    return authErrorResponse(err);
  }
}

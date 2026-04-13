/* ═══════════════════════════════════════════════
   GET /api/batch/[batchId]/candidates
   Fetch ranked candidates for a batch
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse, verifyOwnership } from "@/lib/auth";
import { getJobBatch, getCandidateResults } from "@/lib/firestore";

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

    // Verify batch ownership
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }
    verifyOwnership(batch.userId, user.uid);

    const candidates = await getCandidateResults(batchId);

    // Support anonymized view
    const view = request.nextUrl.searchParams.get("view");
    if (view === "anonymized") {
      // Strip raw data, return only anonymized + scores
      const anonymizedView = candidates.map((c) => ({
        id: c.id,
        candidateId: c.anonymizedData.candidateId,
        skills: c.anonymizedData.skills,
        experienceYears: c.anonymizedData.experienceYears,
        educationLevel: c.anonymizedData.educationLevel,
        matchScore: c.matchScore,
        skillBreakdown: c.skillBreakdown,
        explanation: c.explanation,
        rank: c.rank,
      }));

      return Response.json({ candidates: anonymizedView, total: candidates.length });
    }

    return Response.json({ candidates, total: candidates.length });
  } catch (err) {
    return authErrorResponse(err);
  }
}

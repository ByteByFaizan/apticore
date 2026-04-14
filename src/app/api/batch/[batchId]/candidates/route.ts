/* ═══════════════════════════════════════════════
   GET /api/batch/[batchId]/candidates
   Fetch ranked candidates for a batch
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, verifyOwnership } from "@/lib/auth";
import { getJobBatch, getCandidateResults } from "@/lib/firestore";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  // Rate limit (IP-only initially)
  const ipRl = checkRateLimit(request, "read");
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    // [async-api-routes] Start auth + params resolution in parallel
    const [user, { batchId }] = await Promise.all([
      verifyAuth(request),
      params,
    ]);

    // User-based rate limit
    const userRl = checkRateLimit(request, "read", user.uid);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const rlHeaders = rateLimitHeaders(
      userRl.remaining < ipRl.remaining ? userRl : ipRl
    );

    if (!batchId) {
      return apiError("Batch ID is required", 400, rlHeaders);
    }

    // Verify batch ownership
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return apiError("Batch not found", 404, rlHeaders);
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

      return apiSuccess({ candidates: anonymizedView, total: candidates.length }, 200, rlHeaders);
    }

    return apiSuccess({ candidates, total: candidates.length }, 200, rlHeaders);
  } catch (err) {
    return handleApiError(err, "batch/[batchId]/candidates", rateLimitHeaders(ipRl));
  }
}

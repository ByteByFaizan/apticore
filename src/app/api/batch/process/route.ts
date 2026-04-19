/* ═══════════════════════════════════════════════
   POST /api/batch/process
   Orchestrate the full 9-step pipeline
   Fixed: deterministic mapping, correct candidate tracing
   ═══════════════════════════════════════════════ */

import { NextRequest, after } from "next/server";
import { verifyAuth, verifyOwnership } from "@/lib/auth";
import {
  getJobBatch,
  updateBatchStatus,
  updateBatchJDRequirements,
  saveCandidateResults,
  saveBiasReport,
} from "@/lib/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { extractText } from "@/lib/pdf-parser";
import { parseResume, extractJDRequirements, generateExplanation, hashResumeContent } from "@/lib/gemini";
import { anonymizeBatch } from "@/lib/anonymizer";
import { hybridMatchCandidateToJD, rankCandidates } from "@/lib/matcher";
import { detectBiasBefore, detectBiasAfter, generateBiasReport } from "@/lib/bias-engine";
import { ProcessBatchSchema } from "@/lib/validation";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limiter";
import { logger, createTimer } from "@/lib/logger";
import type {
  CandidateRawData,
  CandidateResult,
  SkillMatch,
} from "@/lib/types";

export const maxDuration = 60; // Vercel max: 60s for Pro, 10s for Hobby

// Valid statuses to start processing from
const PROCESSABLE_STATUSES = new Set(["CREATED", "UPLOADING", "FAILED"]);

export async function POST(request: NextRequest) {
  // Rate limit (IP-only initially — process is expensive)
  const ipRl = checkRateLimit(request, "process");
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    // [async-api-routes] Start auth + body parse in parallel
    const authPromise = verifyAuth(request);
    const bodyPromise = request.json();

    const user = await authPromise;
    const body = await bodyPromise;

    // User-based rate limit (stricter — AI pipeline is costly)
    const userRl = checkRateLimit(request, "process", user.uid);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const rlHeaders = rateLimitHeaders(
      userRl.remaining < ipRl.remaining ? userRl : ipRl
    );

    // Validate
    const { batchId } = ProcessBatchSchema.parse(body);

    // Verify batch
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return handleApiError(new Error("Batch not found"), "batch/process", rlHeaders);
    }
    verifyOwnership(batch.userId, user.uid);

    // ── Re-entry guard ──
    if (batch.status === "COMPLETE") {
      return handleApiError(new Error("Batch already processed"), "batch/process", rlHeaders);
    }

    if (!PROCESSABLE_STATUSES.has(batch.status)) {
      return handleApiError(
        new Error(`Batch is currently in "${batch.status}" state and cannot be reprocessed`),
        "batch/process",
        rlHeaders
      );
    }

    logger.info("Pipeline starting", { batchId, userId: user.uid });

    // [server-after-nonblocking] Schedule pipeline in after() — runs after response is sent
    after(async () => {
      try {
        await processInBackground(batchId, batch.jdText);
      } catch (err) {
        logger.error("Pipeline failed", {
          batchId,
          error: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined,
        });
        await updateBatchStatus(batchId, "FAILED", {
          error: err instanceof Error ? err.message : "Unknown pipeline error",
        }).catch(() => {}); // Don't throw in cleanup
      }
    });

    return apiSuccess(
      {
        message: "Processing started. Monitor status via GET /api/batch/{batchId}",
        batchId,
      },
      200,
      rlHeaders
    );
  } catch (err) {
    return handleApiError(err, "batch/process", rateLimitHeaders(ipRl));
  }
}

/**
 * Full 9-step pipeline executed in background.
 * Deterministic: same input → same output (seeded shuffle, temperature=0).
 */
async function processInBackground(batchId: string, jdText: string) {
  const timer = createTimer(`pipeline:${batchId}`);

  // ═══ Step 1: Extract JD requirements ═══
  await updateBatchStatus(batchId, "PARSING");
  const jdRequirements = await extractJDRequirements(jdText);
  await updateBatchJDRequirements(batchId, jdRequirements);
  timer.step("JD parsed");

  // ═══ Step 2: Download & parse resumes ═══
  const resumeDocs = await adminDb
    .collection("jobBatches")
    .doc(batchId)
    .collection("resumeFiles")
    .orderBy("uploadedAt", "asc") // Deterministic order — process in upload order
    .get();

  if (resumeDocs.empty) {
    await updateBatchStatus(batchId, "FAILED", {
      error: "No resume files found. Please upload resumes first.",
    });
    return;
  }

  // Resume deduplication cache — avoids re-parsing identical resumes
  const parseCache = new Map<string, CandidateRawData>();

  // Track per-candidate parse status for correct reporting
  interface ParseResult {
    candidate: CandidateRawData;
    parseStatus: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
    parseError?: string;
    fileName: string;
  }

  // [async-parallel] Parse all resumes in parallel instead of sequential
  const parseSettled = await Promise.allSettled(
    resumeDocs.docs.map(async (doc): Promise<ParseResult> => {
      const data = doc.data();
      const fileName = data.fileName || "unknown";

      // Guard: check contentBase64 exists
      if (!data.contentBase64) {
        return {
          candidate: createPlaceholderCandidate(fileName),
          parseStatus: "PARSE_FAILED",
          parseError: "File content is missing",
          fileName,
        };
      }

      const buffer = Buffer.from(data.contentBase64, "base64");

      // Guard: empty buffer
      if (buffer.length === 0) {
        return {
          candidate: createPlaceholderCandidate(fileName),
          parseStatus: "PARSE_FAILED",
          parseError: "File is empty",
          fileName,
        };
      }

      const extracted = await extractText(buffer, fileName);

      if (extracted.status === "PARSE_FAILED") {
        return {
          candidate: createPlaceholderCandidate(fileName),
          parseStatus: "PARSE_FAILED",
          parseError: extracted.error || "Failed to extract text from file",
          fileName,
        };
      }

      if (extracted.status === "NEEDS_OCR") {
        return {
          candidate: createPlaceholderCandidate(fileName),
          parseStatus: "NEEDS_OCR",
          parseError: extracted.error || "Scanned PDF detected — OCR required",
          fileName,
        };
      }

      // Log text quality for debugging
      if (extracted.quality < 50) {
        logger.warn("[Pipeline] Low quality text extraction", {
          fileName,
          quality: extracted.quality,
          textLength: extracted.text.length,
        });
      }

      // Check deduplication cache before calling Gemini
      const contentHash = hashResumeContent(extracted.text);
      const cached = parseCache.get(contentHash);
      if (cached) {
        logger.debug("Resume dedup hit", { fileName, hash: contentHash });
        return {
          candidate: { ...cached },
          parseStatus: "SUCCESS",
          fileName,
        };
      }

      try {
        const parsed = await parseResume(extracted.text);
        // Store in cache for deduplication
        parseCache.set(contentHash, parsed);
        return {
          candidate: parsed,
          parseStatus: "SUCCESS",
          fileName,
        };
      } catch (err) {
        return {
          candidate: createPlaceholderCandidate(fileName),
          parseStatus: "PARSE_FAILED",
          parseError: `AI parsing failed: ${err instanceof Error ? err.message : "Unknown"}`,
          fileName,
        };
      }
    })
  );

  // Collect results from settled promises
  const parseResults: ParseResult[] = [];

  for (const settled of parseSettled) {
    if (settled.status === "fulfilled") {
      parseResults.push(settled.value);
    } else {
      // Promise itself rejected (unexpected)
      parseResults.push({
        candidate: createPlaceholderCandidate("unknown"),
        parseStatus: "PARSE_FAILED",
        parseError: settled.reason instanceof Error ? settled.reason.message : "Unknown error",
        fileName: "unknown",
      });
    }
  }

  const successCount = parseResults.filter((r) => r.parseStatus === "SUCCESS").length;
  const errorCount = parseResults.filter((r) => r.parseStatus !== "SUCCESS").length;

  timer.step(`Resumes parsed (${successCount} ok, ${errorCount} errors)`);

  // All candidates go into pipeline (including failed ones with placeholder data)
  // This ensures batch results always contain entries for all uploaded files
  const candidates: CandidateRawData[] = parseResults.map((r) => r.candidate);

  if (candidates.length === 0) {
    await updateBatchStatus(batchId, "FAILED", {
      error: "No resumes could be parsed. Please check file formats.",
    });
    return;
  }

  // Log parse errors for debugging
  const parseErrors = parseResults.filter((r) => r.parseError);
  if (parseErrors.length > 0) {
    logger.warn("Resume parse errors", {
      batchId,
      errors: parseErrors.map((e) => ({ fileName: e.fileName, error: e.parseError })),
    });
  }

  // ═══ Step 3: Bias Detection BEFORE ═══
  await updateBatchStatus(batchId, "ANALYZING_BIAS_BEFORE");
  const biasBefore = detectBiasBefore(candidates);
  timer.step("Bias before analyzed");

  // ═══ Step 4: Anonymize (deterministic seeded shuffle) ═══
  await updateBatchStatus(batchId, "ANONYMIZING");
  // FIXED: Use batchId as seed for deterministic shuffle
  // Same batchId → same shuffle order → same output every run
  const { anonymized, indexMap } = anonymizeBatch(candidates, batchId);
  timer.step("Anonymized");

  // indexMap[shuffledPos] = originalPos in candidates array
  // This is the correct mapping — no broken index math

  // ═══ Step 5 & 6: Match + Rank (Hybrid: Keyword 70% + Semantic 30%) ═══
  await updateBatchStatus(batchId, "MATCHING");

  // [async-parallel] Run hybrid matching in parallel for all candidates
  const matchSettled = await Promise.allSettled(
    anonymized.map(async (anon) => {
      const { score, skillBreakdown, semanticBoost } = await hybridMatchCandidateToJD(anon, jdRequirements);
      return {
        candidateId: anon.candidateId,
        score,
        skillBreakdown,
        semanticBoost,
      };
    })
  );

  const matchResults = matchSettled.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    // Fallback: if hybrid matching fails, score 0
    logger.warn("Matching failed for candidate", { candidateId: anonymized[i].candidateId });
    return {
      candidateId: anonymized[i].candidateId,
      score: 0,
      skillBreakdown: [] as SkillMatch[],
      semanticBoost: 0,
    };
  });

  await updateBatchStatus(batchId, "RANKING");
  const ranked = rankCandidates(matchResults);
  timer.step("Hybrid matched & ranked");

  // ═══ Step 7: Generate explanations ═══
  await updateBatchStatus(batchId, "EXPLAINING");

  // Build O(1) lookup: candidateId → index in anonymized array
  const anonIndexMap = new Map<string, number>();
  for (let i = 0; i < anonymized.length; i++) {
    anonIndexMap.set(anonymized[i].candidateId, i);
  }

  // [async-parallel] Generate all explanations in parallel
  const explanationResults = await Promise.allSettled(
    ranked.map(async (rankedItem) => {
      const anonIdx = anonIndexMap.get(rankedItem.candidateId) ?? -1;
      if (anonIdx < 0) return `Scored ${rankedItem.score}% based on skill matching.`;

      const anon = anonymized[anonIdx];
      try {
        return await generateExplanation(
          anon.skills,
          jdRequirements,
          rankedItem.score,
          rankedItem.skillBreakdown
        );
      } catch {
        return `Scored ${rankedItem.score}% based on skill matching.`;
      }
    })
  );

  timer.step("Explanations generated");

  // ═══ Build final results with CORRECT candidate mapping ═══
  const results: Array<{
    rawData: CandidateRawData;
    anonymizedData: typeof anonymized[0];
    matchScore: number;
    semanticBoost?: number;
    skillBreakdown: SkillMatch[];
    explanation: string;
    rank: number;
    parseStatus: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
    parseError?: string;
  }> = ranked.map((rankedItem, i) => {
    // Get anonymized index from candidateId
    const anonIdx = anonIndexMap.get(rankedItem.candidateId) ?? 0;

    // FIXED: Use indexMap to get correct original candidate
    // indexMap[anonIdx] gives the original position in candidates array
    const originalIdx = indexMap[anonIdx];
    const original = candidates[originalIdx];
    const anon = anonymized[anonIdx];

    // Get correct parse status for this specific candidate
    const candidateParseResult = parseResults[originalIdx];

    const explResult = explanationResults[i];
    const explanation = explResult.status === "fulfilled"
      ? explResult.value
      : `Scored ${rankedItem.score}% based on skill matching.`;

    return {
      rawData: original,
      anonymizedData: anon,
      matchScore: rankedItem.score,
      semanticBoost: (rankedItem as { semanticBoost?: number }).semanticBoost || 0,
      skillBreakdown: rankedItem.skillBreakdown,
      explanation,
      rank: rankedItem.rank,
      parseStatus: candidateParseResult.parseStatus,
      ...(candidateParseResult.parseError ? { parseError: candidateParseResult.parseError } : {}),
    };
  });

  // ═══ Step 8: Save candidate results ═══
  await saveCandidateResults(batchId, results);
  timer.step("Results saved");

  // ═══ Step 9: Bias Detection AFTER + Comparison ═══
  await updateBatchStatus(batchId, "ANALYZING_BIAS_AFTER");

  const fullResults = results.map((r, i) => ({
    ...r,
    id: `candidate-${i}`,
    batchId,
  })) as CandidateResult[];

  const biasAfter = detectBiasAfter(candidates, fullResults);
  const biasReport = generateBiasReport(batchId, biasBefore, biasAfter);
  await saveBiasReport(biasReport);
  timer.step("Bias report saved");

  // ═══ Done ═══
  await updateBatchStatus(batchId, "COMPLETE");
  const totalMs = timer.done();

  logger.info("Pipeline complete", {
    batchId,
    candidates: candidates.length,
    successfulParses: successCount,
    failedParses: errorCount,
    totalMs,
    fairnessBefore: biasBefore.fairnessScore,
    fairnessAfter: biasAfter.fairnessScore,
  });
}

/**
 * Create a placeholder candidate for failed parses.
 * Allows tracking in results even when parsing fails.
 */
function createPlaceholderCandidate(fileName: string): CandidateRawData {
  return {
    name: fileName || "Unknown",
    college: "Unknown",
    location: "Unknown",
    skills: [],
    experienceYears: 0,
    experience: [],
    projects: [],
    education: [],
  };
}

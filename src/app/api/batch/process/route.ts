/* ═══════════════════════════════════════════════
   POST /api/batch/process
   Orchestrate the full 9-step pipeline
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
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger, createTimer } from "@/lib/logger";
import type {
  CandidateRawData,
  AnonymizedCandidate,
  CandidateResult,
  SkillMatch,
} from "@/lib/types";

export const maxDuration = 60; // Vercel max: 60s for Pro, 10s for Hobby

// Valid statuses to start processing from
const PROCESSABLE_STATUSES = new Set(["CREATED", "UPLOADING", "FAILED"]);

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitError = checkRateLimit(request, "process");
    if (rateLimitError) return rateLimitError;

    // [async-api-routes] Start auth + body parse in parallel
    const authPromise = verifyAuth(request);
    const bodyPromise = request.json();

    const user = await authPromise;
    const body = await bodyPromise;

    // Validate
    const { batchId } = ProcessBatchSchema.parse(body);

    // Verify batch
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return handleApiError(new Error("Batch not found"), "batch/process");
    }
    verifyOwnership(batch.userId, user.uid);

    // ── Re-entry guard ──
    if (batch.status === "COMPLETE") {
      return handleApiError(new Error("Batch already processed"), "batch/process");
    }

    if (!PROCESSABLE_STATUSES.has(batch.status)) {
      return handleApiError(
        new Error(`Batch is currently in "${batch.status}" state and cannot be reprocessed`),
        "batch/process"
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

    return apiSuccess({
      message: "Processing started. Monitor status via GET /api/batch/{batchId}",
      batchId,
    });
  } catch (err) {
    return handleApiError(err, "batch/process");
  }
}

/**
 * Full 9-step pipeline executed in background.
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
    .get();

  if (resumeDocs.empty) {
    await updateBatchStatus(batchId, "FAILED", {
      error: "No resume files found. Please upload resumes first.",
    });
    return;
  }

  // Fix 7: Resume deduplication cache — avoids re-parsing identical resumes
  const parseCache = new Map<string, CandidateRawData>();

  // [async-parallel] Parse all resumes in parallel instead of sequential
  const parseResults = await Promise.allSettled(
    resumeDocs.docs.map(async (doc) => {
      const data = doc.data();

      // Guard: check contentBase64 exists
      if (!data.contentBase64) {
        return {
          type: "error" as const,
          fileName: data.fileName || "unknown",
          error: "File content is missing",
          candidate: createPlaceholderCandidate(data.fileName),
        };
      }

      const buffer = Buffer.from(data.contentBase64, "base64");

      // Guard: empty buffer
      if (buffer.length === 0) {
        return {
          type: "error" as const,
          fileName: data.fileName || "unknown",
          error: "File is empty",
          candidate: createPlaceholderCandidate(data.fileName),
        };
      }

      const extracted = await extractText(buffer, data.fileName);

      if (extracted.status === "PARSE_FAILED" || extracted.status === "NEEDS_OCR") {
        return {
          type: "error" as const,
          fileName: data.fileName || "unknown",
          error: extracted.error || "Failed to extract text",
          candidate: createPlaceholderCandidate(data.fileName),
        };
      }

      // Fix 7: Check deduplication cache before calling Gemini
      const contentHash = hashResumeContent(extracted.text);
      const cached = parseCache.get(contentHash);
      if (cached) {
        logger.debug("Resume dedup hit", { fileName: data.fileName, hash: contentHash });
        return { type: "success" as const, candidate: { ...cached } };
      }

      try {
        const parsed = await parseResume(extracted.text);
        // Store in cache for deduplication
        parseCache.set(contentHash, parsed);
        return { type: "success" as const, candidate: parsed };
      } catch (err) {
        return {
          type: "error" as const,
          fileName: data.fileName || "unknown",
          error: `AI parsing failed: ${err instanceof Error ? err.message : "Unknown"}`,
          candidate: createPlaceholderCandidate(data.fileName),
        };
      }
    })
  );

  // [js-combine-iterations] Collect candidates + errors in single pass
  const candidates: CandidateRawData[] = [];
  const parseErrors: { fileName: string; error: string }[] = [];

  for (const result of parseResults) {
    if (result.status === "fulfilled") {
      candidates.push(result.value.candidate);
      if (result.value.type === "error") {
        parseErrors.push({
          fileName: result.value.fileName,
          error: result.value.error,
        });
      }
    } else {
      // Promise itself rejected (unexpected)
      parseErrors.push({
        fileName: "unknown",
        error: result.reason instanceof Error ? result.reason.message : "Unknown error",
      });
    }
  }

  timer.step(`Resumes parsed (${candidates.length} ok, ${parseErrors.length} errors)`);

  if (candidates.length === 0) {
    await updateBatchStatus(batchId, "FAILED", {
      error: "No resumes could be parsed. Please check file formats.",
    });
    return;
  }

  // Log parse errors for debugging
  if (parseErrors.length > 0) {
    logger.warn("Resume parse errors", { batchId, errors: parseErrors });
  }

  // ═══ Step 3: Bias Detection BEFORE ═══
  await updateBatchStatus(batchId, "ANALYZING_BIAS_BEFORE");
  const biasBefore = detectBiasBefore(candidates);
  timer.step("Bias before analyzed");

  // ═══ Step 4: Anonymize (with shuffle) ═══
  await updateBatchStatus(batchId, "ANONYMIZING");
  // Use anonymizeBatch which shuffles order to prevent position-based inference
  const anonymized: AnonymizedCandidate[] = anonymizeBatch(candidates);
  timer.step("Anonymized");

  // Build a map to trace anonymized back to original candidates
  // Since anonymizeBatch shuffles, we need to track the mapping
  // anonymizeBatch shuffles internally, so the order of anonymized != candidates
  // We need the original candidates array for bias-after analysis

  // ═══ Step 5 & 6: Match + Rank (Hybrid: Keyword 70% + Semantic 30%) ═══
  await updateBatchStatus(batchId, "MATCHING");

  // [async-parallel] Run hybrid matching in parallel for all candidates
  const matchSettled = await Promise.allSettled(
    anonymized.map(async (anon) => {
      const { score, skillBreakdown } = await hybridMatchCandidateToJD(anon, jdRequirements);
      return {
        candidateId: anon.candidateId,
        score,
        skillBreakdown,
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
    };
  });

  await updateBatchStatus(batchId, "RANKING");
  const ranked = rankCandidates(matchResults);
  timer.step("Hybrid matched & ranked");

  // ═══ Step 7: Generate explanations ═══
  await updateBatchStatus(batchId, "EXPLAINING");

  // [js-set-map-lookups] Build O(1) lookup map instead of findIndex per candidate
  const anonIndexMap = new Map<string, number>();
  for (let i = 0; i < anonymized.length; i++) {
    anonIndexMap.set(anonymized[i].candidateId, i);
  }

  // [js-set-map-lookups] Build error lookup Map for O(1) checks
  const parseErrorMap = new Map(parseErrors.map((e) => [e.fileName, e.error]));

  // [async-parallel] Generate all explanations in parallel
  const explanationResults = await Promise.allSettled(
    ranked.map(async (rankedItem) => {
      const idx = anonIndexMap.get(rankedItem.candidateId) ?? -1;
      if (idx < 0) return `Scored ${rankedItem.score}% based on skill matching.`;

      const anon = anonymized[idx];
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

  const results: Array<{
    rawData: CandidateRawData;
    anonymizedData: AnonymizedCandidate;
    matchScore: number;
    skillBreakdown: SkillMatch[];
    explanation: string;
    rank: number;
    parseStatus: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
    parseError?: string;
  }> = ranked.map((rankedItem, i) => {
    const idx = anonIndexMap.get(rankedItem.candidateId) ?? 0;
    // Use modular index to safely access candidates (shuffled order doesn't map 1:1)
    const originalIdx = Math.min(idx, candidates.length - 1);
    const original = candidates[originalIdx];
    const anon = anonymized[idx];
    const explResult = explanationResults[i];
    const explanation = explResult.status === "fulfilled"
      ? explResult.value
      : `Scored ${rankedItem.score}% based on skill matching.`;
    const parseError = parseErrorMap.get(original?.name || "");

    return {
      rawData: original,
      anonymizedData: anon,
      matchScore: rankedItem.score,
      skillBreakdown: rankedItem.skillBreakdown,
      explanation,
      rank: rankedItem.rank,
      parseStatus: parseError ? "PARSE_FAILED" as const : "SUCCESS" as const,
      ...(parseError ? { parseError } : {}),
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

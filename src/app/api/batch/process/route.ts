/* ═══════════════════════════════════════════════
   POST /api/batch/process
   Orchestrate the full 9-step pipeline
   ═══════════════════════════════════════════════ */

import { NextRequest, after } from "next/server";
import { verifyAuth, authErrorResponse, verifyOwnership } from "@/lib/auth";
import {
  getJobBatch,
  updateBatchStatus,
  updateBatchJDRequirements,
  saveCandidateResults,
  saveBiasReport,
} from "@/lib/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { extractText } from "@/lib/pdf-parser";
import { parseResume, extractJDRequirements, generateExplanation } from "@/lib/gemini";
import { anonymizeCandidate } from "@/lib/anonymizer";
import { matchCandidateToJD, rankCandidates } from "@/lib/matcher";
import { detectBiasBefore, detectBiasAfter, generateBiasReport } from "@/lib/bias-engine";
import type {
  CandidateRawData,
  AnonymizedCandidate,
  CandidateResult,
  SkillMatch,
} from "@/lib/types";

export const maxDuration = 60; // Vercel max: 60s for Pro, 10s for Hobby

export async function POST(request: NextRequest) {
  try {
    // [async-api-routes] Start auth + body parse in parallel
    const authPromise = verifyAuth(request);
    const bodyPromise = request.json();

    const user = await authPromise;
    const { batchId } = await bodyPromise;

    if (!batchId) {
      return Response.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Verify batch
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }
    verifyOwnership(batch.userId, user.uid);

    if (batch.status === "COMPLETE") {
      return Response.json({ error: "Batch already processed" }, { status: 400 });
    }

    // [server-after-nonblocking] Schedule pipeline in after() — runs after response is sent
    after(async () => {
      try {
        await processInBackground(batchId, batch.jdText);
      } catch (err) {
        console.error("Pipeline failed:", err);
        await updateBatchStatus(batchId, "FAILED", {
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    });

    return Response.json({
      message: "Processing started. Monitor status via GET /api/batch/{batchId}",
      batchId,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}

/**
 * Full 9-step pipeline executed in background.
 */
async function processInBackground(batchId: string, jdText: string) {
  // ═══ Step 1: Extract JD requirements ═══
  await updateBatchStatus(batchId, "PARSING");
  const jdRequirements = await extractJDRequirements(jdText);
  await updateBatchJDRequirements(batchId, jdRequirements);

  // ═══ Step 2: Download & parse resumes ═══
  const resumeDocs = await adminDb
    .collection("jobBatches")
    .doc(batchId)
    .collection("resumeFiles")
    .get();

  const candidates: CandidateRawData[] = [];
  const parseErrors: { fileName: string; error: string }[] = [];

  for (const doc of resumeDocs.docs) {
    const data = doc.data();
    try {
      const buffer = Buffer.from(data.contentBase64, "base64");
      const extracted = await extractText(buffer);

      if (extracted.status === "PARSE_FAILED" || extracted.status === "NEEDS_OCR") {
        parseErrors.push({
          fileName: data.fileName,
          error: extracted.error || "Failed to extract text",
        });
        // Create a placeholder candidate for tracking
        candidates.push({
          name: data.fileName,
          college: "Unknown",
          location: "Unknown",
          skills: [],
          experienceYears: 0,
          experience: [],
          projects: [],
          education: [],
        });
        continue;
      }

      // Parse with AI
      const parsed = await parseResume(extracted.text);
      candidates.push(parsed);
    } catch (err) {
      parseErrors.push({
        fileName: data.fileName,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  if (candidates.length === 0) {
    await updateBatchStatus(batchId, "FAILED", {
      error: "No resumes could be parsed. Please check file formats.",
    });
    return;
  }

  // ═══ Step 3: Bias Detection BEFORE ═══
  await updateBatchStatus(batchId, "ANALYZING_BIAS_BEFORE");
  const biasBefore = detectBiasBefore(candidates);

  // ═══ Step 4: Anonymize ═══
  await updateBatchStatus(batchId, "ANONYMIZING");
  const anonymized: AnonymizedCandidate[] = candidates.map((c, i) =>
    anonymizeCandidate(c, i)
  );

  // ═══ Step 5 & 6: Match + Rank ═══
  await updateBatchStatus(batchId, "MATCHING");
  const matchResults = anonymized.map((anon) => {
    const { score, skillBreakdown } = matchCandidateToJD(anon, jdRequirements);
    return {
      candidateId: anon.candidateId,
      score,
      skillBreakdown,
    };
  });

  await updateBatchStatus(batchId, "RANKING");
  const ranked = rankCandidates(matchResults);

  // ═══ Step 7: Generate explanations ═══
  await updateBatchStatus(batchId, "EXPLAINING");

  // [js-set-map-lookups] Build O(1) lookup map instead of findIndex per candidate
  const anonIndexMap = new Map<string, number>();
  for (let i = 0; i < anonymized.length; i++) {
    anonIndexMap.set(anonymized[i].candidateId, i);
  }

  // [js-set-map-lookups] Build error lookup Set for O(1) checks
  const parseErrorMap = new Map(parseErrors.map((e) => [e.fileName, e.error]));

  // [async-parallel] Generate all explanations in parallel (batched)
  const explanationResults = await Promise.allSettled(
    ranked.map(async (rankedItem) => {
      const idx = anonIndexMap.get(rankedItem.candidateId) ?? -1;
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
    const idx = anonIndexMap.get(rankedItem.candidateId) ?? -1;
    const original = candidates[idx];
    const anon = anonymized[idx];
    const explResult = explanationResults[i];
    const explanation = explResult.status === "fulfilled"
      ? explResult.value
      : `Scored ${rankedItem.score}% based on skill matching.`;
    const parseError = parseErrorMap.get(original.name);

    return {
      rawData: original,
      anonymizedData: anon,
      matchScore: rankedItem.score,
      skillBreakdown: rankedItem.skillBreakdown,
      explanation,
      rank: rankedItem.rank,
      parseStatus: parseError ? "PARSE_FAILED" as const : "SUCCESS" as const,
      parseError,
    };
  });

  // ═══ Step 8: Save candidate results ═══
  await saveCandidateResults(batchId, results);

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

  // ═══ Done ═══
  await updateBatchStatus(batchId, "COMPLETE");
}

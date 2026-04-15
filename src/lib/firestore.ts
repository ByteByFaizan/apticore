/* ═══════════════════════════════════════════════
   Firestore Helpers — Data Layer
   CRUD operations for batches, candidates, reports
   ═══════════════════════════════════════════════ */

import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "./logger";
import type {
  JobBatch,
  ProcessingStatus,
  CandidateResult,
  CandidateRawData,
  AnonymizedCandidate,
  JDRequirements,
  BiasReport,
  SkillMatch,
} from "./types";

// ── Constants ──
const MAX_BATCH_WRITES = 500; // Firestore limit per batch commit

/**
 * Recursively strip `undefined` values from an object.
 * Firestore rejects documents containing `undefined`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean = {} as Record<string, unknown>;
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      clean[key] = stripUndefined(val as Record<string, unknown>);
    } else if (Array.isArray(val)) {
      clean[key] = val.map((item) =>
        item !== null && typeof item === "object" && !Array.isArray(item)
          ? stripUndefined(item as Record<string, unknown>)
          : item
      );
    } else {
      clean[key] = val;
    }
  }
  return clean as T;
}

/**
 * Safely execute a Firestore query.
 * Returns null/empty on NOT_FOUND (database not created yet).
 * Prevents 500 errors when Firestore isn't initialized.
 */
async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    // gRPC code 5 = NOT_FOUND (database/index doesn't exist)
    // gRPC code 9 = FAILED_PRECONDITION (index not ready)
    const code = (err as { code?: number })?.code;
    if (code === 5 || code === 9) {
      logger.warn("Firestore not ready", {
        code,
        message: (err as Error)?.message,
      });
      return fallback;
    }
    throw err;
  }
}

// ── Job Batch Operations ──

export async function createJobBatch(
  userId: string,
  jdText: string,
  candidateCount: number
): Promise<string> {
  const ref = adminDb.collection("jobBatches").doc();
  const batch: Omit<JobBatch, "id"> = {
    userId,
    jdText,
    status: "CREATED",
    candidateCount,
    createdAt: new Date().toISOString(),
  };

  await ref.set(batch);
  logger.info("Job batch created", { batchId: ref.id, userId, candidateCount });
  return ref.id;
}

export async function updateBatchStatus(
  batchId: string,
  status: ProcessingStatus,
  extra?: Record<string, unknown>
): Promise<void> {
  const update: Record<string, unknown> = { status, ...extra };
  if (status === "COMPLETE") {
    update.completedAt = new Date().toISOString();
  }
  if (status === "FAILED" && extra?.error) {
    update.error = extra.error;
  }
  await adminDb.collection("jobBatches").doc(batchId).update(update);
  logger.debug("Batch status updated", { batchId, status });
}

export async function updateBatchJDRequirements(
  batchId: string,
  jdRequirements: JDRequirements
): Promise<void> {
  await adminDb.collection("jobBatches").doc(batchId).update({ jdRequirements });
}

export async function getJobBatch(batchId: string): Promise<JobBatch | null> {
  if (!batchId) return null;
  return safeQuery(async () => {
    const doc = await adminDb.collection("jobBatches").doc(batchId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as JobBatch;
  }, null);
}

export async function getUserBatches(userId: string): Promise<JobBatch[]> {
  return safeQuery(async () => {
    const snapshot = await adminDb
      .collection("jobBatches")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as JobBatch));
  }, []);
}

// ── Candidate Operations ──

/**
 * Save multiple candidate results.
 * Handles Firestore's 500-operation batch limit by chunking.
 */
export async function saveCandidateResults(
  batchId: string,
  results: Array<{
    rawData: CandidateRawData;
    anonymizedData: AnonymizedCandidate;
    matchScore: number;
    skillBreakdown: SkillMatch[];
    explanation: string;
    rank: number;
    parseStatus: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
    parseError?: string;
  }>
): Promise<void> {
  // Chunk results to stay under Firestore batch limit
  const chunks: typeof results[] = [];
  for (let i = 0; i < results.length; i += MAX_BATCH_WRITES) {
    chunks.push(results.slice(i, i + MAX_BATCH_WRITES));
  }

  // [async-parallel] Process chunks in parallel when small, sequential when many
  for (const chunk of chunks) {
    const batch = adminDb.batch();

    for (const result of chunk) {
      const ref = adminDb
        .collection("jobBatches")
        .doc(batchId)
        .collection("candidates")
        .doc();

      batch.set(ref, stripUndefined({
        batchId,
        ...result,
        createdAt: new Date().toISOString(),
      }));
    }

    await batch.commit();
  }

  logger.info("Candidate results saved", {
    batchId,
    count: results.length,
    chunks: chunks.length,
  });
}

export async function getCandidateResults(batchId: string): Promise<CandidateResult[]> {
  return safeQuery(async () => {
    const snapshot = await adminDb
      .collection("jobBatches")
      .doc(batchId)
      .collection("candidates")
      .orderBy("rank", "asc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CandidateResult));
  }, []);
}

// ── Bias Report Operations ──

export async function saveBiasReport(report: BiasReport): Promise<void> {
  // [async-parallel] Batch both writes into single atomic operation
  const writeBatch = adminDb.batch();

  const reportRef = adminDb
    .collection("jobBatches")
    .doc(report.batchId)
    .collection("biasReport")
    .doc("report");

  writeBatch.set(reportRef, report);

  // Also update batch with fairness scores for quick access
  const batchRef = adminDb.collection("jobBatches").doc(report.batchId);
  writeBatch.update(batchRef, {
    fairnessScoreBefore: report.before.fairnessScore,
    fairnessScoreAfter: report.after.fairnessScore,
  });

  await writeBatch.commit();
  logger.info("Bias report saved", {
    batchId: report.batchId,
    before: report.before.fairnessScore,
    after: report.after.fairnessScore,
  });
}

export async function getBiasReport(batchId: string): Promise<BiasReport | null> {
  return safeQuery(async () => {
    const doc = await adminDb
      .collection("jobBatches")
      .doc(batchId)
      .collection("biasReport")
      .doc("report")
      .get();

    if (!doc.exists) return null;
    return doc.data() as BiasReport;
  }, null);
}

// ── User Profile Operations ──

export async function createOrUpdateUserProfile(
  uid: string,
  data: { email: string; displayName?: string; company?: string; role?: string }
): Promise<void> {
  const docRef = adminDb.collection("users").doc(uid);
  const doc = await docRef.get();

  if (!doc.exists) {
    // First creation — set createdAt and initial batchCount
    await docRef.set({
      ...data,
      batchCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.info("User profile created", { uid, email: data.email });
  } else {
    // Update — only set updatedAt
    await docRef.set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}

export async function getUserProfile(uid: string) {
  return safeQuery(async () => {
    const doc = await adminDb.collection("users").doc(uid).get();
    if (!doc.exists) return null;
    return { uid: doc.id, ...doc.data() };
  }, null);
}

// ── Resume Storage Tracking ──

export async function saveResumeMetadata(
  batchId: string,
  files: { fileName: string; storagePath: string; size: number }[]
): Promise<void> {
  // Chunk if >500 files
  const chunks: typeof files[] = [];
  for (let i = 0; i < files.length; i += MAX_BATCH_WRITES) {
    chunks.push(files.slice(i, i + MAX_BATCH_WRITES));
  }

  for (const chunk of chunks) {
    const batch = adminDb.batch();

    for (const file of chunk) {
      const ref = adminDb
        .collection("jobBatches")
        .doc(batchId)
        .collection("resumes")
        .doc();

      batch.set(ref, {
        ...file,
        uploadedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
  }
}

export async function getResumeMetadata(
  batchId: string
): Promise<{ fileName: string; storagePath: string; size: number }[]> {
  const snapshot = await adminDb
    .collection("jobBatches")
    .doc(batchId)
    .collection("resumes")
    .get();

  return snapshot.docs.map((doc) => doc.data() as { fileName: string; storagePath: string; size: number });
}

// ── Batch Deletion (Cascading) ──

/**
 * Delete a job batch and ALL its subcollections.
 * Firestore doesn't auto-delete subcollections, so we do it manually.
 */
export async function deleteJobBatch(batchId: string): Promise<void> {
  const batchRef = adminDb.collection("jobBatches").doc(batchId);

  // Delete subcollections first
  const subcollections = ["candidates", "biasReport", "resumeFiles", "resumes"];

  for (const sub of subcollections) {
    const snapshot = await batchRef.collection(sub).get();

    if (snapshot.empty) continue;

    // Chunk deletes to respect 500-op limit
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += MAX_BATCH_WRITES) {
      const chunk = docs.slice(i, i + MAX_BATCH_WRITES);
      const deleteBatch = adminDb.batch();
      for (const doc of chunk) {
        deleteBatch.delete(doc.ref);
      }
      await deleteBatch.commit();
    }
  }

  // Delete the batch document itself
  await batchRef.delete();

  logger.info("Job batch deleted (cascade)", { batchId });
}

// ── Stats ──

export async function incrementUserBatchCount(userId: string): Promise<void> {
  await adminDb
    .collection("users")
    .doc(userId)
    .update({
      batchCount: FieldValue.increment(1),
    });
}

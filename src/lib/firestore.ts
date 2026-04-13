/* ═══════════════════════════════════════════════
   Firestore Helpers — Data Layer
   CRUD operations for batches, candidates, reports
   ═══════════════════════════════════════════════ */

import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
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
}

export async function updateBatchJDRequirements(
  batchId: string,
  jdRequirements: JDRequirements
): Promise<void> {
  await adminDb.collection("jobBatches").doc(batchId).update({ jdRequirements });
}

export async function getJobBatch(batchId: string): Promise<JobBatch | null> {
  const doc = await adminDb.collection("jobBatches").doc(batchId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as JobBatch;
}

export async function getUserBatches(userId: string): Promise<JobBatch[]> {
  const snapshot = await adminDb
    .collection("jobBatches")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as JobBatch));
}

// ── Candidate Operations ──

export async function saveCandidateResult(
  batchId: string,
  result: {
    rawData: CandidateRawData;
    anonymizedData: AnonymizedCandidate;
    matchScore: number;
    skillBreakdown: SkillMatch[];
    explanation: string;
    rank: number;
    parseStatus: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
    parseError?: string;
  }
): Promise<string> {
  const ref = adminDb
    .collection("jobBatches")
    .doc(batchId)
    .collection("candidates")
    .doc();

  await ref.set({
    batchId,
    ...result,
    createdAt: new Date().toISOString(),
  });

  return ref.id;
}

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
  const batch = adminDb.batch();

  for (const result of results) {
    const ref = adminDb
      .collection("jobBatches")
      .doc(batchId)
      .collection("candidates")
      .doc();

    batch.set(ref, {
      batchId,
      ...result,
      createdAt: new Date().toISOString(),
    });
  }

  await batch.commit();
}

export async function getCandidateResults(batchId: string): Promise<CandidateResult[]> {
  const snapshot = await adminDb
    .collection("jobBatches")
    .doc(batchId)
    .collection("candidates")
    .orderBy("rank", "asc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CandidateResult));
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
}

export async function getBiasReport(batchId: string): Promise<BiasReport | null> {
  const doc = await adminDb
    .collection("jobBatches")
    .doc(batchId)
    .collection("biasReport")
    .doc("report")
    .get();

  if (!doc.exists) return null;
  return doc.data() as BiasReport;
}

// ── User Profile Operations ──

export async function createOrUpdateUserProfile(
  uid: string,
  data: { email: string; displayName?: string }
): Promise<void> {
  await adminDb
    .collection("users")
    .doc(uid)
    .set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

export async function getUserProfile(uid: string) {
  const doc = await adminDb.collection("users").doc(uid).get();
  if (!doc.exists) return null;
  return { uid: doc.id, ...doc.data() };
}

// ── Resume Storage Tracking ──

export async function saveResumeMetadata(
  batchId: string,
  files: { fileName: string; storagePath: string; size: number }[]
): Promise<void> {
  const batch = adminDb.batch();

  for (const file of files) {
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

// ── Stats ──

export async function incrementUserBatchCount(userId: string): Promise<void> {
  await adminDb
    .collection("users")
    .doc(userId)
    .update({
      batchCount: FieldValue.increment(1),
    });
}

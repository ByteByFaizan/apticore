/* ═══════════════════════════════════════════════
   POST /api/batch/upload
   Upload individual resume files to a batch
   Stores in Firestore (base64) for hackathon simplicity
   ═══════════════════════════════════════════════ */

import { NextRequest, after } from "next/server";
import { verifyAuth, verifyOwnership } from "@/lib/auth";
import { getJobBatch, updateBatchStatus } from "@/lib/firestore";
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from "@/lib/pdf-parser";
import { adminDb } from "@/lib/firebase-admin";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitError = checkRateLimit(request, "upload");
    if (rateLimitError) return rateLimitError;

    const user = await verifyAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const batchId = formData.get("batchId") as string | null;

    // ── Validation ──
    if (!batchId || typeof batchId !== "string" || batchId.trim().length === 0) {
      return apiError("Batch ID is required", 400);
    }

    if (!file || !(file instanceof File)) {
      return apiError("No file provided", 400);
    }

    if (file.size === 0) {
      return apiError("File is empty", 400);
    }

    // Verify batch exists and belongs to user
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return apiError("Batch not found", 404);
    }
    verifyOwnership(batch.userId, user.uid);

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        413
      );
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt) {
      return apiError("Only PDF, DOCX, and TXT files are accepted", 415);
    }

    // ── Store file data in Firestore (base64) ──
    // For hackathon: store as base64 in Firestore to avoid GCS setup
    // Production: would use Firebase Storage / GCS signed URLs
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `batches/${batchId}/resumes/${Date.now()}-${file.name}`;

    // Check for existing files to prevent duplicate uploads
    const existingFiles = await adminDb
      .collection("jobBatches")
      .doc(batchId)
      .collection("resumeFiles")
      .where("fileName", "==", file.name)
      .limit(1)
      .get();

    if (!existingFiles.empty) {
      return apiError(
        `File "${file.name}" has already been uploaded to this batch`,
        409
      );
    }

    // Save file content as base64 in a separate collection
    await adminDb
      .collection("jobBatches")
      .doc(batchId)
      .collection("resumeFiles")
      .doc()
      .set({
        fileName: file.name,
        storagePath,
        size: file.size,
        contentBase64: buffer.toString("base64"),
        uploadedAt: new Date().toISOString(),
      });

    // [server-after-nonblocking] Update batch status after response sent
    after(() => updateBatchStatus(batchId, "UPLOADING").catch(() => {}));

    logger.info("File uploaded", { batchId, fileName: file.name, size: file.size });

    return apiSuccess({
      message: "File uploaded successfully",
      fileName: file.name,
      size: file.size,
    });
  } catch (err) {
    return handleApiError(err, "batch/upload");
  }
}

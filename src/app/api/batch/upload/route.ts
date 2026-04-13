/* ═══════════════════════════════════════════════
   POST /api/batch/upload
   Upload individual resume files to a batch
   Stores in Firebase Storage, records metadata in Firestore
   ═══════════════════════════════════════════════ */

import { NextRequest, after } from "next/server";
import { verifyAuth, authErrorResponse, verifyOwnership } from "@/lib/auth";
import { getJobBatch, updateBatchStatus } from "@/lib/firestore";
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from "@/lib/pdf-parser";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const batchId = formData.get("batchId") as string | null;

    // ── Validation ──
    if (!batchId) {
      return Response.json({ error: "Batch ID is required" }, { status: 400 });
    }

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Verify batch exists and belongs to user
    const batch = await getJobBatch(batchId);
    if (!batch) {
      return Response.json({ error: "Batch not found" }, { status: 404 });
    }
    verifyOwnership(batch.userId, user.uid);

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!hasValidExt) {
      return Response.json(
        { error: "Only PDF and DOCX files are accepted" },
        { status: 415 }
      );
    }

    // ── Store file data in Firestore (base64) ──
    // For hackathon: store as base64 in Firestore to avoid GCS setup
    // Production: would use Firebase Storage / GCS signed URLs
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `batches/${batchId}/resumes/${Date.now()}-${file.name}`;

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

    return Response.json({
      message: "File uploaded successfully",
      fileName: file.name,
      size: file.size,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}

/* ═══════════════════════════════════════════════
   Request Validation Schemas — Zod v4
   Validates all API request bodies
   ═══════════════════════════════════════════════ */

import { z } from "zod";

// ── Batch Creation ──
export const CreateBatchSchema = z.object({
  jdText: z
    .string({ error: "Job description text is required" })
    .min(50, "Job description must be at least 50 characters for accurate matching")
    .max(10000, "Job description must be under 10,000 characters"),
  fileCount: z
    .number({ error: "File count is required" })
    .int("File count must be a whole number")
    .min(1, "At least one resume file is required")
    .max(50, "Maximum 50 resumes per batch"),
});

export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;

// ── Batch Processing ──
export const ProcessBatchSchema = z.object({
  batchId: z
    .string({ error: "Batch ID is required" })
    .min(1, "Batch ID cannot be empty")
    .max(128, "Invalid batch ID"),
});

export type ProcessBatchInput = z.infer<typeof ProcessBatchSchema>;

// ── Batch Deletion ──
export const DeleteBatchSchema = z.object({
  batchId: z
    .string({ error: "Batch ID is required" })
    .min(1, "Batch ID cannot be empty")
    .max(128, "Invalid batch ID"),
});

export type DeleteBatchInput = z.infer<typeof DeleteBatchSchema>;

// ── User Profile Update ──
export const UpdateProfileSchema = z.object({
  displayName: z
    .string()
    .max(100, "Display name must be under 100 characters")
    .trim()
    .optional(),
  company: z
    .string()
    .max(100, "Company name must be under 100 characters")
    .trim()
    .optional(),
  role: z
    .string()
    .max(100, "Role must be under 100 characters")
    .trim()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

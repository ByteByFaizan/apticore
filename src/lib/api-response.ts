/* ═══════════════════════════════════════════════
   Standardized API Response Builder
   All API routes MUST use these helpers
   ═══════════════════════════════════════════════ */

import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { ZodError } from "zod";
import { logger } from "./logger";

/**
 * Standard API response envelope.
 * PRD requirement: { success, data, error }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Return a successful API response.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, error: null },
    { status }
  );
}

/**
 * Return an error API response.
 */
export function apiError(message: string, status = 500) {
  return NextResponse.json(
    { success: false as const, data: null, error: message },
    { status }
  );
}

/**
 * Centralized error handler — catches AuthError, ZodError, and generic errors.
 * Use in every API route catch block.
 */
export function handleApiError(error: unknown, context?: string) {
  // Auth errors (401/403)
  if (error instanceof AuthError) {
    logger.warn("Auth error", { context, message: error.message, status: error.statusCode });
    return apiError(error.message, error.statusCode);
  }

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    const messages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    logger.warn("Validation error", { context, errors: messages });
    return apiError(messages, 400);
  }

  // Generic errors
  const message = error instanceof Error ? error.message : "Internal server error";
  logger.error("Unhandled API error", { context, error: message });
  return apiError("Internal server error", 500);
}

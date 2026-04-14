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
 * Accepts optional extra headers (e.g. rate limit headers).
 */
export function apiSuccess<T>(
  data: T,
  status = 200,
  extraHeaders?: Record<string, string>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, error: null },
    { status, headers: extraHeaders }
  );
}

/**
 * Return an error API response.
 * Accepts optional extra headers (e.g. rate limit headers, Retry-After).
 */
export function apiError(
  message: string,
  status = 500,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(
    { success: false as const, data: null, error: message },
    { status, headers: extraHeaders }
  );
}

/**
 * Centralized error handler — catches AuthError, ZodError, and generic errors.
 * Use in every API route catch block.
 * Accepts optional extra headers to attach to error response.
 */
export function handleApiError(
  error: unknown,
  context?: string,
  extraHeaders?: Record<string, string>
) {
  // Auth errors (401/403)
  if (error instanceof AuthError) {
    logger.warn("Auth error", { context, message: error.message, status: error.statusCode });
    return apiError(error.message, error.statusCode, extraHeaders);
  }

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    const messages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    logger.warn("Validation error", { context, errors: messages });
    return apiError(messages, 400, extraHeaders);
  }

  // Generic errors
  const message = error instanceof Error ? error.message : "Internal server error";
  logger.error("Unhandled API error", { context, error: message });
  return apiError("Internal server error", 500, extraHeaders);
}

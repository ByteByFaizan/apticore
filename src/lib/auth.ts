/* ═══════════════════════════════════════════════
   Auth Middleware — Server-Side Token Verification
   Used in API routes to verify Firebase ID tokens
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

export interface AuthUser {
  uid: string;
  email: string;
  name?: string;
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns decoded user or throws with status code.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError(401, "Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);

  if (!token) {
    throw new AuthError(401, "Empty token");
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name,
    };
  } catch {
    throw new AuthError(401, "Invalid or expired token");
  }
}

/**
 * Verify batch ownership — ensure batch belongs to requesting user.
 */
export function verifyOwnership(batchUserId: string, requestingUid: string): void {
  if (batchUserId !== requestingUid) {
    throw new AuthError(403, "Access denied: batch belongs to another user");
  }
}

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Helper: create error response from AuthError
 */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

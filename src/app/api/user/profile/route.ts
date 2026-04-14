/* ═══════════════════════════════════════════════
   GET/PUT /api/user/profile
   User profile management
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUserProfile, createOrUpdateUserProfile } from "@/lib/firestore";
import { UpdateProfileSchema } from "@/lib/validation";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit, rateLimitHeaders, rateLimitResponse } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  // Rate limit (IP-only initially)
  const ipRl = checkRateLimit(request, "read");
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    const user = await verifyAuth(request);

    // User-based rate limit
    const userRl = checkRateLimit(request, "read", user.uid);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const rlHeaders = rateLimitHeaders(
      userRl.remaining < ipRl.remaining ? userRl : ipRl
    );

    const profile = await getUserProfile(user.uid);

    if (!profile) {
      // Auto-create profile on first access
      await createOrUpdateUserProfile(user.uid, {
        email: user.email,
        displayName: user.name,
      });

      return apiSuccess(
        {
          profile: {
            uid: user.uid,
            email: user.email,
            displayName: user.name,
            batchCount: 0,
            createdAt: new Date().toISOString(),
          },
        },
        200,
        rlHeaders
      );
    }

    return apiSuccess({ profile }, 200, rlHeaders);
  } catch (err) {
    return handleApiError(err, "user/profile GET", rateLimitHeaders(ipRl));
  }
}

export async function PUT(request: NextRequest) {
  // Rate limit (IP-only initially)
  const ipRl = checkRateLimit(request, "write");
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    // [async-api-routes] Start auth + body parse in parallel
    const [user, body] = await Promise.all([
      verifyAuth(request),
      request.json(),
    ]);

    // User-based rate limit
    const userRl = checkRateLimit(request, "write", user.uid);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const rlHeaders = rateLimitHeaders(
      userRl.remaining < ipRl.remaining ? userRl : ipRl
    );

    // Validate with Zod
    const validated = UpdateProfileSchema.parse(body);

    // Build update object from validated fields
    const updates: { email: string; displayName?: string; company?: string; role?: string } = {
      email: user.email,
    };

    if (validated.displayName !== undefined) updates.displayName = validated.displayName;
    if (validated.company !== undefined) updates.company = validated.company;
    if (validated.role !== undefined) updates.role = validated.role;

    await createOrUpdateUserProfile(user.uid, updates);
    const profile = await getUserProfile(user.uid);

    return apiSuccess({ profile }, 200, rlHeaders);
  } catch (err) {
    return handleApiError(err, "user/profile PUT", rateLimitHeaders(ipRl));
  }
}

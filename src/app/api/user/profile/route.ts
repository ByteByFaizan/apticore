/* ═══════════════════════════════════════════════
   GET/PUT /api/user/profile
   User profile management
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getUserProfile, createOrUpdateUserProfile } from "@/lib/firestore";
import { UpdateProfileSchema } from "@/lib/validation";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitError = checkRateLimit(request, "read");
    if (rateLimitError) return rateLimitError;

    const user = await verifyAuth(request);
    const profile = await getUserProfile(user.uid);

    if (!profile) {
      // Auto-create profile on first access
      await createOrUpdateUserProfile(user.uid, {
        email: user.email,
        displayName: user.name,
      });

      return apiSuccess({
        profile: {
          uid: user.uid,
          email: user.email,
          displayName: user.name,
          batchCount: 0,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return apiSuccess({ profile });
  } catch (err) {
    return handleApiError(err, "user/profile GET");
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitError = checkRateLimit(request, "write");
    if (rateLimitError) return rateLimitError;

    // [async-api-routes] Start auth + body parse in parallel
    const [user, body] = await Promise.all([
      verifyAuth(request),
      request.json(),
    ]);

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

    return apiSuccess({ profile });
  } catch (err) {
    return handleApiError(err, "user/profile PUT");
  }
}

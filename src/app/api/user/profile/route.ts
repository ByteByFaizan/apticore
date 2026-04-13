/* ═══════════════════════════════════════════════
   GET/PUT /api/user/profile
   User profile management
   ═══════════════════════════════════════════════ */

import { NextRequest } from "next/server";
import { verifyAuth, authErrorResponse } from "@/lib/auth";
import { getUserProfile, createOrUpdateUserProfile } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    const profile = await getUserProfile(user.uid);

    if (!profile) {
      // Auto-create profile on first access
      await createOrUpdateUserProfile(user.uid, {
        email: user.email,
        displayName: user.name,
      });

      return Response.json({
        profile: {
          uid: user.uid,
          email: user.email,
          displayName: user.name,
          batchCount: 0,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return Response.json({ profile });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // [async-api-routes] Start auth + body parse in parallel
    const [user, body] = await Promise.all([
      verifyAuth(request),
      request.json(),
    ]);

    // Only allow updating specific fields
    const allowedFields = ["displayName", "company", "role"];
    const updates: Record<string, string> = { email: user.email };

    for (const field of allowedFields) {
      if (body[field] && typeof body[field] === "string") {
        updates[field] = body[field].trim();
      }
    }

    await createOrUpdateUserProfile(user.uid, updates as { email: string; displayName?: string });
    const profile = await getUserProfile(user.uid);

    return Response.json({ profile });
  } catch (err) {
    return authErrorResponse(err);
  }
}

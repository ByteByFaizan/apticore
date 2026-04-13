/* ═══════════════════════════════════════════════
   GET /api/health
   Health check — no auth required
   ═══════════════════════════════════════════════ */

import { apiSuccess } from "@/lib/api-response";

export async function GET() {
  return apiSuccess({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
  });
}

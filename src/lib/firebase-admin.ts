/* ═══════════════════════════════════════════════
   Firebase Admin SDK — Server-Side Only
   Used in API routes for token verification + Firestore writes
   ═══════════════════════════════════════════════ */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // If service account credentials exist, use them
  if (clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } else {
    // Fallback: Application Default Credentials (local dev with gcloud CLI)
    // or just projectId for emulator
    adminApp = initializeApp({ projectId });
  }

  return adminApp;
}

// [advanced-init-once] Call getAdminApp() once, not twice
const app = getAdminApp();
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

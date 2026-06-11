import { Analytics, getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { app } from "./firebase";

let analyticsInstance: Analytics | null = null;

/**
 * Lazily initialise Firebase Analytics (client-side only).
 * Returns `null` when running on the server or in unsupported browsers.
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return analyticsInstance;

  // Guard: only runs in the browser and when the env supports analytics
  if (typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) return null;

  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

/**
 * Log a custom analytics event.
 * Safe to call anywhere — silently no-ops on the server.
 */
export async function logAnalyticsEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
) {
  const analytics = await getFirebaseAnalytics();
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
}

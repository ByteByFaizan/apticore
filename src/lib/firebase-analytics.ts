import { Analytics, getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { app } from "./firebase";

let analyticsInstance: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

/**
 * Lazily initialise Firebase Analytics (client-side only).
 * Returns `null` when running on the server or in unsupported browsers.
 * Deduplicates concurrent init calls via a shared promise.
 */
export function getFirebaseAnalytics(): Promise<Analytics | null> {
  // Fast path: already initialised
  if (analyticsInstance) return Promise.resolve(analyticsInstance);

  // Server guard
  if (typeof window === "undefined") return Promise.resolve(null);

  // Deduplicate: reuse in-flight init promise
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const supported = await isSupported();
        if (!supported) return null;

        analyticsInstance = getAnalytics(app);
        return analyticsInstance;
      } catch (err) {
        console.warn("[firebase-analytics] Init failed:", err);
        return null;
      }
    })();
  }

  return initPromise;
}

/**
 * Log a custom analytics event.
 * Safe to call anywhere — silently no-ops on the server or if init failed.
 */
export async function logAnalyticsEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
) {
  try {
    const analytics = await getFirebaseAnalytics();
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (err) {
    console.warn("[firebase-analytics] logEvent failed:", err);
  }
}

"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getFirebaseAnalytics, logAnalyticsEvent } from "@/lib/firebase-analytics";

/**
 * Inner component that does the actual tracking.
 * Separated so it can be wrapped in Suspense (required by useSearchParams in Next.js 15).
 */
function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // Initialise analytics once on mount
  useEffect(() => {
    getFirebaseAnalytics();
  }, []);

  // Log page_view on client-side navigations (skip initial — SDK handles it)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    logAnalyticsEvent("page_view", {
      page_path: pathname,
      page_search: searchParams.toString(),
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Wraps AnalyticsTracker in Suspense to satisfy Next.js 15's
 * requirement for useSearchParams.
 */
export default function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}

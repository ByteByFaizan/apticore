"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getFirebaseAnalytics, logAnalyticsEvent } from "@/lib/firebase-analytics";

/**
 * Initialises Firebase Analytics on mount and logs page_view
 * events on every route change. Renders nothing visible.
 */
export default function AnalyticsProvider() {
  const pathname = usePathname();

  // Initialise analytics on first client render
  useEffect(() => {
    getFirebaseAnalytics();
  }, []);

  // Log page_view on route changes
  useEffect(() => {
    logAnalyticsEvent("page_view", {
      page_path: pathname,
    });
  }, [pathname]);

  return null;
}

/* ═══════════════════════════════════════════════
   AuthProvider — Client-Side Auth State Manager
   Wraps app with Firebase auth listener
   ═══════════════════════════════════════════════ */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard"];
// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ["/login"];

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initAuth, user, loading, initialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);

  // Handle route protection
  useEffect(() => {
    if (!initialized || loading) return;

    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    if (isProtected) {
      if (!user || !user.emailVerified) {
        // Enforce email verification for dashboard
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }

    if (isAuthRoute) {
      if (user && user.emailVerified) {
        // Only auto-redirect verified users to dashboard
        router.push("/dashboard");
      }
    }
  }, [user, loading, initialized, pathname, router]);

  // Show nothing while checking auth for protected routes
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
          <p className="text-ink-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

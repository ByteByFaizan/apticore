/* ═══════════════════════════════════════════════
   Dashboard Layout — Top Nav + Auth Guard
   ═══════════════════════════════════════════════ */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useDashboardStore } from "@/lib/store";

const NAV_ITEMS = [
  { key: "overview" as const, label: "Overview" },
  { key: "candidates" as const, label: "Candidates" },
  { key: "bias-report" as const, label: "Bias Report" },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, initialized, initAuth, logout } = useAuthStore();
  const { selectedView, setView } = useDashboardStore();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);

  // Auth guard
  useEffect(() => {
    if (initialized && !loading && !user) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [user, loading, initialized, router]);

  // Close mobile nav on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 border-[2.5px] border-edge border-t-brand rounded-full animate-spin" />
            <div className="absolute inset-0 w-10 h-10 border-[2.5px] border-transparent border-b-accent/30 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          </div>
          <p className="text-ink-muted text-sm font-body">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const userInitial = (
    user.displayName?.[0] ||
    user.email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <div className="min-h-screen bg-surface font-body">
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-edge bg-white/85 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Brand + Mobile hamburger */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {mobileNavOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="15" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>

            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent flex items-center justify-center group-hover:shadow-[0_2px_12px_rgba(28,63,58,0.25)] transition-shadow duration-300">
                <span className="text-white text-xs font-extrabold">A</span>
              </div>
              <span className="text-brand text-lg font-[family-name:var(--font-lobster)] hidden sm:block">
                AptiCore
              </span>
            </Link>
          </div>

          {/* Center: Nav Links (desktop) */}
          <nav className="hidden sm:flex items-center gap-1 bg-surface-alt/60 rounded-full px-1 py-1 max-w-full overflow-x-auto scroll-snap-x">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`relative px-3 md:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap scroll-snap-item ${
                  selectedView === item.key
                    ? "bg-white text-brand shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: User */}
          <div className="flex items-center gap-3">
            {/* User info (desktop) */}
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-ink leading-tight">
                {user.displayName || "Recruiter"}
              </p>
              <p className="text-[11px] text-ink-muted">{user.email}</p>
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center text-white text-xs font-bold">
              {userInitial}
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="text-xs text-ink-muted hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer hidden sm:block"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── Mobile Nav Dropdown ── */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-t border-edge/50 ${
            mobileNavOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 py-3 space-y-1 bg-white">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setView(item.key);
                  setMobileNavOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                  selectedView === item.key
                    ? "bg-brand/5 text-brand"
                    : "text-ink-muted hover:text-ink hover:bg-surface-alt"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-edge/50 mt-2">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

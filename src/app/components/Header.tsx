"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";

const navLinks = [
  { label: "How it works", href: "/#how-it-works", sectionId: "how-it-works" },
  { label: "Features", href: "/#features", sectionId: "features" },
  { label: "Impact", href: "/#impact", sectionId: "impact" },
  { label: "About", href: "/about", sectionId: "" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const { user, initialized, initAuth, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, [initAuth]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    if (pathname !== "/") return;
    const sectionIds = ["how-it-works", "features", "impact"];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    router.push("/");
  };

  const isLinkActive = useCallback(
    (link: (typeof navLinks)[0]) => {
      if (link.sectionId && pathname === "/") {
        return activeSection === link.sectionId;
      }
      if (link.href === "/about") {
        return pathname === "/about";
      }
      return false;
    },
    [activeSection, pathname]
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full pt-3 sm:pt-4 pb-2">
        {/* Full-width line through middle of navbar */}
        {!scrolled && (
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-brand/[0.06] transition-opacity duration-300" />
        )}

        <div className="relative max-w-[1100px] mx-auto px-3 sm:px-4">
          <nav
            className={`flex items-center justify-between rounded-full border header-sticky px-4 sm:px-6 py-2 sm:py-2.5 ${
              scrolled
                ? "border-brand/6 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
                : "border-brand/8 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            }`}
          >
            {/* Left: Brand + nav links */}
            <div className="flex items-center gap-4 lg:gap-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 sm:gap-2.5 text-brand font-bold text-lg sm:text-xl tracking-tight select-none font-display"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand to-accent flex items-center justify-center shadow-[0_2px_8px_rgba(91,160,143,0.25)]">
                  <span className="text-white text-[10px] sm:text-xs font-extrabold">
                    A
                  </span>
                </div>
                <span className="font-[family-name:var(--font-lobster)] text-xl sm:text-2xl">
                  AptiCore
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-4 lg:gap-6">
                {navLinks.map((link) => {
                  const active = isLinkActive(link);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative text-sm font-medium transition-colors py-1 ${
                        active
                          ? "text-brand"
                          : "text-brand/70 hover:text-brand"
                      }`}
                    >
                      {link.label}
                      {/* Active indicator dot */}
                      <span
                        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent transition-all duration-300 ${
                          active
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-0"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Auth buttons (desktop) */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link
                href="/dashboard"
                className="rounded-full bg-brand px-4 lg:px-5 py-1.5 text-sm font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-brand-dark transition-all"
              >
                Dashboard
              </Link>
              {initialized && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-brand/10 bg-white pl-2 pr-4 py-1.5 text-sm font-medium text-brand shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-brand/[0.03] hover:shadow-[0_1px_4px_rgba(0,0,0,0.07)] transition-all"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand text-white text-xs font-semibold">
                      {user.displayName
                        ? user.displayName.charAt(0).toUpperCase()
                        : user.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                    <span className="max-w-[120px] truncate">
                      {user.displayName || user.email?.split("@")[0] || "User"}
                    </span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-edge-light bg-white shadow-lg py-1 z-50 animate-fade-in-up">
                      <div className="px-4 py-2 border-b border-edge-light">
                        <p className="text-sm font-medium text-ink truncate">
                          {user.displayName ||
                            user.email?.split("@")[0] ||
                            "User"}
                        </p>
                        <p className="text-xs text-ink-muted truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-ink-light bg-transparent hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-alt group-hover:bg-red-100 transition-colors duration-200">
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-70 group-hover:opacity-100 transition-opacity"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                        </span>
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-brand/10 bg-white px-5 py-1.5 text-sm font-medium text-brand shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-brand/[0.03] hover:shadow-[0_1px_4px_rgba(0,0,0,0.07)] transition-all"
                >
                  Log in
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-brand hover:bg-brand/5 md:hidden transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ── */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[80%] max-w-[320px] md:hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "linear-gradient(160deg, #1C3F3A 0%, #0F2924 100%)",
        }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 border-b border-white/[0.07]">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center gap-2.5 text-white font-bold text-lg tracking-tight font-display"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/25">
              <span className="text-white text-xs font-extrabold">A</span>
            </div>
            <span className="font-[family-name:var(--font-lobster)] text-xl">
              AptiCore
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-9 h-9 rounded-full bg-white/[0.07] hover:bg-white/[0.13] flex items-center justify-center text-white/70 hover:text-white transition-all"
            aria-label="Close menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 sm:py-5 flex flex-col gap-1">
          {navLinks.map((link, i) => {
            const active = isLinkActive(link);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "text-white bg-white/[0.1]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.07]"
                }`}
                style={{
                  opacity: mobileOpen ? 1 : 0,
                  transform: mobileOpen ? "translateX(0)" : "translateX(16px)",
                  transition: `opacity 0.35s ease ${0.05 + i * 0.05}s, transform 0.4s cubic-bezier(0.16,1,0.3,1) ${0.05 + i * 0.05}s, background 0.2s, color 0.2s`,
                }}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                    active ? "bg-accent" : "bg-accent/60"
                  }`}
                />
                {link.label}
              </Link>
            );
          })}

          <div className="my-3 h-px bg-white/[0.07] mx-2" />

          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 mx-2 px-4 py-3 rounded-xl bg-white/[0.08] border border-white/[0.08] text-[15px] font-semibold text-white hover:bg-white/[0.13] transition-all duration-200 active:scale-[0.98]"
            style={{
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? "translateX(0)" : "translateX(16px)",
              transition: `opacity 0.35s ease 0.25s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.25s, background 0.2s`,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </Link>
        </nav>

        {/* Bottom: Auth */}
        <div className="px-4 pb-6 sm:pb-8 pt-3 border-t border-white/[0.07] safe-bottom">
          {initialized && user ? (
            <div
              style={{
                opacity: mobileOpen ? 1 : 0,
                transition: "opacity 0.35s ease 0.3s",
              }}
            >
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/[0.05]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user.displayName
                    ? user.displayName.charAt(0).toUpperCase()
                    : user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-white/90 text-sm font-semibold truncate">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-white/40 text-[11px] truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="group flex w-full items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-white/60 hover:text-[#ef4444] hover:bg-[#ef4444]/[0.08] transition-all duration-200 active:scale-[0.98] overflow-hidden"
              >
                <span className="relative overflow-hidden flex items-center justify-center">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-dark text-white text-[15px] font-semibold shadow-lg shadow-accent/25 hover:opacity-90 transition-all active:scale-[0.98]"
              style={{
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? "translateY(0)" : "translateY(8px)",
                transition:
                  "opacity 0.35s ease 0.3s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.3s",
              }}
            >
              Log in to AptiCore
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

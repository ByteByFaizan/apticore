"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/* ── Password strength rules ── */
const PASSWORD_RULES = [
  { key: "length",  label: "8+ characters",       test: (p: string) => p.length >= 8 },
  { key: "upper",   label: "Uppercase letter",     test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower",   label: "Lowercase letter",     test: (p: string) => /[a-z]/.test(p) },
  { key: "number",  label: "Number",               test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "Special character (!@#$...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

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

  // Change password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpSuccess, setCpSuccess] = useState(false);
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);

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

  /* ── Change password logic ── */
  const isPasswordProvider = user?.providerData?.some(
    (p) => p.providerId === "password"
  );

  const openChangePw = () => {
    setCpCurrent("");
    setCpNew("");
    setCpConfirm("");
    setCpError(null);
    setCpSuccess(false);
    setCpShowCurrent(false);
    setCpShowNew(false);
    setDropdownOpen(false);
    setMobileOpen(false);
    setShowChangePw(true);
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError(null);

    const failing = PASSWORD_RULES.filter((r) => !r.test(cpNew));
    if (failing.length > 0) {
      setCpError(`Password must include: ${failing.map((r) => r.label).join(", ")}`);
      return;
    }
    if (cpNew !== cpConfirm) {
      setCpError("New passwords do not match.");
      return;
    }
    if (cpCurrent === cpNew) {
      setCpError("New password must differ from current password.");
      return;
    }

    setCpLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) throw new Error("No user");
      const cred = EmailAuthProvider.credential(firebaseUser.email, cpCurrent);
      await reauthenticateWithCredential(firebaseUser, cred);
      await updatePassword(firebaseUser, cpNew);
      setCpSuccess(true);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err) {
        const code = (err as { code: string }).code;
        if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
          setCpError("Current password is incorrect.");
        } else if (code === "auth/too-many-requests") {
          setCpError("Too many attempts. Try again later.");
        } else {
          setCpError("Something went wrong. Please try again.");
        }
      } else {
        setCpError("Something went wrong. Please try again.");
      }
    } finally {
      setCpLoading(false);
    }
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
                <img
                  src="/logo.png"
                  alt="AptiCore logo"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shadow-[0_2px_8px_rgba(91,160,143,0.25)]"
                />
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
                      {/* Change password */}
                      {isPasswordProvider && (
                        <button
                          onClick={openChangePw}
                          className="group flex w-full items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-ink-light bg-transparent hover:bg-brand/[0.04] hover:text-brand transition-all duration-200"
                        >
                          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-alt group-hover:bg-brand/10 transition-colors duration-200">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity">
                              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </span>
                          Change password
                        </button>
                      )}
                      {/* Log out */}
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
        onClick={(e) => e.stopPropagation()}
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
            <img
              src="/logo.png"
              alt="AptiCore logo"
              className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-accent/25"
            />
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
        <nav className="overflow-y-auto px-4 py-4 sm:py-5 flex flex-col gap-1">
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
        <div className="px-4 pb-6 sm:pb-8 pt-4 mt-4 border-t border-white/[0.07] safe-bottom">
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
              {/* Change password (mobile) */}
              {isPasswordProvider && (
                <button
                  onClick={openChangePw}
                  className="group flex w-full items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-white/60 hover:text-white hover:bg-white/[0.07] transition-all duration-200 active:scale-[0.98]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Change password
                </button>
              )}
              {/* Log out */}
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
      {/* ══════════ Change Password Modal ══════════ */}
      {showChangePw && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => !cpLoading && setShowChangePw(false)}
          />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8"
            style={{ animation: "login-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {/* Close */}
            <button
              onClick={() => !cpLoading && setShowChangePw(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-surface-alt flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Icon */}
            <div className="w-14 h-14 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h3 className="text-xl font-display font-bold text-ink text-center mb-1">Change password</h3>
            <p className="text-ink-muted text-sm text-center mb-6">Enter your current password then choose a new one</p>

            {cpError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{cpError}</div>
            )}

            {cpSuccess ? (
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-ink font-medium mb-1">Password updated!</p>
                <p className="text-ink-muted text-sm mb-6">Your password has been changed successfully.</p>
                <button onClick={() => setShowChangePw(false)} className="w-full rounded-full bg-brand py-3 text-sm font-medium text-white hover:bg-brand-dark transition-colors cursor-pointer">Done</button>
              </div>
            ) : (
              <form onSubmit={handleChangePw} className="space-y-4">
                {/* Current password */}
                <div>
                  <label htmlFor="cp-current" className="block text-[13px] font-medium text-brand/70 mb-1.5">Current password</label>
                  <div className="relative">
                    <input id="cp-current" type={cpShowCurrent ? "text" : "password"} value={cpCurrent} onChange={(e) => setCpCurrent(e.target.value)} required className="w-full rounded-xl border border-brand/[0.08] bg-white py-3 pl-4 pr-11 text-[15px] text-ink placeholder:text-brand/40 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_rgba(91,160,143,0.08)] transition-all duration-300" placeholder="••••••••" />
                    <button type="button" onClick={() => setCpShowCurrent(!cpShowCurrent)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-brand/30 hover:text-brand/50 transition-colors cursor-pointer" tabIndex={-1}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {cpShowCurrent ? (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>)}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label htmlFor="cp-new" className="block text-[13px] font-medium text-brand/70 mb-1.5">New password</label>
                  <div className="relative">
                    <input id="cp-new" type={cpShowNew ? "text" : "password"} value={cpNew} onChange={(e) => setCpNew(e.target.value)} required minLength={8} className="w-full rounded-xl border border-brand/[0.08] bg-white py-3 pl-4 pr-11 text-[15px] text-ink placeholder:text-brand/40 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_rgba(91,160,143,0.08)] transition-all duration-300" placeholder="Letters, numbers & symbols" />
                    <button type="button" onClick={() => setCpShowNew(!cpShowNew)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-brand/30 hover:text-brand/50 transition-colors cursor-pointer" tabIndex={-1}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {cpShowNew ? (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>)}
                      </svg>
                    </button>
                  </div>
                  {cpNew.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {PASSWORD_RULES.map((rule) => (<div key={rule.key} className={`h-1 flex-1 rounded-full transition-all duration-300 ${rule.test(cpNew) ? "bg-emerald" : "bg-brand/[0.08]"}`} />))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {PASSWORD_RULES.map((rule) => { const pass = rule.test(cpNew); return (<span key={rule.key} className={`text-[11px] transition-colors duration-200 ${pass ? "text-emerald" : "text-ink-faint"}`}>{pass ? "✓" : "○"} {rule.label}</span>); })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label htmlFor="cp-confirm" className="block text-[13px] font-medium text-brand/70 mb-1.5">Confirm new password</label>
                  <input id="cp-confirm" type="password" value={cpConfirm} onChange={(e) => setCpConfirm(e.target.value)} required minLength={8} className={`w-full rounded-xl border bg-white py-3 px-4 text-[15px] text-ink placeholder:text-brand/40 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_rgba(91,160,143,0.08)] transition-all duration-300 ${cpConfirm.length > 0 && cpConfirm !== cpNew ? "border-red-300" : cpConfirm.length > 0 && cpConfirm === cpNew ? "border-emerald/30" : "border-brand/[0.08]"}`} placeholder="Re-enter new password" />
                  {cpConfirm.length > 0 && cpConfirm !== cpNew && (<p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>)}
                </div>

                {/* Submit */}
                <button type="submit" disabled={cpLoading} className="w-full rounded-full bg-brand py-3 text-[15px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(28,63,58,0.15)] hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer relative">
                  <span className={cpLoading ? "opacity-0" : ""}>Update password</span>
                  {cpLoading && (<div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>)}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

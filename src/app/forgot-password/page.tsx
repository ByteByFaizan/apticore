"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

/* ═══════════════════════════════════════════════
   Firebase error → human-readable messages
   ═══════════════════════════════════════════════ */
const FIREBASE_ERRORS: Record<string, string> = {
  "auth/user-not-found": "No account found with this email. Check for typos.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Connection failed. Check your internet and try again.",
};

function getFirebaseError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    return FIREBASE_ERRORS[code] || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [formTilt, setFormTilt] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  /* ── Dynamic page title ── */
  useEffect(() => {
    document.title = "Reset Password — AptiCore";
  }, []);

  /* ── Mouse parallax for left panel ── */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!leftPanelRef.current) return;
    const rect = leftPanelRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  }, []);

  /* ── 3D tilt for form card ── */
  const handleFormMouseMove = useCallback((e: React.MouseEvent) => {
    if (!formRef.current) return;
    const rect = formRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setFormTilt({ x: y * -4, y: x * 4 });
  }, []);

  const handleFormMouseLeave = useCallback(() => {
    setFormTilt({ x: 0, y: 0 });
  }, []);

  /* ── Send reset email via Firebase ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(getFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Stagger helper ── */
  const stagger = (index: number, base = 0) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
    transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${base + index * 0.07}s, transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${base + index * 0.07}s`,
  });

  /* ── Floating particles (memoized) ── */
  const particles = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 12,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.25 + 0.05,
      })),
    []
  );

  return (
    <div className="min-h-screen flex bg-surface overflow-hidden">
      {/* ════════════════════════ LEFT PANEL ════════════════════════ */}
      <div
        ref={leftPanelRef}
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Animated gradient base */}
        <div className="absolute inset-0 login-gradient-shift" />

        {/* Decorative elements w/ parallax */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Morphing blob — top-right */}
          <div
            className="absolute -top-24 -right-24"
            style={{
              opacity: mounted ? 1 : 0,
              transform: `translate(${mousePos.x * -25}px, ${mousePos.y * -18}px) scale(${mounted ? 1 : 0.4})`,
              transition: mounted
                ? "opacity 1.2s ease-out, transform 0.15s linear"
                : "opacity 1.2s ease-out 0.3s, transform 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s",
            }}
          >
            <div className="w-[500px] h-[500px] login-morph-blob border border-white/[0.06]" />
          </div>

          {/* Morphing blob — center-left */}
          <div
            className="absolute top-1/3 -left-16"
            style={{
              opacity: mounted ? 1 : 0,
              transform: `translate(${mousePos.x * 35}px, ${mousePos.y * 28}px) scale(${mounted ? 1 : 0.3})`,
              transition: mounted
                ? "opacity 1.2s ease-out, transform 0.2s linear"
                : "opacity 1.2s ease-out 0.5s, transform 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s",
            }}
          >
            <div className="w-[350px] h-[350px] login-morph-blob-alt bg-white/[0.025]" />
          </div>

          {/* Rotating ring — bottom-right */}
          <div
            className="absolute bottom-20 right-20"
            style={{
              opacity: mounted ? 1 : 0,
              transform: `translate(${mousePos.x * -45}px, ${mousePos.y * -38}px) scale(${mounted ? 1 : 0})`,
              transition: mounted
                ? "opacity 1.2s ease-out, transform 0.25s linear"
                : "opacity 1.2s ease-out 0.7s, transform 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s",
            }}
          >
            <div className="w-[180px] h-[180px] rounded-full border border-white/[0.05] login-spin-slow" />
          </div>

          {/* Tiny accent ring */}
          <div
            className="absolute top-[55%] right-[15%]"
            style={{
              opacity: mounted ? 0.6 : 0,
              transform: `translate(${mousePos.x * -55}px, ${mousePos.y * -40}px) scale(${mounted ? 1 : 0})`,
              transition: mounted
                ? "opacity 1s ease-out, transform 0.2s linear"
                : "opacity 1s ease-out 0.9s, transform 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s",
            }}
          >
            <div className="w-[60px] h-[60px] rounded-full border border-accent/[0.12] login-spin-slow-reverse" />
          </div>

          {/* Floating particles */}
          {mounted &&
            particles.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full bg-white login-particle"
                style={{
                  width: p.size,
                  height: p.size,
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  opacity: p.opacity,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}

          {/* Diagonal line pattern */}
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              opacity: mounted ? 0.03 : 0,
              transition: "opacity 2s ease-out 0.6s",
            }}
          >
            <defs>
              <pattern
                id="diag-fp"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(35)"
              >
                <line x1="0" y1="0" x2="0" y2="60" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag-fp)" />
          </svg>

          {/* Noise grain */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Primary orb w/ parallax */}
          <div
            className="absolute top-[38%] left-[42%] w-[320px] h-[320px] rounded-full bg-accent/[0.08] blur-[100px]"
            style={{
              opacity: mounted ? 1 : 0,
              transform: `translate(${mousePos.x * 50}px, ${mousePos.y * 40}px)`,
              transition: mounted
                ? "opacity 1.5s ease-out 0.4s, transform 0.3s ease-out"
                : "opacity 1.5s ease-out 0.4s",
              animation: mounted ? "login-orb-pulse 6s ease-in-out 1.5s infinite" : "none",
            }}
          />

          {/* Secondary accent orb */}
          <div
            className="absolute bottom-[18%] left-[18%] w-[220px] h-[220px] rounded-full bg-accent/[0.05] blur-[80px]"
            style={{
              opacity: mounted ? 1 : 0,
              transform: `translate(${mousePos.x * -35}px, ${mousePos.y * -28}px)`,
              transition: "opacity 1.8s ease-out 0.7s, transform 0.35s ease-out",
              animation: mounted ? "login-orb-pulse 8s ease-in-out 2.2s infinite reverse" : "none",
            }}
          />
        </div>

        {/* Content layer */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top: Brand */}
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted
                ? "translateX(0) translateY(0) scale(1)"
                : "translateX(-24px) translateY(-12px) scale(0.92)",
              transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s",
            }}
          >
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.08] flex items-center justify-center backdrop-blur-sm group-hover:bg-white/[0.15] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <span className="text-white text-xs font-extrabold">A</span>
              </div>
              <span className="text-white/90 text-xl font-[family-name:var(--font-lobster)]">
                AptiCore
              </span>
            </Link>
          </div>

          {/* Center: Tagline */}
          <div className="max-w-md">
            <h1 className="text-white/90 text-4xl xl:text-[2.75rem] leading-[1.15] tracking-tight mb-6 font-display font-bold">
              <span className="inline-block" style={stagger(0, 0.3)}>
                Don&apos;t worry,
              </span>
              <br />
              <span className="inline-block" style={stagger(1, 0.3)}>
                we&apos;ll help you
              </span>
              <br />
              <span
                className="inline-block login-accent-shimmer"
                style={{
                  ...stagger(2, 0.3),
                }}
              >
                get back in.
              </span>
            </h1>
            <p
              className="text-white/55 text-[15px] leading-relaxed max-w-sm"
              style={stagger(3, 0.3)}
            >
              Enter your email and we&apos;ll send you a secure link to reset your password.
            </p>

            {/* SDG Badge — judges look for UN SDG tie-ins (PRD §0) */}
            <div
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm px-4 py-2"
              style={stagger(4, 0.3)}
            >
              <span className="text-accent text-xs">🎯</span>
              <span className="text-white/50 text-[12px] font-medium tracking-wide">
                Supporting UN SDG 5, 8 & 10
              </span>
            </div>
          </div>

          {/* Spacer */}
          <div />
        </div>
      </div>

      {/* ════════════════════════ RIGHT PANEL (FORM) ════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div
          ref={formRef}
          className="w-full max-w-[420px]"
          onMouseMove={handleFormMouseMove}
          onMouseLeave={handleFormMouseLeave}
          style={{
            transform: `perspective(1200px) rotateX(${formTilt.x}deg) rotateY(${formTilt.y}deg)`,
            transition: "transform 0.15s ease-out",
          }}
        >
          {/* Mobile brand */}
          <div className="lg:hidden mb-10" style={stagger(0, 0.1)}>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent flex items-center justify-center">
                <span className="text-white text-xs font-extrabold">A</span>
              </div>
              <span className="text-brand text-lg font-[family-name:var(--font-lobster)]">
                AptiCore
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8" style={stagger(0, 0.15)}>
            <h2 className="text-ink text-[28px] tracking-tight mb-2 font-display font-bold">
              Reset your password
            </h2>
            <p className="text-ink-muted text-[15px]" style={stagger(1, 0.15)}>
              {sent
                ? "We've sent you an email with a reset link"
                : "Enter the email linked to your account"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              style={{ animation: "login-fade-in 0.3s ease-out" }}
            >
              {error}
            </div>
          )}

          {/* Success state */}
          {sent ? (
            <div style={stagger(2, 0.15)}>
              {/* Email sent illustration */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-brand/[0.06] flex items-center justify-center">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-brand opacity-70"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  {/* Animated checkmark */}
                  <div
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald flex items-center justify-center shadow-lg"
                    style={{ animation: "login-fade-in-scale 0.4s ease-out 0.3s both" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <p className="text-ink-muted text-sm leading-relaxed max-w-xs mx-auto">
                  Check your inbox at{" "}
                  <span className="font-medium text-ink">{email}</span>{" "}
                  for a password reset link. It may take a minute to arrive.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="w-full rounded-full border border-brand/[0.08] bg-white py-3 text-[15px] font-medium text-brand/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-brand/[0.15] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  Try a different email
                </button>
                <Link
                  href="/login"
                  className="block w-full text-center rounded-full bg-brand py-3 text-[15px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(28,63,58,0.15)] hover:bg-brand-dark hover:shadow-[0_4px_12px_rgba(0,0,0,0.2),0_12px_32px_rgba(28,63,58,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div style={stagger(2, 0.15)}>
                  <label
                    htmlFor="fp-email"
                    className="block text-[13px] font-medium text-brand/70 mb-1.5"
                  >
                    Work email
                  </label>
                  <div
                    className={`relative login-input-wrap ${focusedField === "email" ? "login-input-focused" : ""}`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ${focusedField === "email" ? "scale-110" : ""}`}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-colors duration-300 ${focusedField === "email" ? "text-accent" : "text-brand/40"}`}
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@company.com"
                      required
                      className="w-full rounded-xl border border-brand/[0.08] bg-white py-3 pl-11 pr-4 text-[15px] text-ink placeholder:text-brand/40 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_rgba(91,160,143,0.08),0_0_20px_rgba(91,160,143,0.06)] transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="fp-submit"
                  type="submit"
                  disabled={isLoading}
                  className="login-submit-btn group relative w-full mt-2 rounded-full bg-brand py-3.5 text-[15px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(28,63,58,0.15)] hover:bg-brand-dark hover:shadow-[0_4px_12px_rgba(0,0,0,0.2),0_12px_32px_rgba(28,63,58,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(28,63,58,0.15)] transition-all duration-300 cursor-pointer"
                  style={stagger(3, 0.15)}
                >
                  {/* Shine sweep */}
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="absolute inset-0 login-btn-shine-sweep" />
                  </div>
                  {/* Ripple on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span
                    className={`relative z-10 inline-flex items-center gap-2 ${isLoading ? "opacity-0" : ""}`}
                  >
                    Send reset link
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="group-hover:translate-x-1 transition-transform duration-200"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </form>

              {/* Back to sign in link */}
              <p
                className="mt-8 text-center text-[14px] text-ink-muted"
                style={stagger(4, 0.15)}
              >
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-brand hover:text-accent transition-colors duration-300 underline decoration-brand/20 underline-offset-2 hover:decoration-accent/40"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

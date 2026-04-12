"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, setRememberMe } from "@/lib/firebase";

/* ═══════════════════════════════════════════════
   Firebase error → human-readable messages
   ═══════════════════════════════════════════════ */
const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password. Try again or reset your password.",
  "auth/user-not-found": "No account found with this email. Check for typos or create an account.",
  "auth/wrong-password": "Incorrect email or password. Try again or reset your password.",
  "auth/email-already-in-use": "This email is already registered. Sign in instead?",
  "auth/weak-password": "Password must be at least 8 characters with letters and numbers.",
  "auth/too-many-requests": "Too many attempts. Please wait 30 seconds.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled. Try again when ready.",
  "auth/network-request-failed": "Connection failed. Check your internet and try again.",
  "auth/invalid-email": "Please enter a valid email address.",
};

function getFirebaseError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    return FIREBASE_ERRORS[code] || "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

/* ═══════════════════════════════════════════════
   Login Page Content
   ═══════════════════════════════════════════════ */
function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMeState] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [formTilt, setFormTilt] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
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

  /* ── Read callback error from URL ── */
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_callback_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  /* ── Google OAuth ── */
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await setRememberMe(rememberMe);
      await signInWithPopup(auth, googleProvider);
      const redirect = searchParams.get("redirect") ?? "/dashboard";
      router.push(redirect);
      router.refresh();
      return;
    } catch (err) {
      setError(getFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Email + Password submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      await setRememberMe(rememberMe);

      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        setSuccessMsg("Account created! Redirecting to your dashboard...");
        const redirect = searchParams.get("redirect") ?? "/dashboard";
        router.push(redirect);
        router.refresh();
        return;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        const redirect = searchParams.get("redirect") ?? "/dashboard";
        router.push(redirect);
        router.refresh();
        return;
      }
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
                id="diag-login"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(35)"
              >
                <line x1="0" y1="0" x2="0" y2="60" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag-login)" />
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
            <h1
              className="text-white/90 text-4xl xl:text-[2.75rem] leading-[1.15] tracking-tight mb-6 font-display font-bold"
            >
              <span className="inline-block" style={stagger(0, 0.3)}>
                {mode === "login" ? "Hire on merit," : "Fairer hiring"}
              </span>
              <br />
              <span
                className="inline-block login-accent-shimmer"
                style={{
                  ...stagger(1, 0.3),
                }}
              >
                {mode === "login" ? "not on bias." : "starts here."}
              </span>
            </h1>
            <p
              className="text-white/55 text-[15px] leading-relaxed max-w-sm"
              style={stagger(2, 0.3)}
            >
              {mode === "login"
                ? "AI-powered hiring that's transparent, fair, and explainable."
                : "Join organizations building equitable talent pipelines."}
            </p>
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
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-ink-muted text-[15px]" style={stagger(1, 0.15)}>
              {mode === "login"
                ? "Sign in to continue to your dashboard"
                : "Start building fairer hiring workflows"}
            </p>
          </div>

          {/* Error / Success messages */}
          {error && (
            <div
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              style={{ animation: "login-fade-in 0.3s ease-out" }}
            >
              {error}
            </div>
          )}
          {successMsg && (
            <div
              className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              style={{ animation: "login-fade-in 0.3s ease-out" }}
            >
              {successMsg}
            </div>
          )}

          {/* Google Sign-In */}
          <div className="mb-6" style={stagger(2, 0.15)}>
            <button
              id="google-sign-in"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative flex items-center justify-center gap-3 w-full rounded-xl border border-brand/[0.08] bg-white px-4 py-3.5 text-sm font-medium text-brand/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-brand/[0.15] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-white hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-300 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand/[0.02] to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0 group-hover:scale-110 transition-transform duration-300">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center mb-6" style={stagger(3, 0.15)}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand/[0.08] to-transparent" />
            <span className="px-4 text-xs text-ink-faint font-medium uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brand/[0.08] to-transparent" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (signup only) */}
            {mode === "signup" && (
              <div style={stagger(3.5, 0.15)}>
                <label htmlFor="login-name" className="block text-[13px] font-medium text-brand/70 mb-1.5">
                  Full name
                </label>
                <div className={`relative login-input-wrap ${focusedField === "name" ? "login-input-focused" : ""}`}>
                  <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ${focusedField === "name" ? "scale-110" : ""}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${focusedField === "name" ? "text-accent" : "text-brand/40"}`}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    id="login-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full rounded-xl border border-brand/[0.08] bg-white py-3 pl-11 pr-4 text-[15px] text-ink placeholder:text-brand/40 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_rgba(91,160,143,0.08),0_0_20px_rgba(91,160,143,0.06)] transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={stagger(4, 0.15)}>
              <label htmlFor="login-email" className="block text-[13px] font-medium text-brand/70 mb-1.5">
                Work email
              </label>
              <div className={`relative login-input-wrap ${focusedField === "email" ? "login-input-focused" : ""}`}>
                <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ${focusedField === "email" ? "scale-110" : ""}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${focusedField === "email" ? "text-accent" : "text-brand/40"}`}>
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  id="login-email"
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

            {/* Password */}
            <div style={stagger(5, 0.15)}>
              <label htmlFor="login-password" className="block text-[13px] font-medium text-brand/70 mb-1.5">
                {mode === "signup" ? "Create a password" : "Password"}
              </label>
              <div className={`relative login-input-wrap ${focusedField === "password" ? "login-input-focused" : ""}`}>
                <div className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ${focusedField === "password" ? "scale-110" : ""}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors duration-300 ${focusedField === "password" ? "text-accent" : "text-brand/40"}`}>
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  className="w-full rounded-xl border border-brand/[0.08] bg-white py-3 pl-11 pr-12 text-[15px] text-ink placeholder:text-brand/40 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:outline-none focus:border-accent/30 focus:shadow-[0_0_0_3px_rgba(91,160,143,0.08),0_0_20px_rgba(91,160,143,0.06)] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-brand/30 hover:text-brand/50 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password helper (signup) */}
              {mode === "signup" && (
                <p className="mt-1.5 text-[12px] text-ink-faint">
                  Use 8+ characters with a mix of letters and numbers
                </p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between pt-1" style={stagger(6, 0.15)}>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMeState(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-[18px] h-[18px] rounded-md border border-brand/[0.12] bg-white peer-checked:bg-brand peer-checked:border-brand peer-checked:scale-110 transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)]" />
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute top-[3px] left-[3px] opacity-0 peer-checked:opacity-100 transition-all duration-300 peer-checked:animate-[login-check-pop_0.3s_ease-out]"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-[13px] text-ink-muted group-hover:text-ink transition-colors select-none">
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-brand/65 hover:text-accent transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-accent/50 hover:after:w-full after:transition-all after:duration-300"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="login-submit-btn group w-full mt-2 rounded-xl bg-brand py-3.5 text-[15px] font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(28,63,58,0.15)] hover:bg-brand-dark hover:shadow-[0_4px_12px_rgba(0,0,0,0.2),0_12px_32px_rgba(28,63,58,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(28,63,58,0.15)] transition-all duration-300 cursor-pointer"
              style={stagger(7, 0.15)}
            >
              {/* Shine sweep */}
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="absolute inset-0 login-btn-shine-sweep" />
              </div>
              {/* Ripple on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className={`relative z-10 inline-flex items-center gap-2 ${isLoading ? "opacity-0" : ""}`}>
                {mode === "login" ? "Sign in" : "Create account"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-200">
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

          {/* Toggle mode link */}
          <p className="mt-8 text-center text-[14px] text-ink-muted" style={stagger(8, 0.15)}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setSuccessMsg(null);
              }}
              className="font-medium text-brand hover:text-accent transition-colors duration-300 underline decoration-brand/20 underline-offset-2 hover:decoration-accent/40 cursor-pointer"
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>

          {/* Terms */}
          <p className="mt-6 text-center text-[12px] text-ink-faint leading-relaxed" style={stagger(9, 0.15)}>
            By continuing, you agree to our{" "}
            <a href="#" className="underline underline-offset-2 hover:text-ink-muted transition-colors duration-300">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-2 hover:text-ink-muted transition-colors duration-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

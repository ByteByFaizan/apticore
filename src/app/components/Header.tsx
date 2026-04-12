"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Impact", href: "#impact" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full pt-4 pb-2">
        {/* Full-width line through middle of navbar */}
        {!scrolled && (
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-brand/[0.06] transition-opacity duration-300" />
        )}

        <div className="relative max-w-[1100px] mx-auto px-4">
          <nav
            className={`flex items-center justify-between rounded-full border header-sticky px-6 py-2.5 ${scrolled
                ? "border-brand/6 header-scrolled shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
                : "border-brand/8 bg-white/60 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              }`}
          >
            {/* Left: Brand + nav links */}
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 text-brand font-bold text-xl tracking-tight select-none font-display"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent flex items-center justify-center shadow-[0_2px_8px_rgba(91,160,143,0.25)]">
                  <span className="text-white text-xs font-extrabold">A</span>
                </div>
                <span className="font-[family-name:var(--font-lobster)] text-2xl">AptiCore</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-brand/70 hover:text-brand text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Right: Auth buttons (desktop) */}
            <div className="hidden md:flex items-center gap-2.5">
              <a
                href="/login"
                className="rounded-full border border-brand/10 bg-white px-5 py-1.5 text-sm font-medium text-brand shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-brand/[0.03] hover:shadow-[0_1px_4px_rgba(0,0,0,0.07)] transition-all"
              >
                Log in
              </a>
              <a
                href="#contact"
                className="rounded-full bg-brand px-5 py-1.5 text-sm font-medium text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:bg-brand-dark transition-all"
              >
                Get Started
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-brand hover:bg-brand/5 md:hidden transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ── */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[80%] max-w-[320px] md:hidden flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        style={{ background: "linear-gradient(160deg, #1C3F3A 0%, #0F2924 100%)" }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/[0.07]">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center gap-2.5 text-white font-bold text-lg tracking-tight font-display"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/25">
              <span className="text-white text-xs font-extrabold">A</span>
            </div>
            <span className="font-[family-name:var(--font-lobster)] text-xl">AptiCore</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-9 h-9 rounded-full bg-white/[0.07] hover:bg-white/[0.13] flex items-center justify-center text-white/70 hover:text-white transition-all"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-1">
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-white/70 hover:text-white hover:bg-white/[0.07] transition-all duration-200 active:scale-[0.98]"
              style={{
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? "translateX(0)" : "translateX(16px)",
                transition: `opacity 0.35s ease ${0.05 + i * 0.05}s, transform 0.4s cubic-bezier(0.16,1,0.3,1) ${0.05 + i * 0.05}s, background 0.2s, color 0.2s`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 flex-shrink-0" />
              {link.label}
            </a>
          ))}

          <div className="my-3 h-px bg-white/[0.07] mx-2" />

          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full mx-2 px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-dark text-white text-[15px] font-semibold shadow-lg shadow-accent/25 hover:opacity-90 transition-all active:scale-[0.98]"
            style={{
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.35s ease 0.25s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.25s",
            }}
          >
            Get Started
          </a>
        </nav>
      </div>
    </>
  );
}

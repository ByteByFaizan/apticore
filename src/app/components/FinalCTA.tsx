"use client";

import { useRef, useCallback, useEffect } from "react";
import RevealOnScroll from "./ui/RevealOnScroll";

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);

  /* ── Parallax orbs on mouse move ── */
  const handleMouse = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const orbs = el.querySelectorAll<HTMLElement>("[data-orb]");
    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 20;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  }, []);

  /* ── Device tilt parallax on mobile (gyroscope) ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const x = (e.gamma / 90) * 0.5; // -0.5 to 0.5
      const y = (e.beta / 180) * 0.5;
      const orbs = el.querySelectorAll<HTMLElement>("[data-orb]");
      orbs.forEach((orb, i) => {
        const speed = (i + 1) * 15;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative py-16 sm:py-20 md:py-28 border-t border-b border-brand/12 overflow-hidden"
      onMouseMove={handleMouse}
    >
      <div className="absolute inset-0 bg-brand" />
      {/* Decorative corner accents */}
      <div className="absolute top-0 right-0 w-28 sm:w-40 h-28 sm:h-40 bg-gradient-to-bl from-white/[0.06] to-transparent" />
      <div className="absolute bottom-0 left-0 w-40 sm:w-60 h-40 sm:h-60 bg-gradient-to-tr from-white/[0.03] to-transparent" />
      {/* Dot texture — hidden on small mobile */}
      <div
        className="absolute top-12 right-12 w-40 h-40 pointer-events-none opacity-60 hidden sm:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      {/* Floating orbs — parallax on mouse/tilt */}
      <div
        data-orb
        className="absolute -top-16 -right-16 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-gradient-radial from-accent/20 to-transparent rounded-full blur-2xl pointer-events-none transition-transform duration-[1200ms] ease-out"
      />
      <div
        data-orb
        className="absolute -bottom-16 -left-16 w-[180px] sm:w-[250px] h-[180px] sm:h-[250px] bg-gradient-radial from-emerald/15 to-transparent rounded-full blur-2xl pointer-events-none transition-transform duration-[1200ms] ease-out"
      />
      <div
        data-orb
        className="absolute top-1/3 left-1/3 w-[120px] sm:w-[180px] h-[120px] sm:h-[180px] bg-gradient-radial from-white/[0.04] to-transparent rounded-full blur-xl pointer-events-none transition-transform duration-[1200ms] ease-out"
      />

      <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 text-center">
        <RevealOnScroll>
          <h2 className="font-display text-fluid-section font-extrabold leading-tight tracking-tight text-white">
            Ready to Make Hiring Fair?
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-white/70 md:text-lg font-medium leading-7">
            Join organizations building a future where talent is judged strictly
            on merit. Start uncovering bias in your pipeline today.
          </p>
          <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 flex-wrap">
            <a
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold text-brand shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-all hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative z-10">Start Free Analysis</span>
              <svg
                className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export default function Hero() {
  /* ── Animated counter hook ── */
  const [counts, setCounts] = useState([0, 0, 0]);
  const counterRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = counterRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const targets = [35, 2, 100];
          const duration = 1800;
          const steps = 50;
          const interval = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCounts(targets.map((t) => Math.round(t * ease)));
            if (step >= steps) clearInterval(timer);
          }, interval);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── Mockup bar animation ── */
  const [barsVisible, setBarsVisible] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mockupRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBarsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative pt-28 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
      {/* ── Background texture ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-gradient-radial from-brand/[0.04] to-transparent rounded-full blur-3xl" />
        {/* Dot grid pattern */}
        <div
          className="absolute top-20 right-10 w-48 h-48 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #1C3F3A 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div
          className="absolute bottom-20 left-16 w-36 h-36 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #1C3F3A 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        />
      </div>

      <div className="relative max-w-[1100px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <h1 className="max-w-[600px] text-ink text-4xl sm:text-5xl md:text-[64px] font-extrabold leading-tight md:leading-[1.08] tracking-tight font-display animate-fade-in-up text-balance">
              Hire on Skills,{" "}
              <span className="bg-gradient-to-r from-accent via-brand to-accent-dark bg-clip-text text-transparent animate-gradient-shift">
                Not Stereotypes.
              </span>
            </h1>

            <p className="mt-6 max-w-[506px] text-ink-light text-lg font-medium leading-7 animate-fade-in-up animation-delay-100">
              AptiCore detects, quantifies, and removes unconscious bias from
              your hiring pipeline — then{" "}
              <strong className="text-ink">proves</strong> the improvement with
              transparent, explainable metrics.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mt-8 animate-fade-in-up animation-delay-200">
              <a
                href="#contact"
                className="group relative h-12 px-8 bg-brand hover:bg-brand-dark text-white rounded-full font-semibold text-[15px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] inline-flex items-center gap-2.5 shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] hover:shadow-[0_8px_24px_rgba(28,63,58,0.3),0_0_0_4px_rgba(28,63,58,0.1)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative z-10">Start Free Analysis</span>
                <svg
                  className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
              <button className="group h-12 px-6 rounded-full border border-brand/10 bg-white text-brand text-[15px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-brand/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] transition-all inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Watch Demo
              </button>
            </div>

            <p className="mt-3 text-ink-faint text-sm font-medium animate-fade-in-up animation-delay-300">
              No signup required · Takes 30 seconds
            </p>

            {/* Stats — animated counters */}
            <div
              ref={counterRef}
              className="flex gap-8 mt-8 pt-8 border-t border-edge animate-fade-in-up animation-delay-400"
            >
              {[
                { value: counts[0], suffix: "%", prefix: "+", label: "Fairness Improvement" },
                { value: counts[1], suffix: "s", prefix: "<", label: "Per Resume" },
                { value: counts[2], suffix: "%", prefix: "", label: "Explainable Decisions" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-brand text-2xl font-extrabold tracking-tight font-display tabular-nums">
                    {stat.prefix}
                    {stat.value}
                    {stat.suffix}
                  </div>
                  <div className="text-ink-faint text-xs font-medium mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Mockup */}
          <div
            ref={mockupRef}
            className="relative animate-fade-in-up animation-delay-300 max-w-[560px] mx-auto lg:mx-0"
          >
            <div className="relative bg-surface-card border border-edge-light shadow-[0_4px_24px_rgba(28,63,58,0.06),0_20px_60px_rgba(28,63,58,0.08)] overflow-hidden animate-float-gentle">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-alt border-b border-edge-light">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                <div className="flex-1 ml-3 h-6 bg-white rounded border border-edge-light flex items-center px-3">
                  <span className="text-[11px] text-ink-faint font-body">
                    apticore.app/dashboard
                  </span>
                </div>
              </div>

              {/* Mockup content */}
              <div className="p-5 flex flex-col gap-3">
                {/* Score comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-[#fef2f2] to-[#fff7ed] border border-edge-light text-center group/card hover:shadow-md transition-shadow duration-300">
                    <div className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider mb-2">
                      Before
                    </div>
                    <div className="text-3xl font-extrabold font-display text-[#f97316] tracking-tight transition-transform duration-500 group-hover/card:scale-105">
                      58
                    </div>
                    <div className="text-[10px] font-medium text-ink-muted mt-1">
                      Fairness Score
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-[#ecfdf5] to-[#e0f2fe] border border-edge-light text-center group/card hover:shadow-md transition-shadow duration-300">
                    <div className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider mb-2">
                      After
                    </div>
                    <div className="text-3xl font-extrabold font-display text-emerald tracking-tight transition-transform duration-500 group-hover/card:scale-105">
                      93
                    </div>
                    <div className="text-[10px] font-semibold text-emerald mt-1">
                      ▲ +35 Points
                    </div>
                  </div>
                </div>

                {/* Candidate bars — animated width */}
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: "C-101", score: "92%", w: 92 },
                    { id: "C-204", score: "87%", w: 87 },
                    { id: "C-078", score: "81%", w: 81 },
                    { id: "C-315", score: "76%", w: 76 },
                  ].map((c, i) => (
                    <div
                      key={c.id}
                      className="group/bar flex items-center gap-3 px-3 py-2 bg-surface-alt hover:bg-surface-alt/80 transition-colors duration-200 cursor-default"
                    >
                      <span className="text-xs font-bold text-brand font-display min-w-[42px]">
                        {c.id}
                      </span>
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-emerald transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          style={{
                            width: barsVisible ? `${c.w}%` : "0%",
                            transitionDelay: `${i * 200 + 400}ms`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-ink min-w-[32px] text-right tabular-nums">
                        {c.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Glow behind mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-accent/[0.06] to-transparent -z-10 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SectionHeader from "./ui/SectionHeader";
import RevealOnScroll from "./ui/RevealOnScroll";

/* ── Phase data ── */
const phases = [
  {
    title: "Reveal Bias",
    number: "01",
    description:
      "Upload resumes and a job description. Our AI parses documents, detects patterns that normally influence hiring, and assigns a quantifiable Fairness Score.",
    steps: [
      "Resume ingestion & parsing",
      "Bias pattern detection",
      "Fairness Score (Before)",
    ],
    visual: { label: "Bias Detected", value: "4 patterns", color: "#f97316" },
  },
  {
    title: "Remove Bias",
    number: "02",
    description:
      "Anonymize identities, mask bias-triggering data, and evaluate candidates purely on skills using semantic vector matching against job requirements.",
    steps: [
      "PII anonymization layer",
      "Skill-based evaluation engine",
      "Merit-only ranking",
    ],
    visual: { label: "Fields Masked", value: "15+ PII", color: "#0EA5E9" },
  },
  {
    title: "Prove Improvement",
    number: "03",
    description:
      "Generate transparent explanations for every score, recalculate fairness metrics, and present a side-by-side Before vs. After comparison dashboard.",
    steps: [
      "Explainability engine",
      "Fairness Score (After)",
      "Comparison dashboard",
    ],
    visual: { label: "Score Improved", value: "58 → 93", color: "#10B981" },
  },
];

const CYCLE_MS = 4000;

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setActive(index);
    setAnimKey((k) => k + 1);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % phases.length);
      setAnimKey((k) => k + 1);
    }, CYCLE_MS);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % phases.length);
      setAnimKey((k) => k + 1);
    }, CYCLE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const activePhase = phases[active];

  return (
    <section id="how-it-works" className="border-t border-b border-edge">
      <div className="max-w-[1100px] mx-auto px-4">
        <div className="py-16 sm:py-24">
          <SectionHeader
            eyebrow="How it works"
            title="Reveal → Remove → Prove"
            subtitle="A transparent 9-step pipeline that transforms subjective hiring into a measurable, skill-driven system."
            center={false}
          />

          {/* Phase cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {phases.map((phase, index) => {
              const isActive = active === index;
              return (
                <RevealOnScroll key={phase.title} delay={index * 100}>
                  <div
                    onClick={() => goTo(index)}
                    className={`group relative p-6 flex flex-col gap-3 border cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                      isActive
                        ? "bg-white border-brand/20 shadow-[0_8px_30px_rgba(29,53,87,0.08)] -translate-y-1"
                        : "bg-surface/30 border-edge/80 hover:border-brand/10 hover:bg-white/80 hover:shadow-sm"
                    }`}
                  >
                    {/* Background glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent transition-opacity duration-500 ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    {/* Progress bar */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden bg-transparent">
                      {isActive && (
                        <div
                          key={animKey}
                          className="h-full bg-gradient-to-r from-brand to-accent"
                          style={{ animation: `progress-bar ${CYCLE_MS}ms linear forwards` }}
                        />
                      )}
                    </div>

                    {/* Phase number */}
                    <span
                      className={`absolute top-4 right-4 text-2xl font-extrabold font-display tracking-tighter transition-colors duration-500 ${
                        isActive ? "text-brand/15" : "text-ink/5"
                      }`}
                    >
                      {phase.number}
                    </span>

                    {/* Title */}
                    <h3
                      className={`text-sm font-semibold leading-6 mt-1 transition-colors duration-300 relative z-10 ${
                        isActive
                          ? "text-ink"
                          : "text-ink/70 group-hover:text-ink"
                      }`}
                    >
                      {phase.title}
                    </h3>

                    {/* Description */}
                    <p
                      className={`text-sm leading-[22px] transition-colors duration-300 relative z-10 ${
                        isActive
                          ? "text-ink-light/90"
                          : "text-ink-light/60 group-hover:text-ink-light/80"
                      }`}
                    >
                      {phase.description}
                    </p>

                    {/* Steps */}
                    <ul className="mt-2 flex flex-col gap-1.5 relative z-10">
                      {phase.steps.map((step, si) => (
                        <li
                          key={si}
                          className={`flex items-center gap-2 text-xs font-medium transition-all duration-300 ${
                            isActive
                              ? "text-ink-muted"
                              : "text-ink-faint group-hover:text-ink-muted"
                          }`}
                          style={{
                            transitionDelay: isActive ? `${si * 60}ms` : "0ms",
                          }}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 ${
                              isActive
                                ? "bg-accent scale-100"
                                : "bg-ink-faint scale-75"
                            }`}
                          />
                          {step}
                        </li>
                      ))}
                    </ul>

                    {/* Bottom accent line */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>

          {/* Live preview panel */}
          <RevealOnScroll>
            <div className="mt-6 p-6 bg-white border border-edge/60 shadow-[0_2px_12px_rgba(29,53,87,0.04)] overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Animated indicator */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-extrabold font-display text-lg transition-all duration-500 shadow-lg"
                    style={{
                      backgroundColor: activePhase.visual.color,
                      boxShadow: `0 4px 16px ${activePhase.visual.color}33`,
                    }}
                  >
                    {activePhase.number}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider">
                      {activePhase.visual.label}
                    </p>
                    <p
                      className="text-xl font-extrabold font-display tracking-tight transition-colors duration-300"
                      style={{ color: activePhase.visual.color }}
                    >
                      {activePhase.visual.value}
                    </p>
                  </div>
                </div>

                {/* Step progress dots */}
                <div className="flex items-center gap-2">
                  {phases.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`transition-all duration-300 rounded-full ${
                        active === i
                          ? "w-8 h-2 bg-brand"
                          : "w-2 h-2 bg-edge hover:bg-ink-faint"
                      }`}
                      aria-label={`Go to phase ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

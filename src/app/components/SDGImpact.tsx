"use client";

import { useState } from "react";
import SectionHeader from "./ui/SectionHeader";
import RevealOnScroll from "./ui/RevealOnScroll";

const sdgGoals = [
  {
    number: "8",
    goalName: "UN SDG Goal 8",
    title: "Decent Work & Economic Growth",
    description:
      "Promoting inclusive, full, and productive employment by removing systemic barriers in the hiring process.",
    color: "#a21caf",
    stat: { value: "72%", label: "of qualified candidates filtered by bias" },
  },
  {
    number: "10",
    goalName: "UN SDG Goal 10",
    title: "Reduced Inequalities",
    description:
      "Ensuring equal opportunity and reducing inequalities of outcome by making hiring decisions purely merit-based.",
    color: "#db2777",
    stat: { value: "2.3×", label: "more diverse candidate pipelines" },
  },
  {
    number: "5",
    goalName: "UN SDG Goal 5",
    title: "Gender Equality",
    description:
      "Ensuring women's full and effective participation and equal opportunities through bias-free resume evaluation.",
    color: "#ea580c",
    stat: { value: "41%", label: "gender gap reduction in shortlists" },
  },
];

export default function SDGImpact() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="impact" className="py-16 sm:py-24 border-t border-edge">
      <div className="max-w-[1100px] mx-auto px-4">
        <SectionHeader
          eyebrow="Impact"
          title="Aligned with UN Sustainable Development Goals"
          subtitle="AptiCore directly addresses employment inequality — a core target of multiple United Nations SDGs."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {sdgGoals.map((sdg, i) => (
            <RevealOnScroll key={sdg.number} delay={i * 120}>
              <div
                className="group relative bg-white border border-edge/80 p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-brand/15 hover:shadow-[0_12px_40px_rgba(28,63,58,0.07)] hover:-translate-y-1.5 cursor-default h-full overflow-hidden"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.01] to-brand/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Number badge */}
                <span
                  className="text-5xl font-extrabold font-display tracking-tighter leading-none relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:-translate-y-1 inline-block"
                  style={{ color: sdg.color }}
                >
                  {sdg.number}
                </span>

                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint relative z-10">
                  {sdg.goalName}
                </p>
                <h3 className="mt-4 text-lg font-semibold text-ink relative z-10">
                  {sdg.title}
                </h3>
                <p className="mt-3 text-sm leading-[1.75] text-ink-light/85 relative z-10">
                  {sdg.description}
                </p>

                {/* Interactive stat on hover */}
                <div
                  className={`mt-4 pt-4 border-t border-edge/60 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-10 ${hoveredIndex === i
                      ? "opacity-100 translate-y-0 max-h-20"
                      : "opacity-0 translate-y-2 max-h-0 overflow-hidden pt-0 mt-0 border-t-0"
                    }`}
                >
                  <div
                    className="text-xl font-extrabold font-display tracking-tight"
                    style={{ color: sdg.color }}
                  >
                    {sdg.stat.value}
                  </div>
                  <div className="text-xs font-medium text-ink-muted mt-0.5">
                    {sdg.stat.label}
                  </div>
                </div>

                {/* Decorative bottom line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left"
                  style={{
                    background: `linear-gradient(90deg, ${sdg.color}, ${sdg.color}88)`,
                  }}
                />
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

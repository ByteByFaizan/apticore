"use client";

import { useState, useEffect, useRef } from "react";
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
    stat: { value: 72, suffix: "%", label: "of qualified candidates filtered by bias" },
  },
  {
    number: "10",
    goalName: "UN SDG Goal 10",
    title: "Reduced Inequalities",
    description:
      "Ensuring equal opportunity and reducing inequalities of outcome by making hiring decisions purely merit-based.",
    color: "#db2777",
    stat: { value: 2.3, suffix: "×", label: "more diverse candidate pipelines" },
  },
  {
    number: "5",
    goalName: "UN SDG Goal 5",
    title: "Gender Equality",
    description:
      "Ensuring women's full and effective participation and equal opportunities through bias-free resume evaluation.",
    color: "#ea580c",
    stat: { value: 41, suffix: "%", label: "gender gap reduction in shortlists" },
  },
];

/* Animated counter for stats */
function AnimatedStat({ value, suffix, color, isVisible }: { value: number; suffix: string; color: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Number((value * ease).toFixed(suffix === "×" ? 1 : 0)));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, value, suffix]);

  return (
    <span className="text-xl font-extrabold font-display tracking-tight tabular-nums" style={{ color }}>
      {suffix === "×" ? count.toFixed(1) : count}{suffix}
    </span>
  );
}

export default function SDGImpact() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  // Detect mobile for always-visible stats
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Track section visibility for counter animation
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="impact" className="py-12 sm:py-16 md:py-24 border-t border-edge">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6" ref={sectionRef}>
        <SectionHeader
          eyebrow="Impact"
          title="Aligned with UN Sustainable Development Goals"
          subtitle="AptiCore directly addresses employment inequality — a core target of multiple United Nations SDGs."
        />

        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          {sdgGoals.map((sdg, i) => {
            const showStat = isMobile || hoveredIndex === i;
            return (
              <RevealOnScroll key={sdg.number} delay={i * 120}>
                <div
                  className="group relative bg-white border border-edge/80 p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-brand/15 hover:shadow-[0_12px_40px_rgba(28,63,58,0.07)] hover:-translate-y-1.5 cursor-default h-full overflow-hidden rounded-xl"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.01] to-brand/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Number badge */}
                  <span
                    className="text-4xl sm:text-5xl font-extrabold font-display tracking-tighter leading-none relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:-translate-y-1 inline-block"
                    style={{ color: sdg.color }}
                  >
                    {sdg.number}
                  </span>

                  <p className="mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint relative z-10">
                    {sdg.goalName}
                  </p>
                  <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-ink relative z-10">
                    {sdg.title}
                  </h3>
                  <p className="mt-2 sm:mt-3 text-sm leading-[1.75] text-ink-light/85 relative z-10">
                    {sdg.description}
                  </p>

                  {/* Interactive stat — always visible on mobile, hover on desktop */}
                  <div
                    className={`mt-4 pt-4 border-t border-edge/60 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-10 ${
                      showStat
                        ? "opacity-100 translate-y-0 max-h-20"
                        : "opacity-0 translate-y-2 max-h-0 overflow-hidden pt-0 mt-0 border-t-0"
                    }`}
                  >
                    <AnimatedStat
                      value={sdg.stat.value}
                      suffix={sdg.stat.suffix}
                      color={sdg.color}
                      isVisible={sectionVisible && showStat}
                    />
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

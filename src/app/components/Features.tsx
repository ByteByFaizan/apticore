"use client";

import { useRef, useCallback } from "react";
import SectionHeader from "./ui/SectionHeader";
import RevealOnScroll from "./ui/RevealOnScroll";

/* ── Icons ── */
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const features = [
  {
    icon: ShieldIcon,
    title: "AI-Powered Anonymization",
    description: "Advanced NER models detect and mask 15+ categories of personally identifiable and bias-triggering information.",
  },
  {
    icon: BarChartIcon,
    title: "Quantifiable Fairness Score",
    description: "Mathematical bias scoring from 0–100. Track exactly how much fairer your hiring becomes with before-and-after metrics.",
  },
  {
    icon: EyeIcon,
    title: "Full Explainability",
    description: "Every candidate score comes with transparent reasoning. No black-box decisions — see exactly why each candidate was ranked.",
  },
  {
    icon: ZapIcon,
    title: "Real-Time Processing",
    description: "Built on serverless architecture with Vertex AI. Process hundreds of resumes in seconds with live dashboard updates.",
  },
  {
    icon: UsersIcon,
    title: "Semantic Skill Matching",
    description: "Vector embeddings map candidate skills to job requirements with contextual understanding — not just keyword matching.",
  },
  {
    icon: CheckIcon,
    title: "Compliance Ready",
    description: "Built for EEOC, GDPR, and emerging AI hiring regulations. Audit trail for every decision made in the pipeline.",
  },
];

/* ── Tilt card ── */
function TiltCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  }, []);

  const handleLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateY(0)";
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className="transition-[box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="max-w-[1100px] mx-auto px-4">
        <SectionHeader
          eyebrow="Features"
          title="Built for Transparency. Powered by Gemini."
          subtitle="Every component engineered to make hiring decisions fair, fast, and fully explainable."
        />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <RevealOnScroll key={feature.title} delay={i * 100}>
              <TiltCard>
                <div className="group p-6 border border-edge/80 bg-white h-full hover:border-brand/20 hover:shadow-[0_8px_30px_rgba(29,53,87,0.06)] relative overflow-hidden cursor-default">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-surface/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Spotlight glow following cursor */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(300px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),rgba(14,165,233,0.04),transparent)]" />
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left" />

                  <div className="mb-4 inline-flex rounded-lg bg-surface-alt p-2.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-brand group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_4px_16px_rgba(29,53,87,0.2)] relative z-10 text-brand">
                    <feature.icon />
                  </div>
                  <h3 className="text-ink text-sm font-semibold leading-6 relative z-10">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-ink-light/80 text-sm leading-[22px] relative z-10">
                    {feature.description}
                  </p>
                </div>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

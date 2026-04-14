"use client";

import { useAnimatedCounter } from "../hooks/useAnimatedCounter";
import { useScrollReveal } from "../hooks/useScrollReveal";

interface FairnessScoreCardProps {
  label: string;
  sublabel: string;
  score: number;
  variant: "before" | "after";
  resetKey?: string;
}

/** Qualitative label for fairness score */
function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Highly Fair", color: "text-emerald" };
  if (score >= 60) return { label: "Fair", color: "text-sky-500" };
  if (score >= 40) return { label: "Moderate Bias", color: "text-amber-500" };
  return { label: "High Bias Risk", color: "text-red-500" };
}

export default function FairnessScoreCard({
  label,
  sublabel,
  score,
  variant,
  resetKey,
}: FairnessScoreCardProps) {
  const { ref, isVisible } = useScrollReveal(0.2, resetKey);
  const animated = useAnimatedCounter(score, isVisible, 1600, resetKey);

  const isBefore = variant === "before";
  const scoreColor = isBefore ? "text-red-500" : "text-emerald";
  const accentGradient = isBefore
    ? "from-red-500/5 to-transparent"
    : "from-emerald/5 to-transparent";
  const ringColor = isBefore ? "border-red-200" : "border-emerald/30";
  const qualLabel = getScoreLabel(score);

  return (
    <div
      ref={ref}
      className="relative bg-white rounded-2xl border border-edge p-6 text-center overflow-hidden transition-all duration-300 hover:shadow-[0_6px_24px_rgba(28,63,58,0.06)]"
    >
      {/* Background radial */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${accentGradient} pointer-events-none`}
      />

      <div className="relative">
        <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-4">
          {label}
        </p>

        {/* Score ring */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-24 h-24 rounded-full border-[4px] ${ringColor} flex items-center justify-center transition-all duration-500`}
            style={{
              transform: isVisible ? "scale(1)" : "scale(0.8)",
              opacity: isVisible ? 1 : 0,
              transition:
                "transform 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s, opacity 0.6s ease 0.2s",
            }}
          >
            <span
              className={`text-4xl font-bold font-display tabular-nums ${scoreColor}`}
            >
              {animated}
            </span>
          </div>
        </div>

        {/* Qualitative label */}
        <p className={`text-xs font-semibold mb-1 ${qualLabel.color}`}>
          {qualLabel.label}
        </p>

        <p className="text-sm text-ink-muted">{sublabel}</p>
      </div>
    </div>
  );
}

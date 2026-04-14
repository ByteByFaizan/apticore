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

/** Get the SVG ring progress properties */
function getRingProps(score: number) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return { radius, circumference, offset };
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
  // Before = biased traditional pipeline (red/warning) | After = AptiCore fair (green/success)
  const ringStroke = isBefore ? "#EF4444" : "#10B981";
  const ringTrack = isBefore ? "#FEE2E2" : "#D1FAE5";
  const scoreColor = isBefore ? "text-red-500" : "text-emerald";
  const accentGradient = isBefore
    ? "from-red-500/5 to-transparent"
    : "from-emerald/5 to-transparent";
  const qualLabel = getScoreLabel(score);
  const ring = getRingProps(score);

  return (
    <div
      ref={ref}
      className="relative bg-white rounded-2xl border border-edge p-4 sm:p-6 text-center overflow-hidden transition-all duration-300 hover:shadow-[0_6px_24px_rgba(28,63,58,0.06)]"
    >
      {/* Background radial */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${accentGradient} pointer-events-none`}
      />

      <div className="relative">
        <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-3 sm:mb-4">
          {label}
        </p>

        {/* Score ring — SVG progress circle */}
        <div className="flex justify-center mb-2 sm:mb-3">
          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center"
            style={{
              transform: isVisible ? "scale(1)" : "scale(0.8)",
              opacity: isVisible ? 1 : 0,
              transition:
                "transform 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s, opacity 0.6s ease 0.2s",
            }}
          >
            <svg
              width="112"
              height="112"
              viewBox="0 0 112 112"
              className="absolute inset-0"
              style={{ transform: "rotate(-90deg)" }}
            >
              {/* Track */}
              <circle
                cx="56"
                cy="56"
                r={ring.radius}
                fill="none"
                stroke={ringTrack}
                strokeWidth="6"
              />
              {/* Progress */}
              <circle
                cx="56"
                cy="56"
                r={ring.radius}
                fill="none"
                stroke={ringStroke}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={ring.circumference}
                strokeDashoffset={isVisible ? ring.offset : ring.circumference}
                style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1) 0.3s" }}
              />
            </svg>
            <span
              className={`text-3xl sm:text-4xl font-bold font-display tabular-nums ${scoreColor}`}
            >
              {animated}
            </span>
          </div>
        </div>

        {/* Qualitative label */}
        <p className={`text-xs font-semibold mb-1 ${qualLabel.color}`}>
          {qualLabel.label}
        </p>

        <p className="text-xs sm:text-sm text-ink-muted">{sublabel}</p>
      </div>
    </div>
  );
}

"use client";

import {
  useScrollReveal,
  revealStyle,
} from "../hooks/useScrollReveal";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";
import type { JobBatch } from "@/lib/types";

/* ── Icon components ── */
const Icons = {
  batches: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  ),
  candidates: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  fairness: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
} as const;

interface StatsRowProps {
  batches: JobBatch[];
  resetKey?: string;
}

export default function StatsRow({ batches, resetKey }: StatsRowProps) {
  const { ref, isVisible } = useScrollReveal(0.1, resetKey);

  const totalBatches = batches.length;
  const totalCandidates = batches.reduce(
    (sum, b) => sum + (b.candidateCount || 0),
    0
  );
  const completedBatches = batches.filter(
    (b) => b.fairnessScoreAfter != null && b.fairnessScoreBefore != null
  );
  const avgImprovement =
    completedBatches.length > 0
      ? Math.round(
          completedBatches.reduce(
            (sum, b) =>
              sum + ((b.fairnessScoreAfter || 0) - (b.fairnessScoreBefore || 0)),
            0
          ) / completedBatches.length
        )
      : 0;

  const c0 = useAnimatedCounter(totalBatches, isVisible, 1000, resetKey);
  const c1 = useAnimatedCounter(totalCandidates, isVisible, 1200, resetKey);
  const c2 = useAnimatedCounter(avgImprovement, isVisible, 1400, resetKey);

  const stats = [
    {
      label: "Total Batches",
      value: c0,
      suffix: "",
      sub: `${batches.filter((b) => b.status === "COMPLETE").length} completed`,
      icon: Icons.batches,
      accent: "from-brand/10 to-brand/5",
      iconBg: "bg-brand/8",
      iconColor: "text-brand",
    },
    {
      label: "Candidates Processed",
      value: c1,
      suffix: "",
      sub: "across all batches",
      icon: Icons.candidates,
      accent: "from-accent/10 to-accent/5",
      iconBg: "bg-accent/10",
      iconColor: "text-accent-dark",
    },
    {
      label: "Avg Fairness Lift",
      value: c2,
      suffix: "%",
      prefix: "+",
      sub: `from ${completedBatches.length} batch${completedBatches.length !== 1 ? "es" : ""}`,
      icon: Icons.fairness,
      accent: "from-emerald/10 to-emerald/5",
      iconBg: "bg-emerald/10",
      iconColor: "text-emerald",
    },
  ];

  return (
    <div ref={ref} className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 scroll-snap-x sm:overflow-visible pb-1 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-edge hover:border-brand/20 transition-all duration-300 overflow-hidden stat-card-hover cursor-default min-w-[200px] sm:min-w-0 scroll-snap-item"
          style={revealStyle(isVisible, i, 0.1)}
        >
          {/* Gradient accent stripe */}
          <div
            className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${stat.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          />

          {/* Hover glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-brand/[0.03] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
              >
                {stat.icon}
              </div>
              <p className="text-ink-faint text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                {stat.label}
              </p>
            </div>

            <p className="text-ink text-xl sm:text-[1.75rem] font-bold font-display tracking-tight leading-none tabular-nums">
              {"prefix" in stat && stat.prefix}
              {stat.value}
              {stat.suffix}
            </p>

            <p className="text-ink-muted text-[10px] sm:text-xs mt-1.5 sm:mt-2">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

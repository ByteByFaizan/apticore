"use client";

import React from "react";
import { useScrollReveal, revealStyle } from "../hooks/useScrollReveal";
import FairnessScoreCard from "./FairnessScoreCard";
import DistributionChart from "./DistributionChart";
import EmptyState from "./EmptyState";
import type { BiasReport } from "@/lib/types";

interface BiasReportViewProps {
  biasReport: BiasReport | null;
}

/** Small icon SVGs for each metric */
const METRIC_ICONS: Record<string, React.ReactNode> = {
  "Gender Parity": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  ),
  "College Bias": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  "Location Bias": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  "Merit Purity": (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

export default function BiasReportView({ biasReport }: BiasReportViewProps) {
  const insightReveal = useScrollReveal(0.1, biasReport?.batchId);
  const scoresReveal = useScrollReveal(0.1, biasReport?.batchId);
  const improvementsReveal = useScrollReveal(0.1, biasReport?.batchId);
  const distributionReveal = useScrollReveal(0.1, biasReport?.batchId);

  if (!biasReport) {
    return (
      <EmptyState
        title="No bias report"
        description="Select a completed batch from Overview to view its before &amp; after fairness analysis."
        icon={
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-faint"
          >
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
        }
      />
    );
  }

  const improvement = biasReport.overallImprovement ?? 0;
  const improvementColor =
    improvement > 0 ? "text-emerald" : improvement < 0 ? "text-red-500" : "text-ink-muted";
  const improvementBg =
    improvement > 0
      ? "from-emerald/5 via-emerald/3 to-transparent border-emerald/15"
      : improvement < 0
      ? "from-red-50 via-red-50/50 to-transparent border-red-200/30"
      : "from-slate-50 to-transparent border-edge";

  return (
    <div>
      {/* ── Overall Insight Banner ── */}
      <div
        ref={insightReveal.ref}
        className={`mb-4 sm:mb-6 rounded-2xl border bg-gradient-to-r ${improvementBg} p-4 sm:p-5 transition-all duration-500`}
        style={revealStyle(insightReveal.isVisible, 0, 0)}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Shield icon */}
          <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 backdrop-blur border border-edge/50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={improvementColor}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              {improvement > 0 && <path d="M9 12l2 2 4-4" />}
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`text-xl sm:text-2xl font-bold font-display tabular-nums ${improvementColor}`}>
                {improvement > 0 ? "+" : ""}{improvement} pts
              </span>
              <span className="text-sm text-ink-muted">fairness improvement</span>
            </div>
            <p className="text-xs sm:text-sm text-ink-light mt-0.5 leading-relaxed">
              {improvement > 15
                ? "Significant bias reduction — AptiCore's anonymization produced a substantially fairer selection."
                : improvement > 5
                ? "Measurable improvement — identity factors carry less weight in the optimized pipeline."
                : improvement > 0
                ? "Slight improvement detected — the pipeline is moving toward merit-based selection."
                : improvement === 0
                ? "No measurable change — the candidate pool had minimal detectable bias."
                : "Demographic shifts observed — ranking was skill-blind but skill distribution correlates with demographics."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Fairness Score Comparison ── */}
      <div
        ref={scoresReveal.ref}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6 sm:mb-8"
      >
        <div style={revealStyle(scoresReveal.isVisible, 0, 0.05)}>
          <FairnessScoreCard
            label="Traditional Pipeline"
            sublabel="Without anonymization"
            score={biasReport.before.fairnessScore}
            variant="before"
            resetKey={biasReport.batchId}
          />
        </div>
        <div style={revealStyle(scoresReveal.isVisible, 1, 0.05)}>
          <FairnessScoreCard
            label="AptiCore Pipeline"
            sublabel="Skill-based blind ranking"
            score={biasReport.after.fairnessScore}
            variant="after"
            resetKey={biasReport.batchId}
          />
        </div>
      </div>

      {/* ── Improvements ── */}
      <section ref={improvementsReveal.ref} className="mb-6 sm:mb-8">
        <div
          className="flex items-center gap-4 mb-5"
          style={revealStyle(improvementsReveal.isVisible, 0, 0)}
        >
          <h2 className="text-ink text-base sm:text-lg font-semibold font-display tracking-tight">
            Bias Reduction Breakdown
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-edge to-transparent" />
        </div>

        <div className="space-y-3">
          {biasReport.improvements.map((imp, i) => {
            // For all metrics, positive delta = improvement (green)
            const isPositive = imp.delta > 0;
            const isNeutral = imp.delta === 0;
            const deltaColor = isPositive
              ? "text-emerald"
              : isNeutral
              ? "text-ink-muted"
              : "text-amber-500"; // amber for negative (not harsh red)

            // Determine bar semantics based on metric type
            const isBiasMetric = imp.metric === "College Bias" || imp.metric === "Location Bias";
            // For bias metrics: lower after = better → before=red, after=green
            // For parity/merit: higher after = better → before=muted, after=green
            const beforeColor = isBiasMetric ? "bg-red-400" : "bg-slate-400";
            const beforeTrack = isBiasMetric ? "bg-red-100" : "bg-slate-100";
            const afterColor = "bg-emerald-500";
            const afterTrack = "bg-emerald-100";
            const clampedBefore = Math.max(0, Math.min(imp.before, 100));
            const clampedAfter = Math.max(0, Math.min(imp.after, 100));

            const icon = METRIC_ICONS[imp.metric];

            return (
              <div
                key={imp.metric}
                className="bg-white rounded-xl border border-edge p-4 sm:p-5 transition-all duration-300 hover:shadow-[0_4px_16px_rgba(28,63,58,0.04)]"
                style={revealStyle(improvementsReveal.isVisible, i, 0.1)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {icon && (
                      <span className="text-ink-light">{icon}</span>
                    )}
                    <h3 className="text-sm font-semibold text-ink">{imp.metric}</h3>
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums ${deltaColor}`}
                  >
                    {isPositive ? "+" : ""}{imp.delta}%
                    {isPositive && (
                      <span className="ml-1 text-xs">↑</span>
                    )}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-ink-light mb-3">{imp.description}</p>

                {/* Before → After bars */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-ink-faint font-medium mb-1">
                      Traditional · {clampedBefore}%
                    </p>
                    <div className={`h-2 ${beforeTrack} rounded-full overflow-hidden`}>
                      <div
                        className={`h-full ${beforeColor} rounded-full transition-all duration-1000`}
                        style={{ width: `${clampedBefore}%` }}
                      />
                    </div>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="text-ink-faint shrink-0 mt-3"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-[10px] text-ink-faint font-medium mb-1">
                      AptiCore · {clampedAfter}%
                    </p>
                    <div className={`h-2 ${afterTrack} rounded-full overflow-hidden`}>
                      <div
                        className={`h-full ${afterColor} rounded-full transition-all duration-1000`}
                        style={{ width: `${clampedAfter}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works — mini explainer ── */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-[#1C3F3A] to-[#2A5A52] rounded-2xl p-4 sm:p-6 text-white">
          <h3 className="text-sm font-semibold font-display tracking-tight mb-3 text-white/90">
            How AptiCore Reduces Bias
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { step: "1", title: "Detect", desc: "Analyze candidate pool for demographic patterns and unconscious bias signals" },
              { step: "2", title: "Anonymize", desc: "Strip names, gender, college names, and location — keep only skills & experience" },
              { step: "3", title: "Rank by Merit", desc: "Hybrid AI matching scores candidates on skill fit alone — identity-blind" },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-3"
              >
                <div className="shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/80">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/95">{item.title}</p>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Distribution Charts — Before vs After ── */}
      <section ref={distributionReveal.ref}>
        <div
          className="flex items-center gap-4 mb-5"
          style={revealStyle(distributionReveal.isVisible, 0, 0)}
        >
          <h2 className="text-ink text-base sm:text-lg font-semibold font-display tracking-tight">
            Distribution Analysis
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-edge to-transparent" />
        </div>

        {/* Gender */}
        <div className="mb-6">
          <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-3">Gender Distribution</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div style={revealStyle(distributionReveal.isVisible, 0, 0.1)}>
              <DistributionChart
                title="Traditional — Gender"
                data={biasReport.before.genderDistribution}
                accentColor="#EF4444"
              />
            </div>
            <div style={revealStyle(distributionReveal.isVisible, 1, 0.1)}>
              <DistributionChart
                title="AptiCore — Gender"
                data={biasReport.after.genderDistribution}
              />
            </div>
          </div>
        </div>

        {/* College Tier */}
        <div className="mb-6">
          <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-3">College Tier</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div style={revealStyle(distributionReveal.isVisible, 2, 0.1)}>
              <DistributionChart
                title="Traditional — College Tier"
                data={biasReport.before.collegeTierDistribution}
                accentColor="#EF4444"
              />
            </div>
            <div style={revealStyle(distributionReveal.isVisible, 3, 0.1)}>
              <DistributionChart
                title="AptiCore — College Tier"
                data={biasReport.after.collegeTierDistribution}
                accentColor="#5BA08F"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-3">Location Type</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div style={revealStyle(distributionReveal.isVisible, 4, 0.1)}>
              <DistributionChart
                title="Traditional — Location"
                data={biasReport.before.locationDistribution}
                accentColor="#EF4444"
              />
            </div>
            <div style={revealStyle(distributionReveal.isVisible, 5, 0.1)}>
              <DistributionChart
                title="AptiCore — Location"
                data={biasReport.after.locationDistribution}
                accentColor="#8B5CF6"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

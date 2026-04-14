"use client";

import { useScrollReveal, revealStyle } from "../hooks/useScrollReveal";
import FairnessScoreCard from "./FairnessScoreCard";
import DistributionChart from "./DistributionChart";
import EmptyState from "./EmptyState";
import type { BiasReport } from "@/lib/types";

interface BiasReportViewProps {
  biasReport: BiasReport | null;
}

export default function BiasReportView({ biasReport }: BiasReportViewProps) {
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

  return (
    <div>
      {/* ── Fairness Score Comparison ── */}
      <div
        ref={scoresReveal.ref}
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8"
      >
        <div style={revealStyle(scoresReveal.isVisible, 0, 0.05)}>
          <FairnessScoreCard
            label="Before Anonymization"
            sublabel="Original pipeline score"
            score={biasReport.before.fairnessScore}
            variant="before"
            resetKey={biasReport.batchId}
          />
        </div>
        <div style={revealStyle(scoresReveal.isVisible, 1, 0.05)}>
          <FairnessScoreCard
            label="After Skill-Based Ranking"
            sublabel="AptiCore optimized score"
            score={biasReport.after.fairnessScore}
            variant="after"
            resetKey={biasReport.batchId}
          />
        </div>
      </div>

      {/* ── Improvements ── */}
      <section ref={improvementsReveal.ref} className="mb-8">
        <div
          className="flex items-center gap-4 mb-5"
          style={revealStyle(improvementsReveal.isVisible, 0, 0)}
        >
          <h2 className="text-ink text-lg font-semibold font-display tracking-tight">
            Improvements
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-edge to-transparent" />
        </div>

        <div className="space-y-3">
          {biasReport.improvements.map((imp, i) => (
            <div
              key={imp.metric}
              className="bg-white rounded-xl border border-edge p-5 transition-all duration-300 hover:shadow-[0_4px_16px_rgba(28,63,58,0.04)]"
              style={revealStyle(improvementsReveal.isVisible, i, 0.1)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-ink">{imp.metric}</h3>
                <span
                  className={`text-sm font-bold tabular-nums ${
                    imp.delta > 0
                      ? "text-emerald"
                      : imp.delta < 0
                      ? "text-red-500"
                      : "text-ink-muted"
                  }`}
                >
                  {imp.delta > 0 ? "+" : ""}
                  {imp.delta}%
                </span>
              </div>

              <p className="text-sm text-ink-light mb-3">{imp.description}</p>

              {/* Before → After bars */}
              {(() => {
                const isBiasMetric = imp.metric === "College Bias" || imp.metric === "Location Bias";
                const beforeColor = isBiasMetric ? "bg-red-400" : "bg-sky-400";
                const beforeTrack = isBiasMetric ? "bg-red-100" : "bg-sky-100";
                const afterColor = "bg-emerald-500";
                const afterTrack = "bg-emerald-100";
                const clampedBefore = Math.max(0, Math.min(imp.before, 100));
                const clampedAfter = Math.max(0, Math.min(imp.after, 100));

                return (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] text-ink-faint font-medium mb-1">
                        Before · {clampedBefore}%
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
                        After · {clampedAfter}%
                      </p>
                      <div className={`h-2 ${afterTrack} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full ${afterColor} rounded-full transition-all duration-1000`}
                          style={{ width: `${clampedAfter}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </section>

      {/* ── Distribution Charts — Before vs After ── */}
      <section ref={distributionReveal.ref}>
        <div
          className="flex items-center gap-4 mb-5"
          style={revealStyle(distributionReveal.isVisible, 0, 0)}
        >
          <h2 className="text-ink text-lg font-semibold font-display tracking-tight">
            Distribution Analysis
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-edge to-transparent" />
        </div>

        {/* Gender */}
        <div className="mb-6">
          <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-3">Gender Distribution</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={revealStyle(distributionReveal.isVisible, 0, 0.1)}>
              <DistributionChart
                title="Before — Gender"
                data={biasReport.before.genderDistribution}
                accentColor="#EF4444"
              />
            </div>
            <div style={revealStyle(distributionReveal.isVisible, 1, 0.1)}>
              <DistributionChart
                title="After — Gender"
                data={biasReport.after.genderDistribution}
              />
            </div>
          </div>
        </div>

        {/* College Tier */}
        <div className="mb-6">
          <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-3">College Tier</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={revealStyle(distributionReveal.isVisible, 2, 0.1)}>
              <DistributionChart
                title="Before — College Tier"
                data={biasReport.before.collegeTierDistribution}
                accentColor="#EF4444"
              />
            </div>
            <div style={revealStyle(distributionReveal.isVisible, 3, 0.1)}>
              <DistributionChart
                title="After — College Tier"
                data={biasReport.after.collegeTierDistribution}
                accentColor="#5BA08F"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <p className="text-[10px] text-ink-faint uppercase tracking-[0.15em] font-semibold mb-3">Location Type</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={revealStyle(distributionReveal.isVisible, 4, 0.1)}>
              <DistributionChart
                title="Before — Location"
                data={biasReport.before.locationDistribution}
                accentColor="#EF4444"
              />
            </div>
            <div style={revealStyle(distributionReveal.isVisible, 5, 0.1)}>
              <DistributionChart
                title="After — Location"
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

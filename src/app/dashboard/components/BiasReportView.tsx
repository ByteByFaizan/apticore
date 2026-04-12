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
        description="Select a completed batch from Overview to view its before & after fairness analysis."
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
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-ink-faint font-medium mb-1">
                    Before
                  </p>
                  <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all duration-1000"
                      style={{ width: `${imp.before}%` }}
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
                    After
                  </p>
                  <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${imp.after}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Distribution Charts (Recharts) ── */}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div style={revealStyle(distributionReveal.isVisible, 0, 0.1)}>
            <DistributionChart
              title="Gender Distribution"
              data={biasReport.after.genderDistribution}
            />
          </div>
          <div style={revealStyle(distributionReveal.isVisible, 1, 0.1)}>
            <DistributionChart
              title="College Tier"
              data={biasReport.after.collegeTierDistribution}
              accentColor="#5BA08F"
            />
          </div>
          <div style={revealStyle(distributionReveal.isVisible, 2, 0.1)}>
            <DistributionChart
              title="Location Type"
              data={biasReport.after.locationDistribution}
              accentColor="#8B5CF6"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

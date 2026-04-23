"use client";

import React, { useState } from "react";
import { useScrollReveal, revealStyle } from "../hooks/useScrollReveal";
import FairnessScoreCard from "./FairnessScoreCard";
import DistributionChart from "./DistributionChart";
import EmptyState from "./EmptyState";
import type { BiasReport, JobBatch } from "@/lib/types";

interface BiasReportViewProps {
  biasReport: BiasReport | null;
  activeBatch?: JobBatch | null;
  loading?: boolean;
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

/* ── Loading Skeleton ── */
function BiasReportSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading bias report">
      {/* Insight banner skeleton */}
      <div className="mb-6 rounded-2xl border border-edge bg-surface-alt/50 p-5 h-24" />

      {/* Score cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="rounded-2xl border border-edge bg-white p-6 h-52">
          <div className="h-3 w-24 bg-edge rounded mx-auto mb-6" />
          <div className="w-24 h-24 rounded-full bg-edge/60 mx-auto mb-3" />
          <div className="h-3 w-16 bg-edge rounded mx-auto" />
        </div>
        <div className="rounded-2xl border border-edge bg-white p-6 h-52">
          <div className="h-3 w-24 bg-edge rounded mx-auto mb-6" />
          <div className="w-24 h-24 rounded-full bg-edge/60 mx-auto mb-3" />
          <div className="h-3 w-16 bg-edge rounded mx-auto" />
        </div>
      </div>

      {/* Improvements skeleton */}
      <div className="mb-8">
        <div className="h-5 w-48 bg-edge rounded mb-5" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-edge bg-white p-5 h-28" />
          ))}
        </div>
      </div>

      {/* Distribution skeleton */}
      <div>
        <div className="h-5 w-40 bg-edge rounded mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-edge bg-white p-5 h-52" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BiasReportView({ biasReport, activeBatch, loading }: BiasReportViewProps) {
  const insightReveal = useScrollReveal(0.1, biasReport?.batchId);
  const scoresReveal = useScrollReveal(0.1, biasReport?.batchId);
  const improvementsReveal = useScrollReveal(0.1, biasReport?.batchId);
  const howItWorksReveal = useScrollReveal(0.1, biasReport?.batchId);
  const distributionReveal = useScrollReveal(0.1, biasReport?.batchId);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  /* ── Loading state ── */
  if (loading && !biasReport) {
    return <BiasReportSkeleton />;
  }

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
      {/* ── Batch Context Header ── */}
      {activeBatch && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            <span className="font-medium text-ink">{activeBatch.jdRequirements?.title || "Job Batch"}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            {activeBatch.candidateCount} candidates
          </span>
          {activeBatch.completedAt && (
            <span className="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              {new Date(activeBatch.completedAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}

      {/* ── Overall Insight Banner ── */}
      <div
        ref={insightReveal.ref}
        role="status"
        aria-label={`Fairness improvement: ${improvement} points`}
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

      {/* ── SDG-10 Alignment Badge ── */}
      <div className="mb-5 sm:mb-6 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-sky-50/80 border border-sky-200/40">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-[#DD1367] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-sky-800">
            UN SDG 10 — Reduced Inequalities
          </p>
          <p className="text-[11px] text-sky-600 leading-snug mt-0.5">
            AptiCore actively reduces hiring inequality by removing demographic bias from candidate evaluation.
          </p>
        </div>
        <a
          href="https://sdgs.un.org/goals/goal10"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-sky-500 hover:text-sky-700 underline underline-offset-2 shrink-0"
        >
          Learn more ↗
        </a>
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

        {/* ── Methodology Transparency (Collapsible) ── */}
        <div
          className="mb-4 rounded-xl border border-edge bg-surface-alt/40 overflow-hidden transition-all duration-300"
          style={revealStyle(improvementsReveal.isVisible, 0, 0.05)}
        >
          <button
            onClick={() => setMethodologyOpen(!methodologyOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-surface-alt/80 transition-colors"
            aria-expanded={methodologyOpen}
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span className="text-xs font-semibold text-ink-light">How We Calculate Fairness</span>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className={`text-ink-faint transition-transform duration-300 ${methodologyOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div
            className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              methodologyOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            <div className="px-4 pb-4 space-y-3 text-xs text-ink-light leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg border border-edge p-3">
                  <p className="font-semibold text-ink mb-1">Gender Parity (30%)</p>
                  <p>Min/Max ratio of male vs. female representation in top-half selections. Score of 1.0 = perfect parity.</p>
                </div>
                <div className="bg-white rounded-lg border border-edge p-3">
                  <p className="font-semibold text-ink mb-1">College Bias Index (25%)</p>
                  <p>Shannon entropy of college tier distribution. Lower entropy = higher concentration bias. Normalized 0→1.</p>
                </div>
                <div className="bg-white rounded-lg border border-edge p-3">
                  <p className="font-semibold text-ink mb-1">Location Bias Index (20%)</p>
                  <p>Shannon entropy of geographic distribution. Measures urban/suburban/rural concentration in selections.</p>
                </div>
                <div className="bg-white rounded-lg border border-edge p-3">
                  <p className="font-semibold text-ink mb-1">Merit Purity (25%)</p>
                  <p>Inverse of non-skill attribute weight. Measures how much identity factors influence final ranking.</p>
                </div>
              </div>
              <p className="text-[11px] text-ink-faint pt-1 border-t border-edge/50">
                <strong>Formula:</strong> Fairness Score = (Gender Parity × 30) + ((1 − College Bias) × 25) + ((1 − Location Bias) × 20) + ((1 − Non-Skill Weight) × 25). Range: 0–100.
              </p>
            </div>
          </div>
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
                role="group"
                aria-label={`${imp.metric}: ${imp.delta > 0 ? "+" : ""}${imp.delta}% change`}
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
                  <div className="flex-1" title={`Traditional pipeline: ${clampedBefore}%`}>
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
                  {/* Arrow: visible on desktop, "vs" label on mobile */}
                  <span className="text-[10px] text-ink-faint font-semibold sm:hidden text-center">vs</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="text-ink-faint shrink-0 hidden sm:block self-center mt-3"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                  <div className="flex-1" title={`AptiCore pipeline: ${clampedAfter}%`}>
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
      <section ref={howItWorksReveal.ref} className="mb-8">
        <div
          className="bg-gradient-to-br from-[#1C3F3A] to-[#2A5A52] rounded-2xl p-4 sm:p-6 text-white"
          style={revealStyle(howItWorksReveal.isVisible, 0, 0)}
        >
          <h3 className="text-sm font-semibold font-display tracking-tight mb-3 text-white/90">
            How AptiCore Reduces Bias
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { step: "1", title: "Detect", desc: "Analyze candidate pool for demographic patterns and unconscious bias signals" },
              { step: "2", title: "Anonymize", desc: "Strip names, gender, college names, and location — keep only skills & experience" },
              { step: "3", title: "Rank by Merit", desc: "Hybrid AI matching scores candidates on skill fit alone — identity-blind" },
            ].map((item, idx) => (
              <div
                key={item.step}
                className="flex gap-3"
                style={revealStyle(howItWorksReveal.isVisible, idx, 0.12)}
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

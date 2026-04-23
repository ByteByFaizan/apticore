"use client";

import { useCallback } from "react";
import { useScrollReveal, revealStyle } from "../hooks/useScrollReveal";
import CandidateCard from "./CandidateCard";
import EmptyState from "./EmptyState";
import type { JobBatch, CandidateResult } from "@/lib/types";

interface CandidateListProps {
  activeBatch: JobBatch | null;
  candidates: CandidateResult[];
  loading?: boolean;
}

/** Escape a value for CSV — wrap in quotes if it contains commas, newlines, or quotes */
function csvEscape(val: string): string {
  if (val.includes(",") || val.includes("\n") || val.includes('"')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/** Generate CSV string from candidates */
function generateCSV(candidates: CandidateResult[]): string {
  const headers = [
    "Rank", "Candidate ID", "Match Score", "Semantic Boost",
    "Education Level", "Experience Years", "Skills",
    "Name (Original)", "Gender (Original)", "College (Original)", "Location (Original)",
    "Parse Status", "Explanation",
  ];

  const rows = candidates.map((c) => [
    String(c.rank),
    c.anonymizedData.candidateId,
    String(c.matchScore),
    String(c.semanticBoost ?? 0),
    c.anonymizedData.educationLevel,
    String(c.anonymizedData.experienceYears),
    csvEscape(c.anonymizedData.skills.join(", ")),
    csvEscape(c.rawData?.name || ""),
    c.rawData?.gender || "",
    csvEscape(c.rawData?.college || ""),
    csvEscape(c.rawData?.location || ""),
    c.parseStatus || "SUCCESS",
    csvEscape(c.explanation || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/* ── Loading Skeleton ── */
function CandidateListSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading candidates">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="h-5 w-40 bg-edge rounded mb-2" />
          <div className="h-3 w-56 bg-edge/60 rounded" />
        </div>
        <div className="h-7 w-20 bg-edge rounded-full" />
      </div>

      {/* Card skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-edge p-5"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-edge/60" />
                  <div className="h-4 w-16 bg-edge rounded" />
                  <div className="h-5 w-20 bg-edge/40 rounded-full" />
                  <div className="h-5 w-16 bg-edge/40 rounded-full" />
                </div>
                <div className="flex gap-1.5 mb-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-5 w-14 bg-edge/30 rounded-full" />
                  ))}
                </div>
                <div className="h-3 w-full bg-edge/40 rounded mb-1.5" />
                <div className="h-3 w-3/4 bg-edge/30 rounded" />
              </div>
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-edge/40" />
                <div className="h-2 w-8 bg-edge/30 rounded mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CandidateList({
  activeBatch,
  candidates,
  loading,
}: CandidateListProps) {
  const { ref, isVisible } = useScrollReveal(0.05, activeBatch?.id);

  const handleExport = useCallback(() => {
    if (!candidates.length || !activeBatch) return;
    const title = activeBatch.jdRequirements?.title || "candidates";
    const csv = generateCSV(candidates);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `apticore-${title.toLowerCase().replace(/\s+/g, "-")}-results.csv`;
    document.body.appendChild(link);
    link.click();
    // Delay revoke to give browser time to start download
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }, [candidates, activeBatch]);

  /* ── Loading state ── */
  if (loading && !activeBatch && candidates.length === 0) {
    return <CandidateListSkeleton />;
  }

  if (!activeBatch) {
    return (
      <EmptyState
        title="No batch selected"
        description="Select a batch from the Overview tab to view its ranked candidates."
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
    );
  }

  // Count parse failures
  const failedCount = candidates.filter((c) => c.parseStatus === "PARSE_FAILED").length;
  const ocrCount = candidates.filter((c) => c.parseStatus === "NEEDS_OCR").length;

  return (
    <section ref={ref}>
      {/* Section header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-5"
        style={revealStyle(isVisible, 0, 0)}
      >
        <div>
          <h2 className="text-ink text-base sm:text-lg font-semibold font-display tracking-tight">
            {activeBatch.jdRequirements?.title || "Candidates"}
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Ranked by skill match — anonymized for fair evaluation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export CSV button */}
          {candidates.length > 0 && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:text-brand hover:bg-brand/5 transition-all duration-200 cursor-pointer"
              title="Export results as CSV"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          )}
          <span className="text-ink-faint text-xs font-medium px-3 py-1 rounded-full bg-surface-alt">
            {candidates.length} ranked
          </span>
        </div>
      </div>

      {/* Parse status warnings */}
      {(failedCount > 0 || ocrCount > 0) && (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/50 text-xs"
          style={revealStyle(isVisible, 0, 0.05)}
          role="alert"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-amber-700">
            {failedCount > 0 && (
              <span className="font-semibold">{failedCount} resume{failedCount > 1 ? "s" : ""} failed to parse</span>
            )}
            {failedCount > 0 && ocrCount > 0 && <span className="mx-1">·</span>}
            {ocrCount > 0 && (
              <span className="font-semibold">{ocrCount} need{ocrCount > 1 ? "" : "s"} OCR processing</span>
            )}
            <span className="text-amber-600 font-normal ml-1">— these candidates may have lower accuracy scores</span>
          </span>
        </div>
      )}

      {/* Cards */}
      {candidates.length === 0 ? (
        <EmptyState
          title="No candidates"
          description="This batch doesn't have any processed candidates yet."
        />
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {candidates.map((candidate, i) => (
            <div key={candidate.id} style={revealStyle(isVisible, i, 0.08)}>
              <CandidateCard candidate={candidate} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

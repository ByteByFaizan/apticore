"use client";

import { useCallback } from "react";
import { useScrollReveal, revealStyle } from "../hooks/useScrollReveal";
import CandidateCard from "./CandidateCard";
import EmptyState from "./EmptyState";
import type { JobBatch, CandidateResult } from "@/lib/types";

interface CandidateListProps {
  activeBatch: JobBatch | null;
  candidates: CandidateResult[];
}

/** Generate CSV string from candidates */
function generateCSV(candidates: CandidateResult[]): string {
  const headers = [
    "Rank", "Candidate ID", "Match Score", "Semantic Boost",
    "Education Level", "Experience Years", "Skills",
    "Name (Original)", "Gender (Original)", "College (Original)", "Location (Original)",
    "Explanation",
  ];

  const rows = candidates.map((c) => [
    c.rank,
    c.anonymizedData.candidateId,
    c.matchScore,
    c.semanticBoost ?? 0,
    c.anonymizedData.educationLevel,
    c.anonymizedData.experienceYears,
    `"${c.anonymizedData.skills.join(", ")}"`,
    `"${c.rawData?.name || ""}"`,
    c.rawData?.gender || "",
    `"${c.rawData?.college || ""}"`,
    `"${c.rawData?.location || ""}"`,
    `"${(c.explanation || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export default function CandidateList({
  activeBatch,
  candidates,
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
    link.click();
    URL.revokeObjectURL(url);
  }, [candidates, activeBatch]);

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

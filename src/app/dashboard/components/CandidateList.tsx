"use client";

import { useScrollReveal, revealStyle } from "../hooks/useScrollReveal";
import CandidateCard from "./CandidateCard";
import EmptyState from "./EmptyState";
import type { JobBatch, CandidateResult } from "@/lib/types";

interface CandidateListProps {
  activeBatch: JobBatch | null;
  candidates: CandidateResult[];
}

export default function CandidateList({
  activeBatch,
  candidates,
}: CandidateListProps) {
  const { ref, isVisible } = useScrollReveal(0.05, activeBatch?.id);

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
        className="flex items-center justify-between mb-5"
        style={revealStyle(isVisible, 0, 0)}
      >
        <div>
          <h2 className="text-ink text-lg font-semibold font-display tracking-tight">
            {activeBatch.jdRequirements?.title || "Candidates"}
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Ranked by skill match — anonymized for fair evaluation
          </p>
        </div>
        <span className="text-ink-faint text-xs font-medium px-3 py-1 rounded-full bg-surface-alt">
          {candidates.length} ranked
        </span>
      </div>

      {/* Cards */}
      {candidates.length === 0 ? (
        <EmptyState
          title="No candidates"
          description="This batch doesn't have any processed candidates yet."
        />
      ) : (
        <div className="space-y-3">
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

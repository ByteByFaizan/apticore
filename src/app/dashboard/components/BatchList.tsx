"use client";

import { useScrollReveal, revealStyle } from "../hooks/useScrollReveal";
import BatchCard from "./BatchCard";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";
import type { JobBatch } from "@/lib/types";

interface BatchListProps {
  batches: JobBatch[];
  loading: boolean;
  onViewBatch: (batchId: string) => void;
  onProcessBatch: (batchId: string) => void;
  onRetryBatch: (batchId: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onCreateBatch: () => void;
}

export default function BatchList({
  batches,
  loading,
  onViewBatch,
  onProcessBatch,
  onRetryBatch,
  onDeleteBatch,
  onCreateBatch,
}: BatchListProps) {
  const { ref, isVisible } = useScrollReveal(0.05);

  return (
    <section ref={ref}>
      {/* Section header */}
      <div
        className="flex items-center gap-4 mb-5"
        style={revealStyle(isVisible, 0, 0)}
      >
        <h2 className="text-ink text-lg font-semibold font-display tracking-tight">
          Recent Batches
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-edge to-transparent" />
        <span className="text-ink-faint text-xs font-medium">
          {batches.length} total
        </span>
      </div>

      {/* Content */}
      {loading && batches.length === 0 ? (
        <LoadingState message="Loading batches…" />
      ) : batches.length === 0 ? (
        <EmptyState
          title="No batches yet"
          description="Create your first batch to start analyzing resumes for bias and match candidates on pure merit."
          action={{ label: "Create First Batch", onClick: onCreateBatch }}
        />
      ) : (
        <div className="space-y-3">
          {batches.map((batch, i) => (
            <div key={batch.id} style={revealStyle(isVisible, i, 0.1)}>
              <BatchCard
                batch={batch}
                onView={onViewBatch}
                onProcess={onProcessBatch}
                onRetry={onRetryBatch}
                onDelete={onDeleteBatch}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


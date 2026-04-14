"use client";

import { useState, useEffect, useRef } from "react";
import type { JobBatch, ProcessingStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; bg: string; text: string; dot?: string }
> = {
  CREATED:              { label: "Created",       bg: "bg-gray-50",    text: "text-gray-600" },
  UPLOADING:            { label: "Ready",         bg: "bg-emerald-50", text: "text-emerald-700" },
  PARSING:              { label: "Parsing",       bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-400" },
  ANALYZING_BIAS_BEFORE:{ label: "Analyzing",     bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  ANONYMIZING:          { label: "Anonymizing",   bg: "bg-purple-50",  text: "text-purple-700", dot: "bg-purple-400" },
  MATCHING:             { label: "Matching",      bg: "bg-cyan-50",    text: "text-cyan-700",   dot: "bg-cyan-400" },
  RANKING:              { label: "Ranking",       bg: "bg-cyan-50",    text: "text-cyan-700",   dot: "bg-cyan-400" },
  EXPLAINING:           { label: "Explaining",    bg: "bg-indigo-50",  text: "text-indigo-700", dot: "bg-indigo-400" },
  ANALYZING_BIAS_AFTER: { label: "Final Check",   bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  COMPLETE:             { label: "Complete",      bg: "bg-emerald-50", text: "text-emerald-700" },
  FAILED:               { label: "Failed",        bg: "bg-red-50",     text: "text-red-700" },
};

/* Pipeline steps in order — used for progress indicator */
const PIPELINE_STEPS: ProcessingStatus[] = [
  "PARSING", "ANALYZING_BIAS_BEFORE", "ANONYMIZING",
  "MATCHING", "RANKING", "EXPLAINING", "ANALYZING_BIAS_AFTER",
];

/* Processing states that should show the pulsing dot */
const PROCESSING_STATES = new Set<ProcessingStatus>([
  "PARSING", "ANALYZING_BIAS_BEFORE", "ANONYMIZING",
  "MATCHING", "RANKING", "EXPLAINING", "ANALYZING_BIAS_AFTER",
]);

/* States where delete is NOT allowed (actively processing) */
const UNDELETABLE_STATES = new Set<ProcessingStatus>([
  "PARSING", "ANALYZING_BIAS_BEFORE", "ANONYMIZING",
  "MATCHING", "RANKING", "EXPLAINING", "ANALYZING_BIAS_AFTER",
]);

interface BatchCardProps {
  batch: JobBatch;
  onView: (batchId: string) => void;
  onProcess: (batchId: string) => void;
  onRetry: (batchId: string) => void;
  onDelete: (batchId: string) => void;
}

export default function BatchCard({ batch, onView, onProcess, onRetry, onDelete }: BatchCardProps) {
  const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.CREATED;
  const isProcessing = PROCESSING_STATES.has(batch.status);
  const canProcess = batch.status === "CREATED" || batch.status === "UPLOADING";
  const canRetry = batch.status === "FAILED";
  const canDelete = !UNDELETABLE_STATES.has(batch.status);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(batch.id);
      setConfirmDelete(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setConfirmDelete(true);
      // Auto-reset after 3 seconds
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  // Pipeline progress: which step are we on?
  const currentStepIdx = PIPELINE_STEPS.indexOf(batch.status);

  return (
    <div
      onClick={() => onView(batch.id)}
      className="group bg-white rounded-xl border border-edge hover:border-brand/20 p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_6px_24px_rgba(28,63,58,0.06)] hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        {/* Left — Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap mb-1.5">
            <h3 className="text-ink text-sm sm:text-base font-semibold font-display tracking-tight truncate max-w-[200px] sm:max-w-[260px]">
              {batch.jdRequirements?.title || "Pending Analysis"}
            </h3>

            {/* Status pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${cfg.bg} ${cfg.text}`}
            >
              {isProcessing && cfg.dot && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`}
                />
              )}
              {cfg.label}
            </span>
          </div>

          <p className="text-xs text-ink-muted">
            {batch.candidateCount} candidate{batch.candidateCount !== 1 ? "s" : ""}{" "}
            · {new Date(batch.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>

          {/* Error message for failed batches */}
          {batch.status === "FAILED" && batch.error && (
            <p className="text-xs text-red-500 mt-1.5 line-clamp-2">
              {batch.error}
            </p>
          )}

          {/* Required skills preview */}
          {batch.jdRequirements?.requiredSkills && batch.jdRequirements.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 overflow-x-auto pb-1">
              {batch.jdRequirements.requiredSkills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-full bg-brand/5 text-[10px] text-brand/70 font-medium whitespace-nowrap"
                >
                  {skill}
                </span>
              ))}
              {batch.jdRequirements.requiredSkills.length > 5 && (
                <span className="text-[10px] text-ink-faint self-center">
                  +{batch.jdRequirements.requiredSkills.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right — Score + Actions */}
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          {batch.fairnessScoreBefore != null &&
            batch.fairnessScoreAfter != null && (
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-ink-faint uppercase tracking-wider font-medium mb-0.5">
                  Fairness
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  <span className="text-red-500">{batch.fairnessScoreBefore}</span>
                  <span className="text-ink-faint mx-1.5">→</span>
                  <span className="text-emerald">{batch.fairnessScoreAfter}</span>
                </p>
              </div>
            )}

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {batch.status === "COMPLETE" && onView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(batch.id);
                }}
                className="px-3 py-1.5 rounded-full bg-gray-100 text-ink text-xs font-medium hover:bg-gray-200 transition-all"
              >
                View
              </button>
            )}

            {/* Process button — for new batches */}
            {canProcess && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProcess(batch.id);
                }}
                className="px-4 py-1.5 rounded-full bg-brand text-white text-xs font-medium hover:bg-brand-dark transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              >
                Process
              </button>
            )}

            {/* Retry button — for failed batches */}
            {canRetry && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry(batch.id);
                }}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-brand text-white text-[11px] sm:text-xs font-semibold hover:bg-brand-dark transition-all duration-200 shadow-sm hover:shadow cursor-pointer active:scale-[0.97]"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Retry
              </button>
            )}

            {/* Delete button — not during active processing */}
            {canDelete && (
              <button
                onClick={handleDelete}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                  confirmDelete
                    ? "bg-red-500 text-white shadow-sm hover:bg-red-600"
                    : "text-ink-faint hover:text-red-500 hover:bg-red-50"
                }`}
                title={confirmDelete ? "Click again to confirm" : "Delete batch"}
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
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {confirmDelete ? "Confirm" : ""}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Pipeline Progress Bar — visible during active processing ── */}
      {isProcessing && currentStepIdx >= 0 && (
        <div className="mt-4 pt-3 border-t border-edge/50 animate-fade-in-up">
          {/* Bars row — all equal height, no labels inside */}
          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
            {PIPELINE_STEPS.map((step, i) => {
              const isDone = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;
              return (
                <div
                  key={step}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    isDone
                      ? "bg-emerald"
                      : isCurrent
                      ? "bg-brand animate-pulse"
                      : "bg-gray-100"
                  }`}
                />
              );
            })}
          </div>
          {/* Label row — separate from bars to prevent alignment shift */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-brand font-semibold">
              {cfg.label}
            </span>
            <span className="text-[10px] text-ink-faint">
              Step {currentStepIdx + 1} of {PIPELINE_STEPS.length}
            </span>
          </div>
        </div>
      )}

      {/* Completion indicator — smooth transition from processing */}
      {batch.status === "COMPLETE" && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-edge/60">
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            <div className="h-1.5 w-full rounded-full bg-emerald" />
            <span className="text-[10px] text-emerald font-semibold whitespace-nowrap">
              ✓ Done
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

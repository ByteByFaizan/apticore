"use client";

import type { JobBatch, ProcessingStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; bg: string; text: string; dot?: string }
> = {
  CREATED:              { label: "Created",       bg: "bg-gray-50",    text: "text-gray-600" },
  UPLOADING:            { label: "Uploading",     bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-400" },
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

/* Processing states that should show the pulsing dot */
const PROCESSING_STATES = new Set<ProcessingStatus>([
  "UPLOADING", "PARSING", "ANALYZING_BIAS_BEFORE", "ANONYMIZING",
  "MATCHING", "RANKING", "EXPLAINING", "ANALYZING_BIAS_AFTER",
]);

interface BatchCardProps {
  batch: JobBatch;
  onView: (batchId: string) => void;
  onProcess: (batchId: string) => void;
}

export default function BatchCard({ batch, onView, onProcess }: BatchCardProps) {
  const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.CREATED;
  const isProcessing = PROCESSING_STATES.has(batch.status);
  const canProcess = batch.status === "CREATED" || batch.status === "UPLOADING";

  return (
    <div
      onClick={() => onView(batch.id)}
      className="group bg-white rounded-xl border border-edge hover:border-brand/20 p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_6px_24px_rgba(28,63,58,0.06)] hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left — Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <h3 className="text-sm font-semibold text-ink truncate">
              {batch.jdRequirements?.title || "Processing…"}
            </h3>

            {/* Status pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
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
        </div>

        {/* Right — Score + Action */}
        <div className="flex items-center gap-4">
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

          {/* Chevron */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-faint group-hover:text-ink-muted group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

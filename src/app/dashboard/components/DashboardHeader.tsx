"use client";

import { useScrollReveal, revealStyle } from "../hooks/useScrollReveal";

interface DashboardHeaderProps {
  userName: string;
  onCreateBatch: () => void;
}

export default function DashboardHeader({
  userName,
  onCreateBatch,
}: DashboardHeaderProps) {
  const { ref, isVisible } = useScrollReveal(0.1);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header ref={ref} className="mb-8" style={revealStyle(isVisible, 0, 0.05)}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-ink-faint text-xs font-semibold tracking-[0.15em] uppercase mb-1.5">
            {today}
          </p>
          <h1 className="text-ink text-2xl lg:text-[1.75rem] font-bold font-display tracking-tight leading-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-ink-muted text-sm mt-1 max-w-md">
            Manage your hiring batches, review candidates, and track bias
            reduction across your pipeline.
          </p>
        </div>

        <button
          onClick={onCreateBatch}
          className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand text-white text-sm font-medium shadow-[0_2px_8px_rgba(28,63,58,0.18)] hover:bg-brand-dark hover:shadow-[0_6px_20px_rgba(28,63,58,0.28)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer self-start sm:self-auto"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="group-hover:rotate-90 transition-transform duration-300"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Batch
        </button>
      </div>
    </header>
  );
}

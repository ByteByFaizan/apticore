"use client";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-sm">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-brand/5 flex items-center justify-center mx-auto mb-5">
          {icon || (
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
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          )}
        </div>

        <h3 className="text-ink text-lg font-semibold font-display tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-ink-muted text-sm leading-relaxed mb-6">
          {description}
        </p>

        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand text-white text-sm font-medium shadow-[0_2px_8px_rgba(28,63,58,0.18)] hover:bg-brand-dark hover:shadow-[0_4px_16px_rgba(28,63,58,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

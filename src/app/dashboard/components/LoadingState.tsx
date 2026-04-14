"use client";

interface LoadingStateProps {
  message?: string;
  /** Number of skeleton cards to show */
  skeletonCount?: number;
}

export default function LoadingState({
  message = "Loading…",
  skeletonCount = 3,
}: LoadingStateProps) {
  return (
    <div className="py-6">
      {/* Skeleton cards */}
      <div className="space-y-3 mb-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-edge p-5 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-4 w-40 bg-gray-100 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-24 bg-gray-50 rounded-full" />
                  <div className="h-3 w-1 bg-gray-50 rounded-full" />
                  <div className="h-3 w-32 bg-gray-50 rounded-full" />
                </div>
              </div>
              <div className="h-8 w-20 bg-gray-100 rounded-full" />
              <div className="h-4 w-4 bg-gray-50 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Subtle spinner + message below skeletons */}
      <div className="flex items-center justify-center gap-3">
        <div className="relative">
          <div className="w-5 h-5 rounded-full border-[2px] border-edge border-t-brand animate-spin" />
        </div>
        <p className="text-ink-muted text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

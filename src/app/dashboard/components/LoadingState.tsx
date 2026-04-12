"use client";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading…",
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-[2.5px] border-edge border-t-brand animate-spin" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-[2.5px] border-transparent border-b-accent/30 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
        </div>
        <p className="text-ink-muted text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

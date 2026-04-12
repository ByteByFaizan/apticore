"use client";

import type { CandidateResult } from "@/lib/types";

interface CandidateCardProps {
  candidate: CandidateResult;
}

export default function CandidateCard({ candidate }: CandidateCardProps) {
  const scoreColor =
    candidate.matchScore >= 80
      ? { ring: "border-emerald", text: "text-emerald", bg: "bg-emerald/5" }
      : candidate.matchScore >= 60
      ? { ring: "border-amber-400", text: "text-amber-600", bg: "bg-amber-50" }
      : { ring: "border-red-300", text: "text-red-500", bg: "bg-red-50" };

  return (
    <div className="group bg-white rounded-xl border border-edge hover:border-brand/20 p-5 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(28,63,58,0.06)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        {/* Left — Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2.5">
            {/* Rank badge */}
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand/10 to-accent/10 text-brand text-sm font-bold shrink-0">
              #{candidate.rank}
            </span>
            <h3 className="text-sm font-semibold text-ink">
              {candidate.anonymizedData.candidateId}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-alt text-[11px] text-ink-muted font-medium">
              {candidate.anonymizedData.educationLevel}
            </span>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {candidate.anonymizedData.skills.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-full bg-brand/5 text-xs text-brand/80 font-medium hover:bg-brand/10 transition-colors duration-200"
              >
                {skill}
              </span>
            ))}
            {candidate.anonymizedData.skills.length > 8 && (
              <span className="text-xs text-ink-faint self-center">
                +{candidate.anonymizedData.skills.length - 8} more
              </span>
            )}
          </div>

          {/* Explanation */}
          <p className="text-sm text-ink-light leading-relaxed">
            {candidate.explanation}
          </p>
        </div>

        {/* Right — Score ring */}
        <div className="ml-4 text-center shrink-0">
          <div
            className={`w-16 h-16 rounded-full border-[3.5px] flex items-center justify-center ${scoreColor.ring} ${scoreColor.bg} transition-all duration-300 group-hover:scale-105`}
          >
            <span className={`text-lg font-bold tabular-nums ${scoreColor.text}`}>
              {candidate.matchScore}
            </span>
          </div>
          <p className="text-[10px] text-ink-faint mt-1.5 font-medium uppercase tracking-wider">
            Match
          </p>
        </div>
      </div>

      {/* Skill breakdown */}
      <div className="mt-4 pt-4 border-t border-edge/50">
        <p className="text-[10px] text-ink-faint font-semibold mb-2 uppercase tracking-[0.1em]">
          Skill Breakdown
        </p>
        <div className="flex flex-wrap gap-1.5">
          {candidate.skillBreakdown.map((s) => (
            <span
              key={s.skill}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                s.matched
                  ? "bg-emerald-50 text-emerald-700"
                  : s.required
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <span className="text-[10px]">{s.matched ? "✓" : "✗"}</span>
              {s.skill}
              {s.required && !s.matched && (
                <span className="text-[9px] opacity-60">req</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

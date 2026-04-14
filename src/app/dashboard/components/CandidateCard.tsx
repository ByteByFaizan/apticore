"use client";

import { useState } from "react";
import type { CandidateResult } from "@/lib/types";

interface CandidateCardProps {
  candidate: CandidateResult;
}

export default function CandidateCard({ candidate }: CandidateCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const scoreColor =
    candidate.matchScore >= 80
      ? { ring: "border-emerald", text: "text-emerald", bg: "bg-emerald/5" }
      : candidate.matchScore >= 60
      ? { ring: "border-amber-400", text: "text-amber-600", bg: "bg-amber-50" }
      : { ring: "border-red-300", text: "text-red-500", bg: "bg-red-50" };

  const raw = candidate.rawData;
  const anon = candidate.anonymizedData;

  return (
    <div className="group bg-white rounded-xl border border-edge hover:border-brand/20 p-4 sm:p-5 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(28,63,58,0.06)] hover:-translate-y-0.5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        {/* Left — Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-2.5 flex-wrap">
            {/* Rank badge */}
            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-brand/10 to-accent/10 text-brand text-xs sm:text-sm font-bold shrink-0">
              #{candidate.rank}
            </span>
            <h3 className="text-sm font-semibold text-ink">
              {anon.candidateId}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-alt text-[11px] text-ink-muted font-medium">
              {anon.educationLevel}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-brand/5 text-[11px] text-brand/70 font-medium">
              {anon.experienceYears} yr{anon.experienceYears !== 1 ? "s" : ""} exp
            </span>
            {/* Semantic boost badge */}
            {(candidate.semanticBoost ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-[11px] text-indigo-600 font-semibold" title="Semantic matching boost from AI embeddings">
                +{candidate.semanticBoost} semantic
              </span>
            )}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
            {anon.skills.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-full bg-brand/5 text-xs text-brand/80 font-medium hover:bg-brand/10 transition-colors duration-200"
              >
                {skill}
              </span>
            ))}
            {anon.skills.length > 8 && (
              <span className="text-xs text-ink-faint self-center">
                +{anon.skills.length - 8} more
              </span>
            )}
          </div>

          {/* Explanation */}
          <p className="text-sm text-ink-light leading-relaxed">
            {candidate.explanation}
          </p>
        </div>

        {/* Right — Score ring */}
        <div className="sm:ml-4 text-center shrink-0 flex sm:flex-col items-center sm:items-center gap-2 sm:gap-0">
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-[3px] sm:border-[3.5px] flex items-center justify-center ${scoreColor.ring} ${scoreColor.bg} transition-all duration-300 group-hover:scale-105`}
          >
            <span className={`text-base sm:text-lg font-bold tabular-nums ${scoreColor.text}`}>
              {candidate.matchScore}
            </span>
          </div>
          <p className="text-[10px] text-ink-faint mt-1.5 font-medium uppercase tracking-wider">
            Match
          </p>
        </div>
      </div>

      {/* Skill breakdown */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-edge/50">
        <p className="text-[10px] text-ink-faint font-semibold mb-2 uppercase tracking-[0.1em]">
          Skill Breakdown
        </p>
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
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

      {/* ── Before/After Toggle — Reveal what was anonymized ── */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-edge/50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOriginal(!showOriginal);
          }}
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint hover:text-brand transition-colors cursor-pointer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${showOriginal ? "rotate-90" : ""}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {showOriginal ? "Hide Original Data" : "Reveal Original Data"}
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 normal-case tracking-normal font-medium">
            Was hidden from AI
          </span>
        </button>

        {showOriginal && raw && (
          <div className="mt-3 p-3 sm:p-4 bg-gradient-to-br from-amber-50/60 to-orange-50/30 rounded-xl border border-amber-100 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {/* Name */}
              <div>
                <p className="text-[9px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Name</p>
                <p className="text-sm text-ink font-medium">{raw.name || "—"}</p>
              </div>
              {/* Gender */}
              <div>
                <p className="text-[9px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Gender</p>
                <p className="text-sm text-ink font-medium capitalize">{raw.gender || "—"}</p>
              </div>
              {/* College */}
              <div>
                <p className="text-[9px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">College</p>
                <p className="text-sm text-ink font-medium">{raw.college || "—"}</p>
              </div>
              {/* Location */}
              <div>
                <p className="text-[9px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Location</p>
                <p className="text-sm text-ink font-medium">{raw.location || "—"}</p>
              </div>
              {/* Email */}
              {raw.email && (
                <div>
                  <p className="text-[9px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Email</p>
                  <p className="text-sm text-ink font-medium truncate">{raw.email}</p>
                </div>
              )}
              {/* College Tier */}
              {raw.collegeTier && raw.collegeTier !== "unknown" && (
                <div>
                  <p className="text-[9px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">College Tier</p>
                  <p className="text-sm text-ink font-medium capitalize">{raw.collegeTier}</p>
                </div>
              )}
              {/* Location Type */}
              {raw.locationType && raw.locationType !== "unknown" && (
                <div>
                  <p className="text-[9px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Area Type</p>
                  <p className="text-sm text-ink font-medium capitalize">{raw.locationType}</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-amber-600/70 mt-3 italic">
              ↑ This data was stripped before AI matching — ranking based purely on skills, experience \u0026 projects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Anonymizer — PII Removal & Candidate Masking
   PRD Step 4: Anonymization Layer
   ═══════════════════════════════════════════════ */

import type { CandidateRawData, AnonymizedCandidate } from "./types";

/**
 * Anonymize a single candidate — mask all PII and bias-triggering info.
 * Preserves ONLY: skills, experience years, project descriptions (scrubbed), education level.
 */
export function anonymizeCandidate(
  candidate: CandidateRawData,
  index: number
): AnonymizedCandidate {
  return {
    candidateId: `C-${(index + 1).toString().padStart(3, "0")}`,
    skills: [...candidate.skills],
    experienceYears: candidate.experienceYears,
    experience: candidate.experience.map((exp) => ({
      title: scrubPII(exp.title),
      duration: exp.duration,
      description: scrubPII(exp.description),
    })),
    projects: candidate.projects.map((proj) => ({
      description: scrubPII(proj.description),
      technologies: [...proj.technologies],
    })),
    educationLevel: extractEducationLevel(candidate.education),
    summary: candidate.summary ? scrubPII(candidate.summary) : undefined,
  };
}

/**
 * Anonymize entire batch of candidates.
 */
export function anonymizeBatch(candidates: CandidateRawData[]): AnonymizedCandidate[] {
  // Shuffle order to prevent position-based inference
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.map((c, i) => anonymizeCandidate(c, i));
}

/**
 * Extract highest education level (degree only, no institution).
 */
// [js-cache-property-access] Hoist education levels + entries at module level
const EDUCATION_LEVELS: Record<string, number> = {
  phd: 4,
  doctorate: 4,
  "ph.d": 4,
  masters: 3,
  "master's": 3,
  "m.tech": 3,
  "m.s": 3,
  mba: 3,
  "m.sc": 3,
  bachelors: 2,
  "bachelor's": 2,
  "b.tech": 2,
  "b.e": 2,
  "b.s": 2,
  "b.sc": 2,
  diploma: 1,
  certificate: 1,
};
const EDUCATION_ENTRIES = Object.entries(EDUCATION_LEVELS);

function extractEducationLevel(education: CandidateRawData["education"]): string {
  if (!education.length) return "Unknown";

  let highest = { level: 0, degree: "Unknown" };

  for (const edu of education) {
    const degreeLower = edu.degree.toLowerCase();
    for (const [key, level] of EDUCATION_ENTRIES) {
      if (degreeLower.includes(key) && level > highest.level) {
        highest = { level, degree: edu.degree };
      }
    }
  }

  return highest.degree;
}

// [js-hoist-regexp] Hoist RegExp patterns at module level.
// IMPORTANT: Using factory functions instead of module-level /g regex.
// RegExp with /g flag is STATEFUL (lastIndex persists between calls),
// causing intermittent match failures and PII leaks.
const PII_PATTERNS: Array<{ pattern: () => RegExp; replacement: string }> = [
  { pattern: () => /[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },
  { pattern: () => /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: "[PHONE]" },
  { pattern: () => /https?:\/\/[^\s]+/g, replacement: "[URL]" },
  { pattern: () => /linkedin\.com\/in\/[^\s]+/gi, replacement: "[LINKEDIN]" },
  { pattern: () => /github\.com\/[^\s]+/gi, replacement: "[GITHUB]" },
  { pattern: () => /\b(IIT|NIT|IIIT|BITS|ISI)\s*[-]?\s*\w+/gi, replacement: "[INSTITUTION]" },
  { pattern: () => /Indian Institute of Technology/gi, replacement: "[INSTITUTION]" },
  { pattern: () => /National Institute of Technology/gi, replacement: "[INSTITUTION]" },
  { pattern: () => /Indian Institute of Information Technology/gi, replacement: "[INSTITUTION]" },
  { pattern: () => /Birla Institute/gi, replacement: "[INSTITUTION]" },
  { pattern: () => /\b(he|she|his|her|him)\b/gi, replacement: "they" },
];

/**
 * Scrub PII from text — replace names, companies, colleges, locations
 * with generic placeholders.
 */
function scrubPII(text: string): string {
  if (!text) return text;

  let scrubbed = text;

  // Each call creates fresh regex instances (safe /g usage)
  for (const { pattern, replacement } of PII_PATTERNS) {
    scrubbed = scrubbed.replace(pattern(), replacement);
  }

  return scrubbed;
}

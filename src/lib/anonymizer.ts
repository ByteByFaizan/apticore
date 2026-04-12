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
function extractEducationLevel(education: CandidateRawData["education"]): string {
  if (!education.length) return "Unknown";

  const levels: Record<string, number> = {
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

  let highest = { level: 0, degree: "Unknown" };

  for (const edu of education) {
    const degreeLower = edu.degree.toLowerCase();
    for (const [key, level] of Object.entries(levels)) {
      if (degreeLower.includes(key) && level > highest.level) {
        highest = { level, degree: edu.degree };
      }
    }
  }

  return highest.degree;
}

// [js-hoist-regexp] Hoist RegExp creation outside function for reuse
const EMAIL_REGEX = /[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const URL_REGEX = /https?:\/\/[^\s]+/g;
const LINKEDIN_REGEX = /linkedin\.com\/in\/[^\s]+/gi;
const GITHUB_REGEX = /github\.com\/[^\s]+/gi;
const PRONOUN_REGEX = /\b(he|she|his|her|him)\b/gi;
const COLLEGE_PATTERNS = [
  /\b(IIT|NIT|IIIT|BITS|ISI)\s*[-]?\s*\w+/gi,
  /Indian Institute of Technology/gi,
  /National Institute of Technology/gi,
  /Indian Institute of Information Technology/gi,
  /Birla Institute/gi,
];

/**
 * Scrub PII from text — replace names, companies, colleges, locations
 * with generic placeholders.
 */
function scrubPII(text: string): string {
  if (!text) return text;

  let scrubbed = text;

  // Remove email addresses
  scrubbed = scrubbed.replace(EMAIL_REGEX, "[EMAIL]");

  // Remove phone numbers
  scrubbed = scrubbed.replace(PHONE_REGEX, "[PHONE]");

  // Remove URLs
  scrubbed = scrubbed.replace(URL_REGEX, "[URL]");

  // Remove LinkedIn profiles
  scrubbed = scrubbed.replace(LINKEDIN_REGEX, "[LINKEDIN]");

  // Remove GitHub profiles
  scrubbed = scrubbed.replace(GITHUB_REGEX, "[GITHUB]");

  // Common Indian college names (bias-triggering)
  for (const pattern of COLLEGE_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, "[INSTITUTION]");
  }

  // Remove gender pronouns that could indicate gender
  scrubbed = scrubbed.replace(PRONOUN_REGEX, "they");

  return scrubbed;
}

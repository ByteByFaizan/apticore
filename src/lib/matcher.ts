/* ═══════════════════════════════════════════════
   Matcher — Skill-Based Evaluation Engine
   PRD Steps 5 & 6: Matching + Ranking
   ═══════════════════════════════════════════════ */

import { getAIProvider } from "./ai/provider";
import type {
  AnonymizedCandidate,
  JDRequirements,
  SkillMatch,
} from "./types";

/**
 * Match a single candidate against JD requirements.
 * Returns match score (0-100) and per-skill breakdown.
 */
export function matchCandidateToJD(
  candidate: AnonymizedCandidate,
  jd: JDRequirements
): { score: number; skillBreakdown: SkillMatch[] } {
  const skillBreakdown: SkillMatch[] = [];
  const candidateSkillsLower = candidate.skills.map((s) => s.toLowerCase());
  // [js-set-map-lookups] O(1) for exact match checks
  const candidateSkillSet = new Set(candidateSkillsLower);

  // Score required skills (weighted 70%)
  for (const skill of jd.requiredSkills) {
    const matched = isSkillMatched(skill, candidateSkillsLower, candidateSkillSet);
    skillBreakdown.push({
      skill,
      required: true,
      matched,
      confidence: matched ? calculateConfidence(skill, candidateSkillsLower, candidateSkillSet) : 0,
    });
  }

  // Score preferred skills (weighted 20%)
  for (const skill of jd.preferredSkills) {
    const matched = isSkillMatched(skill, candidateSkillsLower, candidateSkillSet);
    skillBreakdown.push({
      skill,
      required: false,
      matched,
      confidence: matched ? calculateConfidence(skill, candidateSkillsLower, candidateSkillSet) : 0,
    });
  }

  // Calculate weighted score
  const requiredMatched = skillBreakdown.filter((s) => s.required && s.matched).length;
  const requiredTotal = jd.requiredSkills.length || 1;
  const preferredMatched = skillBreakdown.filter((s) => !s.required && s.matched).length;
  const preferredTotal = jd.preferredSkills.length || 1;

  const requiredScore = (requiredMatched / requiredTotal) * 70;
  const preferredScore = (preferredMatched / preferredTotal) * 20;

  // Experience bonus (10%)
  const expScore = Math.min(
    (candidate.experienceYears / Math.max(jd.minimumExperience, 1)) * 10,
    10
  );

  const totalScore = Math.round(requiredScore + preferredScore + expScore);

  return {
    score: Math.min(totalScore, 100),
    skillBreakdown,
  };
}

/**
 * Check if candidate has a matching skill (fuzzy match).
 */
function isSkillMatched(requiredSkill: string, candidateSkills: string[], skillSet: Set<string>): boolean {
  const req = requiredSkill.toLowerCase().trim();

  // [js-set-map-lookups] O(1) exact match first
  if (skillSet.has(req)) return true;

  return candidateSkills.some((cs) => {
    // Substring match (e.g., "react" matches "react.js")
    if (cs.includes(req) || req.includes(cs)) return true;
    // Common aliases
    if (SKILL_ALIASES[req]?.some((alias) => cs.includes(alias))) return true;
    if (SKILL_ALIASES[cs]?.some((alias) => req.includes(alias))) return true;
    return false;
  });
}

/**
 * Calculate match confidence for a skill (0-1).
 */
function calculateConfidence(requiredSkill: string, candidateSkills: string[], skillSet: Set<string>): number {
  const req = requiredSkill.toLowerCase().trim();

  // [js-set-map-lookups] O(1) exact match check
  if (skillSet.has(req)) return 1.0;

  for (const cs of candidateSkills) {
    if (cs.includes(req) || req.includes(cs)) return 0.85; // Substring
    if (SKILL_ALIASES[req]?.some((alias) => cs.includes(alias))) return 0.75; // Alias
  }

  return 0;
}

/**
 * Common skill aliases for fuzzy matching.
 */
const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "es6", "es2015"],
  typescript: ["ts"],
  "react": ["reactjs", "react.js"],
  "node.js": ["nodejs", "node"],
  python: ["py", "python3"],
  "machine learning": ["ml"],
  "artificial intelligence": ["ai"],
  "amazon web services": ["aws"],
  "google cloud platform": ["gcp", "google cloud"],
  "microsoft azure": ["azure"],
  postgresql: ["postgres", "psql"],
  mongodb: ["mongo"],
  "ci/cd": ["cicd", "continuous integration", "continuous deployment"],
  kubernetes: ["k8s"],
  docker: ["containerization"],
  "rest api": ["restful", "rest"],
  graphql: ["gql"],
  sql: ["mysql", "sqlite"],
  "data analysis": ["data analytics"],
  "natural language processing": ["nlp"],
  "deep learning": ["dl"],
  tensorflow: ["tf"],
  css: ["css3", "cascading style sheets"],
  html: ["html5"],
  "next.js": ["nextjs", "next"],
  vue: ["vuejs", "vue.js"],
  angular: ["angularjs"],
  "c++": ["cpp"],
  "c#": ["csharp", "c sharp"],
  java: ["jdk", "jvm"],
  go: ["golang"],
  rust: ["rustlang"],
  swift: ["swiftui"],
  kotlin: ["kt"],
  flutter: ["dart"],
  "react native": ["rn"],
};

/**
 * Rank all candidates by match score.
 * Returns candidates sorted by score descending with rank assigned.
 */
export function rankCandidates(
  results: { candidateId: string; score: number; skillBreakdown: SkillMatch[] }[]
): { candidateId: string; score: number; skillBreakdown: SkillMatch[]; rank: number }[] {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * Enhanced matching using vector embeddings (semantic similarity).
 * Use when keyword matching alone isn't sufficient.
 */
export async function semanticMatch(
  candidateSkills: string[],
  jdRequirements: JDRequirements
): Promise<number> {
  const ai = getAIProvider();

  const candidateText = candidateSkills.join(", ");
  const jdText = [...jdRequirements.requiredSkills, ...jdRequirements.preferredSkills].join(", ");

  try {
    const [candidateEmb, jdEmb] = await ai.generateEmbeddings([candidateText, jdText]);
    return cosineSimilarity(candidateEmb, jdEmb);
  } catch {
    // Fallback to keyword-only score
    return 0;
  }
}

/**
 * Cosine similarity between two vectors (pure JS math).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  // Convert from [-1, 1] to [0, 100]
  return Math.round(((dotProduct / denominator + 1) / 2) * 100);
}

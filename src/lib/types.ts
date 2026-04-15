/* ═══════════════════════════════════════════════
   AptiCore — Core Type Definitions
   ═══════════════════════════════════════════════ */

// ── Processing Pipeline Status ──
export type ProcessingStatus =
  | "CREATED"
  | "UPLOADING"
  | "PARSING"
  | "ANALYZING_BIAS_BEFORE"
  | "ANONYMIZING"
  | "MATCHING"
  | "RANKING"
  | "EXPLAINING"
  | "ANALYZING_BIAS_AFTER"
  | "COMPLETE"
  | "FAILED";

// ── Candidate Data ──
export interface CandidateRawData {
  name: string;
  email?: string;
  phone?: string;
  gender?: string;
  college: string;
  collegeTier?: "tier1" | "tier2" | "tier3" | "unknown";
  location: string;
  locationType?: "urban" | "rural" | "suburban" | "unknown";
  skills: string[];
  experienceYears: number;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  summary?: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year?: string;
  gpa?: string;
}

export interface AnonymizedCandidate {
  candidateId: string; // e.g. "C-101"
  skills: string[];
  experienceYears: number;
  experience: Omit<ExperienceEntry, "company">[];
  projects: Omit<ProjectEntry, "name">[];
  educationLevel: string; // "Bachelor's", "Master's", etc.
  summary?: string;
}

// ── Job Description ──
export interface JDRequirements {
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minimumExperience: number;
  educationLevel?: string;
  description: string;
}

// ── Job Batch ──
export interface JobBatch {
  id: string;
  userId: string;
  jdText: string;
  jdRequirements?: JDRequirements;
  status: ProcessingStatus;
  candidateCount: number;
  fairnessScoreBefore?: number;
  fairnessScoreAfter?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// ── Candidate Result (post-processing) ──
export interface CandidateResult {
  id: string;
  batchId: string;
  rawData: CandidateRawData;
  anonymizedData: AnonymizedCandidate;
  matchScore: number; // 0-100
  semanticBoost?: number; // 0-15 pts boost from semantic matching
  skillBreakdown: SkillMatch[];
  explanation: string;
  rank: number;
  parseStatus: "SUCCESS" | "PARSE_FAILED" | "NEEDS_OCR";
  parseError?: string;
}

export interface SkillMatch {
  skill: string;
  required: boolean; // required vs preferred
  matched: boolean;
  confidence: number; // 0-1
}

// ── Bias Report ──
export interface BiasReport {
  batchId: string;
  before: BiasMetrics;
  after: BiasMetrics;
  improvements: BiasImprovement[];
  overallImprovement: number; // positive = fairer after AptiCore
}

export interface BiasMetrics {
  fairnessScore: number; // 0-100
  genderDistribution: Record<string, number>; // { male: 0.6, female: 0.3, unknown: 0.1 }
  collegeTierDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
  genderParity: number; // 0-1 (1 = perfect parity)
  collegeBiasIndex: number; // 0-1 (0 = no bias)
  locationBiasIndex: number; // 0-1 (0 = no bias)
  nonSkillAttributeWeight: number; // 0-1 (0 = pure skill-based)
}

export interface BiasImprovement {
  metric: string;
  before: number;
  after: number;
  delta: number;
  description: string;
}

// ── AI Provider ──
export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: "gemini-2.5-pro" | "gemini-2.5-flash";
}

export interface AICompletionResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

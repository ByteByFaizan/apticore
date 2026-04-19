/* ═══════════════════════════════════════════════
   Gemini Client — Resume Parsing, PII Detection,
   JD Extraction & Explainability
   Production-Grade: Deterministic, Validated, Robust
   ═══════════════════════════════════════════════ */

import { z } from "zod";
import { getAIProvider } from "./ai/provider";
import { logger } from "./logger";
import type {
  CandidateRawData,
  JDRequirements,
  SkillMatch,
} from "./types";

// ── Input truncation constants ──
// ~4 chars per token on average; cap to stay well within context window
const MAX_RESUME_CHARS = 15_000;
const MAX_JD_CHARS = 10_000;

/**
 * Truncate text to max characters with a warning.
 */
function truncateInput(text: string, maxChars: number, label: string): string {
  if (text.length <= maxChars) return text;
  logger.warn(`[AI] ${label} truncated`, {
    original: text.length,
    truncated: maxChars,
  });
  return text.slice(0, maxChars) + "\n\n[... truncated due to length]";
}

// ═══════════════════════════════════════════════
// Validation Schemas — Zod v4
// Validates AI JSON output structure and completeness
// ═══════════════════════════════════════════════

const ExperienceEntrySchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  duration: z.string().default(""),
  description: z.string().default(""),
});

const ProjectEntrySchema = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  technologies: z.array(z.string()).default([]),
});

const EducationEntrySchema = z.object({
  degree: z.string().default(""),
  institution: z.string().default(""),
  year: z.string().nullable().optional(),
  gpa: z.string().nullable().optional(),
});

const ResumeParseSchema = z.object({
  name: z.string().default("Unknown"),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "non-binary", "unknown"]).default("unknown"),
  college: z.string().default("Unknown"),
  collegeTier: z.enum(["tier1", "tier2", "tier3", "unknown"]).default("unknown"),
  location: z.string().default("Unknown"),
  locationType: z.enum(["urban", "rural", "suburban", "unknown"]).default("unknown"),
  skills: z.array(z.string()).default([]),
  experienceYears: z.number().default(0),
  experience: z.array(ExperienceEntrySchema).default([]),
  projects: z.array(ProjectEntrySchema).default([]),
  education: z.array(EducationEntrySchema).default([]),
  summary: z.string().optional(),
});

const JDParseSchema = z.object({
  title: z.string().default("Unknown Position"),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  minimumExperience: z.number().default(0),
  educationLevel: z.string().default("Any"),
  description: z.string().default(""),
});

/**
 * Safely parse JSON from AI response — handles markdown fencing, BOM, etc.
 */
function safeParseJSON(raw: string): unknown {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  // Strip BOM
  if (cleaned.charCodeAt(0) === 0xfeff) {
    cleaned = cleaned.slice(1);
  }

  return JSON.parse(cleaned.trim());
}

// ═══════════════════════════════════════════════
// PROMPT 1: Resume Parsing — A → A+
// ═══════════════════════════════════════════════

const RESUME_PARSE_SYSTEM_PROMPT = `You are an expert resume parsing engine built for an AI-powered fair hiring platform. Your task is to extract structured, bias-aware data from raw resume text.

## OUTPUT SCHEMA
Return ONLY valid JSON matching this exact schema — no markdown, no explanation, no wrapping:
{
  "name": "string (full name as written)",
  "email": "string or null",
  "phone": "string or null",
  "gender": "male|female|non-binary|unknown",
  "college": "string (primary/most recent institution name)",
  "collegeTier": "tier1|tier2|tier3|unknown",
  "location": "string (city, state/country)",
  "locationType": "urban|rural|suburban|unknown",
  "skills": ["string[]"],
  "experienceYears": number,
  "experience": [{"title":"string","company":"string","duration":"string","description":"string"}],
  "projects": [{"name":"string","description":"string","technologies":["string"]}],
  "education": [{"degree":"string","institution":"string","year":"string or null","gpa":"string or null"}],
  "summary": "string (1-2 sentence professional summary)"
}

## CRITICAL RULES

### Gender Detection
- ONLY detect gender from explicit pronouns in the resume body text (he/him → male, she/her → female, they/them → non-binary).
- NEVER infer gender from the candidate's name, regardless of cultural context.
- Default to "unknown" if no pronouns are found. This is the expected outcome for most resumes.

### College Tier Classification
- tier1: IIT, NIT, IIIT, BITS, ISI, IISc, IIM, top-50 global universities (MIT, Stanford, Oxbridge, etc.)
- tier2: State universities, well-known private universities (VIT, SRM, Manipal, KIIT, etc.)
- tier3: All other institutions
- unknown: If institution cannot be identified or is not listed

### Location Type Classification
- urban: Major metros (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune, Kolkata, NYC, SF, London, etc.)
- suburban: Satellite cities and suburbs (Noida, Gurgaon, Thane, etc.)
- rural: Small towns, non-metro areas
- unknown: If location cannot be determined

### Skill Extraction — BE EXHAUSTIVE
Extract ALL of the following categories:
1. Programming languages (Python, Java, C++, JavaScript, etc.)
2. Frameworks & libraries (React, Django, Spring Boot, TensorFlow, etc.)
3. Cloud & DevOps (AWS, GCP, Azure, Docker, Kubernetes, CI/CD, etc.)
4. Databases (PostgreSQL, MongoDB, Redis, MySQL, etc.)
5. Tools & platforms (Git, Jira, Figma, Postman, etc.)
6. Methodologies (Agile, Scrum, TDD, Microservices, etc.)
7. Soft skills ONLY if explicitly stated (Leadership, Communication, etc.)
8. Domain expertise (Machine Learning, Data Engineering, Cybersecurity, etc.)
- Normalize skill names: "ReactJS" → "React", "NodeJS" → "Node.js", "k8s" → "Kubernetes"
- Include skills mentioned in project descriptions and experience sections, not just a "Skills" section
- Do NOT hallucinate skills. Only extract what is explicitly mentioned or clearly demonstrated.

### Experience Calculation
- Calculate "experienceYears" as total professional work experience in years (round to nearest integer)
- Internships count as 0.5 years each unless duration is specified
- Do NOT count academic projects as experience
- For freshers/students with no work experience, set to 0

### Handling Edge Cases
- Multi-page resumes: Parse ALL sections. Do not skip content after the first page.
- Non-standard formats: Handle resumes that use tables, columns, or creative layouts.
- Multiple roles at same company: List each role as a separate experience entry.
- Missing sections: Use empty arrays [] for missing experience/projects/education, not null.
- Garbled/corrupted text: Extract whatever is readable. Set "summary" to note poor text quality.`;

/**
 * Parse raw resume text into structured candidate data.
 * Deterministic (temperature=0) with Zod validation and retry on failure.
 */
export async function parseResume(rawText: string): Promise<CandidateRawData> {
  const ai = getAIProvider();
  const safeText = truncateInput(rawText, MAX_RESUME_CHARS, "Resume text");

  const messages = [
    {
      role: "system" as const,
      content: RESUME_PARSE_SYSTEM_PROMPT,
    },
    {
      role: "user" as const,
      content: `Extract structured data from this resume. Return only valid JSON, no markdown fencing.\n\n---\n${safeText}\n---`,
    },
  ];

  // Attempt 1: Standard parse
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await ai.complete({
        messages: attempt === 0 ? messages : [
          ...messages,
          {
            role: "assistant" as const,
            content: lastError?.message || "Invalid JSON",
          },
          {
            role: "user" as const,
            content: "Your previous response was not valid JSON. Return ONLY the JSON object, no markdown, no explanation. Fix the JSON syntax and try again.",
          },
        ],
        temperature: 0,
        maxTokens: 4096,
        jsonMode: true,
      });

      const rawParsed = safeParseJSON(result.content);
      const validated = ResumeParseSchema.parse(rawParsed);

      return {
        name: validated.name || "Unknown",
        email: validated.email || undefined,
        phone: validated.phone || undefined,
        gender: validated.gender || "unknown",
        college: validated.college || "Unknown",
        collegeTier: validated.collegeTier || "unknown",
        location: validated.location || "Unknown",
        locationType: validated.locationType || "unknown",
        skills: validated.skills,
        experienceYears: validated.experienceYears,
        experience: validated.experience.map((e) => ({
          title: e.title,
          company: e.company,
          duration: e.duration,
          description: e.description,
        })),
        projects: validated.projects.map((p) => ({
          name: p.name,
          description: p.description,
          technologies: p.technologies,
        })),
        education: validated.education.map((e) => ({
          degree: e.degree,
          institution: e.institution,
          year: e.year || undefined,
          gpa: e.gpa || undefined,
        })),
        summary: validated.summary,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`[AI] Resume parse attempt ${attempt + 1} failed`, {
        error: lastError.message,
      });

      // Only retry on JSON/validation errors, not network errors
      if (attempt === 0 && (lastError.message.includes("JSON") || lastError.message.includes("parse") || lastError.message.includes("Expected"))) {
        continue; // retry with correction prompt
      }
      break;
    }
  }

  logger.error("[AI] Resume parse failed after retries", {
    error: lastError?.message,
  });
  throw new Error(`Failed to parse resume: ${lastError?.message || "Unknown error"}`);
}

// ═══════════════════════════════════════════════
// PROMPT 2: JD Extraction — A → A+
// ═══════════════════════════════════════════════

const JD_EXTRACT_SYSTEM_PROMPT = `You are an expert job description analyzer for a fair hiring platform. Extract structured requirements that will be used to score candidates purely on skills and experience.

## OUTPUT SCHEMA
Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "title": "string (exact job title)",
  "requiredSkills": ["string[] — must-have skills"],
  "preferredSkills": ["string[] — nice-to-have skills"],
  "minimumExperience": number (years, integer),
  "educationLevel": "Bachelor's|Master's|PhD|Any",
  "description": "string (1-2 sentence role summary)"
}

## EXTRACTION RULES

### Skill Classification — This Is Critical
The distinction between required and preferred skills directly impacts candidate scoring.

REQUIRED skills — Look for these signals:
- "Must have", "Required", "Essential", "Mandatory"
- Skills listed under "Requirements" or "Qualifications" sections
- Skills mentioned as prerequisites or deal-breakers
- Core technology stack of the role (e.g., React for a frontend role)

PREFERRED skills — Look for these signals:
- "Nice to have", "Preferred", "Bonus", "Plus", "Advantageous"
- Skills listed under "Preferred Qualifications" or "Nice to Have" sections
- Skills that enhance candidacy but aren't essential

When ambiguous:
- If a JD doesn't clearly separate required/preferred, classify the PRIMARY tech stack as required and everything else as preferred.
- If skills are simply listed without priority signals, split: first 60% as required, remaining 40% as preferred.

### Skill Normalization
- Normalize to canonical names: "ReactJS" → "React", "Node" → "Node.js", "k8s" → "Kubernetes"
- Keep skills atomic: "Python and Java" → ["Python", "Java"] (separate entries)
- Include both specific tools AND broader categories when mentioned: "AWS Lambda" → ["AWS", "AWS Lambda"]
- Remove vague terms: "proficiency in relevant technologies" is NOT a skill

### Experience
- Parse explicit requirements: "3+ years" → 3, "5-7 years" → 5 (use minimum)
- "Entry level" or "Fresh graduate" → 0
- "Mid-level" → 3, "Senior" → 5 (reasonable defaults when not specified)
- If no experience mentioned → 0

### Education
- "BS/MS required" → "Bachelor's" (use the lower requirement)
- "PhD preferred" with "Master's required" → "Master's"
- No education mentioned → "Any"

### Description
- Write a factual 1-2 sentence summary of what the role does
- Do NOT copy marketing language from the JD
- Focus on: what the person will build/do + which team/domain`;

/**
 * Extract structured requirements from Job Description text.
 * Deterministic (temperature=0) with Zod validation and retry.
 */
export async function extractJDRequirements(jdText: string): Promise<JDRequirements> {
  const ai = getAIProvider();
  const safeText = truncateInput(jdText, MAX_JD_CHARS, "JD text");

  const messages = [
    {
      role: "system" as const,
      content: JD_EXTRACT_SYSTEM_PROMPT,
    },
    {
      role: "user" as const,
      content: `Extract structured requirements from this job description. Return only valid JSON, no markdown fencing.\n\n---\n${safeText}\n---`,
    },
  ];

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await ai.complete({
        messages: attempt === 0 ? messages : [
          ...messages,
          {
            role: "assistant" as const,
            content: lastError?.message || "Invalid JSON",
          },
          {
            role: "user" as const,
            content: "Your previous response was not valid JSON. Return ONLY the JSON object, no markdown, no explanation. Fix the JSON syntax and try again.",
          },
        ],
        temperature: 0,
        maxTokens: 2048,
        jsonMode: true,
      });

      const rawParsed = safeParseJSON(result.content);
      const validated = JDParseSchema.parse(rawParsed);

      return {
        title: validated.title,
        requiredSkills: validated.requiredSkills,
        preferredSkills: validated.preferredSkills,
        minimumExperience: validated.minimumExperience,
        educationLevel: validated.educationLevel,
        description: validated.description,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`[AI] JD parse attempt ${attempt + 1} failed`, {
        error: lastError.message,
      });

      if (attempt === 0 && (lastError.message.includes("JSON") || lastError.message.includes("parse") || lastError.message.includes("Expected"))) {
        continue;
      }
      break;
    }
  }

  logger.error("[AI] JD parse failed after retries", {
    error: lastError?.message,
  });
  throw new Error(`Failed to parse JD requirements: ${lastError?.message || "Unknown error"}`);
}

// ═══════════════════════════════════════════════
// PROMPT 3: Explainability — Temperature 0 for Determinism
// ═══════════════════════════════════════════════

const EXPLANATION_SYSTEM_PROMPT = `You are the Explainability Engine of AptiCore, a fair hiring platform. Generate a concise, factual explanation for why a candidate received their match score.

## RULES
1. Write exactly 2-3 sentences. No more.
2. Be specific — name actual skills, not categories.
3. Be factual — never use vague praise like "strong candidate" or "impressive background".
4. Never mention the candidate's name, gender, college, or location — this is an anonymized assessment.
5. Always follow this structure:
   - Sentence 1: Score summary with key strength(s)
   - Sentence 2: Specific matched skills (name 2-4 most relevant)
   - Sentence 3: Gaps or areas not covered (if any)

## SCORE INTERPRETATION
- 90-100%: Exceptional match — covers virtually all requirements
- 70-89%: Strong match — most required skills present, minor gaps
- 50-69%: Moderate match — has core skills but significant gaps
- 30-49%: Partial match — has some relevant skills
- 0-29%: Weak match — skills don't align well with requirements

## EXAMPLES
Good: "Scored 82% for Senior Backend Engineer — strong alignment in core required skills. Matched Python, PostgreSQL, REST APIs, and Docker. Missing required skills: Kubernetes and message queue experience (RabbitMQ/Kafka)."

Good: "Scored 45% for Data Scientist — partial match with foundational skills present. Candidate has Python and SQL, which are required. However, missing critical requirements: TensorFlow, statistical modeling, and cloud ML deployment experience."

Bad (too vague): "The candidate is a strong match and would be a great fit for the team."
Bad (mentions identity): "Despite being from a tier-2 college, the candidate shows promise."

## FORMAT
Return ONLY the explanation text. No JSON, no labels, no prefixes. Just the 2-3 sentences.`;

/**
 * Generate human-readable explanation for a candidate's score.
 * PRD Step 7: Explainability Engine.
 * DETERMINISTIC: temperature=0, same input → same output.
 */
export async function generateExplanation(
  candidateSkills: string[],
  jdRequirements: JDRequirements,
  matchScore: number,
  skillBreakdown: SkillMatch[]
): Promise<string> {
  const ai = getAIProvider();

  const matchedRequired = skillBreakdown.filter((s) => s.matched && s.required).map((s) => s.skill);
  const missingRequired = skillBreakdown.filter((s) => !s.matched && s.required).map((s) => s.skill);
  const matchedPreferred = skillBreakdown.filter((s) => s.matched && !s.required).map((s) => s.skill);
  const totalRequired = skillBreakdown.filter((s) => s.required).length;

  try {
    const result = await ai.complete({
      messages: [
        {
          role: "system",
          content: EXPLANATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Generate a 2-3 sentence explanation for this candidate assessment:

Match Score: ${matchScore}%
Position: ${jdRequirements.title}
Required Skills Matched: ${matchedRequired.join(", ") || "None"} (${matchedRequired.length}/${totalRequired})
Required Skills Missing: ${missingRequired.join(", ") || "None"}
Preferred Skills Matched: ${matchedPreferred.join(", ") || "None"}
Candidate's Full Skill Set: ${candidateSkills.slice(0, 25).join(", ")}
Minimum Experience Required: ${jdRequirements.minimumExperience} years`,
        },
      ],
      temperature: 0,    // DETERMINISTIC — was 0.2, caused inconsistent outputs
      maxTokens: 800,     // Was 300 — caused truncated explanations
      model: "gemini-2.5-flash",
    });

    const explanation = result.content.trim();

    // Validate explanation is not empty or too short
    if (!explanation || explanation.length < 20) {
      return buildFallbackExplanation(matchScore, jdRequirements.title, matchedRequired, missingRequired);
    }

    return explanation;
  } catch (err) {
    logger.warn("[AI] Explanation generation failed, using fallback", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return buildFallbackExplanation(matchScore, jdRequirements.title, matchedRequired, missingRequired);
  }
}

/**
 * Build a deterministic fallback explanation when AI fails.
 * Ensures no blank or truncated explanations ever reach the user.
 */
function buildFallbackExplanation(
  score: number,
  position: string,
  matchedRequired: string[],
  missingRequired: string[]
): string {
  const tier = score >= 90
    ? "exceptional"
    : score >= 70
      ? "strong"
      : score >= 50
        ? "moderate"
        : score >= 30
          ? "partial"
          : "weak";

  let explanation = `Scored ${score}% for ${position} — ${tier} match.`;

  if (matchedRequired.length > 0) {
    explanation += ` Matched required skills: ${matchedRequired.slice(0, 4).join(", ")}.`;
  }

  if (missingRequired.length > 0) {
    explanation += ` Missing required skills: ${missingRequired.slice(0, 4).join(", ")}.`;
  } else if (matchedRequired.length === 0) {
    explanation += " No required skill matches were identified.";
  }

  return explanation;
}

// ═══════════════════════════════════════════════
// UTILITY: Resume Content Hash for Deduplication
// ═══════════════════════════════════════════════

/**
 * Generate content hash for resume deduplication.
 * Avoids re-parsing the same resume across batches.
 */
export function hashResumeContent(text: string): string {
  // DJB2-style hash of first 5000 chars (normalized)
  const sample = text.slice(0, 5000).trim().toLowerCase().replace(/\s+/g, " ");
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const chr = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return `resume_${Math.abs(hash).toString(36)}`;
}

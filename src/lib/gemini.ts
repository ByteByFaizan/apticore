/* ═══════════════════════════════════════════════
   Gemini Client — Resume Parsing, PII Detection,
   JD Extraction & Explainability
   ═══════════════════════════════════════════════ */

import { getAIProvider } from "./ai/provider";
import type {
  CandidateRawData,
  JDRequirements,
  SkillMatch,
} from "./types";

/**
 * Parse raw resume text into structured candidate data.
 * Uses Gemini 2.5 Pro to extract skills, experience, education, PII.
 */
export async function parseResume(rawText: string): Promise<CandidateRawData> {
  const ai = getAIProvider();

  const result = await ai.complete({
    messages: [
      {
        role: "system",
        content: `You are a resume parsing AI. Extract structured data from resume text.
Return ONLY valid JSON with this exact schema:
{
  "name": "string",
  "email": "string or null",
  "phone": "string or null",
  "gender": "male|female|unknown (infer from name/pronouns, default unknown)",
  "college": "string (institution name)",
  "collegeTier": "tier1|tier2|tier3|unknown (tier1=IIT/NIT/IIIT/top global, tier2=state universities/good private, tier3=other)",
  "location": "string (city/state)",
  "locationType": "urban|rural|suburban|unknown",
  "skills": ["array of technical and soft skills"],
  "experienceYears": number,
  "experience": [{"title":"string","company":"string","duration":"string","description":"string"}],
  "projects": [{"name":"string","description":"string","technologies":["string"]}],
  "education": [{"degree":"string","institution":"string","year":"string or null","gpa":"string or null"}],
  "summary": "brief 1-2 sentence professional summary"
}
Be thorough in skill extraction — include programming languages, frameworks, tools, methodologies, soft skills.
If information is missing, use reasonable defaults (empty string, empty array, 0, "unknown").`,
      },
      {
        role: "user",
        content: `Parse this resume:\n\n${rawText}`,
      },
    ],
    temperature: 0.1,
    maxTokens: 4096,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(result.content);
    return {
      name: parsed.name || "Unknown",
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      gender: parsed.gender || "unknown",
      college: parsed.college || "Unknown",
      collegeTier: parsed.collegeTier || "unknown",
      location: parsed.location || "Unknown",
      locationType: parsed.locationType || "unknown",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experienceYears: Number(parsed.experienceYears) || 0,
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      summary: parsed.summary || undefined,
    };
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }
}

/**
 * Extract structured requirements from Job Description text.
 */
export async function extractJDRequirements(jdText: string): Promise<JDRequirements> {
  const ai = getAIProvider();

  const result = await ai.complete({
    messages: [
      {
        role: "system",
        content: `You are a job description analyzer. Extract structured requirements.
Return ONLY valid JSON:
{
  "title": "job title",
  "requiredSkills": ["must-have skills"],
  "preferredSkills": ["nice-to-have skills"],
  "minimumExperience": number (years),
  "educationLevel": "Bachelor's|Master's|PhD|Any",
  "description": "brief role summary"
}
Be precise — separate must-haves from nice-to-haves carefully.`,
      },
      {
        role: "user",
        content: `Analyze this job description:\n\n${jdText}`,
      },
    ],
    temperature: 0.1,
    maxTokens: 2048,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(result.content);
    return {
      title: parsed.title || "Unknown Position",
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
      preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
      minimumExperience: Number(parsed.minimumExperience) || 0,
      educationLevel: parsed.educationLevel || "Any",
      description: parsed.description || "",
    };
  } catch {
    throw new Error("Failed to parse JD requirements from AI response");
  }
}

/**
 * Generate human-readable explanation for a candidate's score.
 * PRD Step 7: Explainability Engine.
 */
export async function generateExplanation(
  candidateSkills: string[],
  jdRequirements: JDRequirements,
  matchScore: number,
  skillBreakdown: SkillMatch[]
): Promise<string> {
  const ai = getAIProvider();

  const matchedSkills = skillBreakdown.filter((s) => s.matched).map((s) => s.skill);
  const missingSkills = skillBreakdown.filter((s) => !s.matched && s.required).map((s) => s.skill);

  const result = await ai.complete({
    messages: [
      {
        role: "system",
        content: `You are an explainable AI system. Generate a clear, 2-3 sentence explanation for why a candidate received their score.
Be specific about matched and missing skills. Be factual; do not use vague praise.
Format: Start with the score context, then mention key matches, then gaps.
Example: "Candidate scored 85% — strong match in Python, React, and AWS. Missing required skill: Data Analysis. Experience (5 years) exceeds the 3-year minimum."`,
      },
      {
        role: "user",
        content: `Generate explanation for:
- Match Score: ${matchScore}%
- Job: ${jdRequirements.title}
- Required Skills Matched: ${matchedSkills.join(", ") || "None"}
- Required Skills Missing: ${missingSkills.join(", ") || "None"}
- Candidate Skills: ${candidateSkills.join(", ")}
- Required Experience: ${jdRequirements.minimumExperience} years`,
      },
    ],
    temperature: 0.4,
    maxTokens: 512,
  });

  return result.content.trim();
}

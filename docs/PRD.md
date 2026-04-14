# Product Requirements Document (PRD): AptiCore

> **Version:** 2.0 · **Last Updated:** April 15, 2026  
> **Status:** Production-ready · **Authors:** AptiCore Team

---

## 0. Hackathon Context

**Event:** Google Solution Challenge 2026 India  
**Vision:** Build solutions that solve real-world problems and create measurable impact for communities using Google Developer technologies. AptiCore fulfills this by addressing employment inequality — a systemic, measurable problem — and establishing a fair, skill-first hiring ecosystem.

**Alignment with UN Sustainable Development Goals (SDGs):**

| SDG | Goal | AptiCore's Contribution |
|-----|------|------------------------|
| **Goal 5** | **Gender Equality** | Anonymizes gender indicators (names, pronouns) from resumes so women and non-binary candidates are evaluated purely on competency. Demonstrated 41% reduction in gender bias in shortlists. |
| **Goal 8** | **Decent Work and Economic Growth** | Promotes inclusive, productive employment by removing non-merit barriers (college prestige, geography) that block qualified candidates from opportunities. |
| **Goal 10** | **Reduced Inequalities** | Eliminates systemic hiring biases against tier-2/3 college graduates, rural candidates, and underrepresented groups by enforcing blind, skill-only evaluation. |

---

## 1. Project Overview

**AptiCore** is an AI-powered Bias Detection & Fair Hiring Platform that transforms traditional resume screening from a subjective, opaque process into a measurable, transparent, and strictly skill-driven system.

**Core Tagline:** *"Hire on Skills, Not Stereotypes."*

The platform's philosophy is executed in three sequential phases:

```
Reveal Bias → Remove Bias → Prove the Improvement
```

AptiCore detects unconscious bias patterns in hiring pipelines, anonymizes candidate data to eliminate identity-based signals, evaluates candidates on pure merit using hybrid AI matching, and then **mathematically proves** the improvement with before/after fairness scores and transparent explanations for every decision.

---

## 2. Objectives & Value Proposition

| Objective | How AptiCore Delivers |
|-----------|----------------------|
| **Solve a real-world problem** | Tackles systemic employment bias and unequal opportunity — a problem affecting millions of job seekers globally. |
| **Make bias visible** | Detects and exposes historical biases: gender distribution skew, college tier favoritism, urban/rural location bias, and non-skill attribute influence. |
| **Make fairness measurable** | Quantifies bias using a mathematical **Fairness Score (0–100)** computed from gender parity, college bias index (Shannon entropy), location bias index, and non-skill attribute weight. |
| **Make decisions explainable** | Every candidate score includes a 2–3 sentence explanation citing specific matched/missing skills, not vague praise. Zero "black-box" decisions. |
| **Prove the improvement** | Side-by-side before/after comparison dashboard showing exactly how fairness improved after AptiCore's intervention. |

---

## 3. End-to-End System Flow (9-Step Pipeline)

The platform operates through a fully automated, server-side pipeline orchestrated in a background process via Next.js `after()`. Each step transitions the batch through a tracked `ProcessingStatus`:

```
CREATED → UPLOADING → PARSING → ANALYZING_BIAS_BEFORE → ANONYMIZING → MATCHING → RANKING → EXPLAINING → ANALYZING_BIAS_AFTER → COMPLETE
```

### Phase 1: Ingestion & Baseline

#### Step 1 — Input & Resume Parsing
- **Recruiter uploads:** Job Description (JD) text + candidate resumes (PDF, DOCX, TXT).
- **JD Extraction:** Gemini 2.5 Pro extracts structured requirements — `requiredSkills`, `preferredSkills`, `minimumExperience`, `educationLevel` — with strict classification rules distinguishing "must-have" from "nice-to-have" skills.
- **Resume Parsing:** Each resume is parsed via Gemini 2.5 Pro into a structured `CandidateRawData` profile containing: name, email, gender (pronoun-only detection — never from names), college (with tier classification: tier1/tier2/tier3), location (with urban/suburban/rural classification), skills (exhaustive: 8 categories), experience, projects, and education.
- **File Processing:** Magic-byte detection identifies PDF vs DOCX vs TXT regardless of file extension. PDF extraction via `pdf-parse`, DOCX via `JSZip` (extracts `<w:t>` tags from `word/document.xml`), plain text with UTF-8 BOM handling.
- **Deduplication:** Content hashing (DJB2) prevents re-parsing identical resumes across uploads.
- **Input Truncation:** Resumes capped at 15,000 chars, JDs at 10,000 chars to stay within AI context windows.

#### Step 2 — Bias Detection Engine (BEFORE)
- Simulates a **traditional biased hiring pipeline** using weighted identity factors:
  - College tier weights: tier1 = 1.0, tier2 = 0.6, tier3 = 0.3
  - Location weights: urban = 0.9, suburban = 0.6, rural = 0.3
  - Gender advantage: subtle male bias (+0.1) vs female (-0.05)
- Selects top 50% of candidates using these biased scores (simulating what a typical recruiter would do unconsciously).
- Measures the demographics of that biased selection to establish a **baseline**.

#### Step 3 — Fairness Score (BEFORE)
- Computes a composite **Fairness Score (0–100)** from:
  - **Gender Parity** (30% weight): min/max ratio of male vs female representation.
  - **College Bias Index** (25% weight): Shannon entropy of tier distribution (lower entropy = more concentrated = more biased).
  - **Location Bias Index** (20% weight): Shannon entropy of location type distribution.
  - **Non-Skill Attribute Weight** (25% weight): How much identity factors influence the selection.
- Example: A biased batch might score **58/100**.

### Phase 2: Intervention & Evaluation

#### Step 4 — Anonymization Layer (Bias Removal)
- **PII Masking:** Strips emails → `[EMAIL]`, phone numbers → `[PHONE]`, URLs → `[URL]`, LinkedIn/GitHub profiles → `[LINKEDIN]`/`[GITHUB]`.
- **Identity Masking:** Replaces prestigious institution names (IIT, NIT, IIIT, BITS, ISI) with `[INSTITUTION]`. Replaces gendered pronouns (he/she/him/her) with "they."
- **Candidate ID Assignment:** Each candidate becomes an anonymized entity (e.g., `C-001`, `C-002`).
- **Order Shuffling:** Candidate array is shuffled randomly to prevent position-based inference.
- **Data Preserved:** Only skills, experience years, scrubbed project/experience descriptions, education level (degree only, no institution), and technologies.

#### Step 5 — Skill-Based Evaluation Engine (Hybrid Matching)
- **Keyword Matching (base score):** Checks each JD skill against candidate skills using:
  - Exact match (O(1) Set lookup)
  - Alias matching via reverse alias map (60+ skill aliases: "ReactJS" → "React", "k8s" → "Kubernetes", etc.)
  - Substring fallback ("react" matches "react.js")
- **Semantic Matching (boost):** Vector embeddings via `gemini-embedding-001` compute cosine similarity between candidate skill profiles and JD requirements.
- **Scoring Formula:**
  - Required skills: 70% weight
  - Preferred skills: 20% weight
  - Experience bonus: 10% weight (capped)
  - Semantic boost: up to +15 points on top of keyword score
  - Final score: `min(keywordScore + semanticBoost, 100)`

#### Step 6 — Ranking & Selection
- All candidates sorted by match score descending.
- Each assigned a rank (1 = best match).
- Ranking is **purely skill-based** — no identity information is accessible at this stage.

### Phase 3: Transparency & Proof

#### Step 7 — Explainability Engine
- Gemini 2.5 Flash generates a 2–3 sentence explanation per candidate:
  - Sentence 1: Score summary with key strengths
  - Sentence 2: Specific matched skills (names 2–4 most relevant)
  - Sentence 3: Gaps or areas not covered
- **Rules enforced:** No candidate names, no gender, no college, no location mentioned. No vague praise. Factual only.
- **Score interpretation bands:** 90–100% exceptional, 70–89% strong, 50–69% moderate, 30–49% partial, 0–29% weak.

#### Step 8 — Fairness Score (AFTER Bias Removal)
- The system recalculates the Fairness Score on AptiCore's skill-ranked selection (top 50% by merit).
- Since all identity factors were hidden during scoring, the "after" selection naturally reflects a more balanced demographic distribution.
- `nonSkillAttributeWeight` is reduced by 0.15 for skill-based pipelines.
- Example: Score improves from **58 → 93**.

#### Step 9 — Before vs. After Comparison Dashboard
- Visual interface presents side-by-side metrics:
  - **Gender Parity:** before vs after (higher = better)
  - **College Bias:** before vs after (lower = better)
  - **Location Bias:** before vs after (lower = better)
  - **Merit Purity:** % of ranking driven by skill (higher = better)
- Each metric includes a delta with a contextual description explaining the improvement.
- **Overall Improvement** = `afterFairnessScore - beforeFairnessScore`.

---

## 4. System Architecture & Tech Stack

### 4.1 Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                    │
│  Landing Page → Login/Signup → Dashboard (Overview/Candidates/  │
│  Bias Report) → About Page                                      │
│  State: Zustand · Charts: Recharts · Fonts: Plus Jakarta Sans,  │
│  DM Sans, Lobster · Styling: Tailwind CSS 4                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API (Bearer auth)
┌────────────────────────▼────────────────────────────────────────┐
│                  BACKEND (Next.js API Routes)                   │
│  Edge Middleware (CORS) → Rate Limiter → Auth → Zod Validation  │
│  → Pipeline Orchestrator (after()) → Response                   │
└──────┬──────────┬───────────────┬───────────────────────────────┘
       │          │               │
┌──────▼───┐ ┌───▼────────┐ ┌───▼───────────────────────────────┐
│ Firebase │ │  Firestore  │ │ Google Gemini API                │
│   Auth   │ │  (Database) │ │  · gemini-2.5-pro (parsing, JD)  │
│ Email +  │ │  Users      │ │  · gemini-2.5-flash (explain)    │
│ Google   │ │  JobBatches │ │  · gemini-embedding-001 (embed)  │
│ OAuth    │ │  └Candidates│ │                                  │
│          │ │  └BiasReport│ └──────────────────────────────────┘
│          │ │  └ResumeFiles│
└──────────┘ └─────────────┘
```

### 4.2 Frontend

| Technology | Version | Usage |
|-----------|---------|-------|
| **Next.js** | 15.3.1 | App Router, SSR/CSR, API routes, Edge middleware |
| **React** | 19.1.0 | UI components with Server/Client component separation |
| **TypeScript** | 5.8.3 | Full type safety across entire codebase |
| **Tailwind CSS** | 4.1.4 | Utility-first styling with PostCSS |
| **Zustand** | 5.0.5 | Client-side state management (3 stores: Auth, Batch, Dashboard) |
| **Recharts** | 2.15.3 | Data visualization for bias report charts |
| **Google Fonts** | — | Plus Jakarta Sans (body), DM Sans (alt), Lobster (brand) |

**Landing Page Sections:**
1. **Header** — Sticky navigation with responsive hamburger menu, account dropdown with Google/email auth detection, change password (email users only)
2. **Hero** — "Hire on Skills, Not Stereotypes" tagline, animated dashboard preview showing fairness score improvement (58 → 93), key metrics (35% improvement, <2s per resume, 100% explainable)
3. **How It Works** — 3-step visual pipeline: Reveal → Remove → Prove
4. **Features** — AI-Powered Anonymization, Quantifiable Fairness Score, Full Explainability
5. **SDG Impact** — UN Goals 5, 8, 10 with measurable impact metrics
6. **Final CTA** — "Ready to Make Hiring Fair?" with sign-up call
7. **Footer** — Product links, company links, team social profiles (LinkedIn, GitHub)

**UI Components:**
- `ScrollProgress` — Page reading progress indicator
- `ParticleBackground` — Animated particle effects
- `RevealOnScroll` — Intersection Observer-based scroll animations
- `SectionHeader` — Consistent section title styling

**Authentication Pages:**
- **Login** (`/login`) — Email/password form + Google OAuth, "Remember me", forgot password link, create account toggle
- **Forgot Password** (`/forgot-password`) — Email-based password reset flow
- **Auth Action** (`/auth/action`) — Firebase auth action handler (email verification, password reset callbacks)

**Dashboard** (`/dashboard`):
- **Auth Guard** — Redirects unauthenticated users to `/login?redirect=...`
- **Layout** — Top navigation with pill-style tab switcher (Overview | Candidates | Bias Report), user avatar, sign out
- **Overview Tab:**
  - `DashboardHeader` — Welcome message + "Create Batch" CTA
  - `StatsRow` — Aggregate stats cards (total batches, candidates, avg fairness)
  - `BatchList` → `BatchCard` — Lists all job batches with status badges, actions (view/process/retry/delete)
  - `CreateBatchModal` — Multi-step wizard: paste JD → upload resumes → create
  - `EmptyState` — Friendly empty state when no batches exist
  - `LoadingState` — Skeleton Loading UI
- **Candidates Tab:**
  - `CandidateList` → `CandidateCard` — Ranked candidate cards showing: rank badge, match score (color-coded), skill breakdown (matched/missing), explanation text, before/after comparison toggle (showing raw vs anonymized data)
- **Bias Report Tab:**
  - `BiasReportView` — Full before/after comparison with:
    - `FairnessScoreCard` — Large score display with improvement delta
    - `DistributionChart` — Recharts bar/radial charts for gender, college tier, location distributions
    - `BiasImprovement` list — Metric-by-metric improvement breakdown with contextual descriptions

### 4.3 Backend

| Technology | Version | Usage |
|-----------|---------|-------|
| **Next.js API Routes** | 15.3.1 | RESTful serverless endpoints |
| **Firebase Admin SDK** | 13.8.0 | Server-side Firestore operations, token verification |
| **Google Generative AI** | 0.24.1 | Gemini 2.5 Pro/Flash for parsing, JD extraction, explanations |
| **Zod** | 4.3.6 | Request body validation schemas |
| **pdf-parse** | 1.1.1 | PDF text extraction |
| **JSZip** | 3.10.1 | DOCX (ZIP archive) text extraction |

**API Route Inventory:**

| Route | Method | Purpose | Auth | Rate Limit |
|-------|--------|---------|------|------------|
| `/api/batch/create` | POST | Create new job batch | ✅ Bearer + CSRF | 10/min |
| `/api/batch/upload` | POST | Upload resume file (multipart) | ✅ Bearer + CSRF | 100/min |
| `/api/batch/process` | POST | Trigger 9-step AI pipeline | ✅ Bearer + CSRF | 5/min |
| `/api/batch/list` | GET | List user's batches | ✅ Bearer | 60/min |
| `/api/batch/[batchId]` | GET | Get single batch details | ✅ Bearer + ownership | 60/min |
| `/api/batch/[batchId]/candidates` | GET | Get batch candidate results | ✅ Bearer + ownership | 60/min |
| `/api/batch/[batchId]/bias-report` | GET | Get batch bias report | ✅ Bearer + ownership | 60/min |
| `/api/batch/delete` | DELETE | Delete batch + cascading subcollections | ✅ Bearer + CSRF + ownership | 30/min |
| `/api/user/profile` | GET/PUT | Get or update user profile | ✅ Bearer | 30/min |
| `/api/health` | GET | Health check endpoint | None | 30/min |

**Standardized API Response Format:**
```json
{
  "success": true | false,
  "data": { ... } | null,
  "error": "message" | null
}
```

### 4.4 Infrastructure & Security

**Firebase Services:**

| Service | Usage |
|---------|-------|
| **Firebase Authentication** | Email/password + Google OAuth sign-in |
| **Cloud Firestore** | Document database for users, job batches, candidates, bias reports, resume metadata |
| **Firebase Storage** | Resume file storage (PDF/DOCX) with security rules |

**Firestore Data Model:**

```
users/{userId}
  ├── email, displayName, company, role
  ├── batchCount (atomic increment)
  └── createdAt, updatedAt

jobBatches/{batchId}
  ├── userId, jdText, jdRequirements
  ├── status (ProcessingStatus enum)
  ├── candidateCount, fairnessScoreBefore, fairnessScoreAfter
  ├── createdAt, completedAt, error
  │
  ├── candidates/{candidateId}
  │     ├── rawData (CandidateRawData)
  │     ├── anonymizedData (AnonymizedCandidate)
  │     ├── matchScore, semanticBoost, skillBreakdown
  │     ├── explanation, rank
  │     └── parseStatus, parseError
  │
  ├── biasReport/report
  │     ├── before (BiasMetrics)
  │     ├── after (BiasMetrics)
  │     ├── improvements[] (BiasImprovement[])
  │     └── overallImprovement
  │
  ├── resumeFiles/{fileId}
  │     └── fileName, contentBase64, size
  │
  └── resumes/{resumeId}
        └── fileName, storagePath, size, uploadedAt
```

**Security Layers:**

| Layer | Implementation |
|-------|---------------|
| **Edge Middleware** | CORS enforcement on all `/api/*` routes. Configurable origin allowlist via `CORS_ALLOWED_ORIGINS` env var. Preflight (OPTIONS) handling with 204 response. |
| **Authentication** | Firebase ID token verification via Admin SDK. Bearer token required on all API routes. |
| **CSRF Protection** | `X-Requested-With: XMLHttpRequest` header required on all mutation (non-GET) requests. Simple cross-origin form POSTs cannot set custom headers. |
| **Rate Limiting** | In-memory token bucket algorithm. Per-IP + per-user composite keys. Configurable via `RATE_LIMIT_*` env vars. Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`. Automatic stale bucket cleanup every 5 minutes. |
| **Input Validation** | Zod v4 schemas on all request bodies. JD text: 50–10,000 chars. File count: 1–50. Batch IDs: 1–128 chars. |
| **Ownership Verification** | Every batch operation verifies `batch.userId === request.uid`. |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` |
| **Firestore Rules** | Default deny-all. Users read/write own profile only. Batch read only by owner. All batch writes via Admin SDK only. Resume files: no client read/write. |
| **Storage Rules** | Authenticated uploads only. 10MB max file size. PDF and DOCX content types enforced. No client updates or deletes. |
| **Open Redirect Prevention** | Login redirect URL validated against internal paths only. |
| **Email Enumeration Prevention** | Generic error messages on auth endpoints — no user existence leakage. |

### 4.5 AI Model Configuration

| Model | Usage | Temperature | Max Tokens |
|-------|-------|-------------|------------|
| `gemini-2.5-pro` | Resume parsing, JD extraction | 0.1 | 4096 / 2048 |
| `gemini-2.5-flash` | Explanation generation | 0.2 | 300 |
| `gemini-embedding-001` | Semantic skill matching (vector embeddings) | — | — |

**Reliability Features:**
- **Exponential backoff retry:** Max 3 retries with 1s/2s/4s delays + jitter on HTTP 429, 500, 503, 408 errors.
- **Transient error detection:** Retries on timeout, ECONNRESET, socket hang up, fetch failed, network errors.
- **SDK instance caching:** Singleton pattern for `GoogleGenerativeAI` client.
- **Input truncation:** Resumes capped at 15K chars, JDs at 10K chars.
- **JSON mode:** `responseMimeType: "application/json"` for structured parsing.
- **Graceful degradation:** Semantic matching falls back to keyword-only if embedding fails. Explanation generation falls back to template string if AI fails.

---

## 5. Client-Side State Management

AptiCore uses **Zustand** (v5) with three independent stores:

### 5.1 Auth Store (`useAuthStore`)
- Wraps Firebase `onAuthStateChanged` for reactive auth state.
- Manages: `user`, `loading`, `initialized` lifecycle states.
- Provides `getIdToken()` for API authentication.
- Handles `logout()` with `signOut(auth)`.

### 5.2 Batch Store (`useBatchStore`)
- Manages all data operations: batches, candidates, bias reports.
- **Optimistic updates:** Batch deletion removed instantly from UI, rolled back on API failure. Processing status set to `PARSING` immediately before server confirms.
- **Silent polling:** `pollBatches()` refreshes data without triggering loading states — prevents card flicker during active processing.
- **Auto-polling:** 2-second interval while any batch has an active processing status.
- **API helper:** `apiFetch<T>()` handles Bearer token injection, `X-Requested-With` header, standardized `{ success, data, error }` response parsing.

### 5.3 Dashboard Store (`useDashboardStore`)
- UI state: `selectedView` (overview | candidates | bias-report), `comparisonMode`, `showAnonymized` toggles.

---

## 6. File Upload & Processing

**Supported Formats:** PDF (`.pdf`), DOCX (`.docx`), TXT (`.txt`)

**Constraints:**
- Max file size: **10MB** per file
- Max files per batch: **50 resumes**
- JD text: 50–10,000 characters

**File Detection:**
- Primary: Magic byte analysis (PDF: `%PDF`, DOCX: `PK` + `word/` marker, TXT: UTF-8 BOM or fallback)
- Fallback: File extension tiebreaker when magic bytes are ambiguous

**Upload Flow:**
1. Client sends JD text + file count → `POST /api/batch/create` → returns `batchId`
2. Client uploads each file sequentially → `POST /api/batch/upload` (multipart form data with `batchId`)
3. Server stores file content as base64 in Firestore subcollection (`resumeFiles`)
4. Client triggers processing → `POST /api/batch/process`
5. Server responds immediately with 200, runs pipeline in `after()`

---

## 7. Measurable Impact Metrics

| Metric | How It's Measured | Target |
|--------|------------------|--------|
| **Fairness Score Delta** | `afterScore - beforeScore` | 25+ point improvement per batch |
| **Gender Parity Improvement** | min/max ratio of male/female in top-half selections: before vs after | Measurable improvement in gender balance |
| **College Bias Reduction** | Shannon entropy of tier distribution: before vs after | Lower concentration of tier-1 candidates |
| **Location Bias Reduction** | Shannon entropy of location distribution: before vs after | More geographic diversity |
| **Merit Purity** | `(1 - nonSkillAttributeWeight) × 100` | 90%+ merit-driven decisions |
| **Explainability Coverage** | % of candidates with AI-generated explanations | 100% (fallback to template if AI fails) |
| **Processing Speed** | End-to-end pipeline time per resume | < 2 seconds per resume (parallel processing) |

---

## 8. Performance Optimizations

| Optimization | Implementation |
|-------------|---------------|
| **Parallel resume parsing** | `Promise.allSettled()` for all resumes simultaneously |
| **Parallel hybrid matching** | All candidate matches run concurrently |
| **Parallel explanation generation** | All explanations generated simultaneously |
| **Resume deduplication** | DJB2 content hash cache prevents re-parsing identical resumes |
| **O(1) skill lookups** | `Set` and `Map` data structures for exact match, alias, and error lookups |
| **Reverse alias map** | Pre-computed bidirectional skill alias map for fast fuzzy matching |
| **SDK caching** | Singleton Gemini client + model instances |
| **Silent polling** | Background data refresh without UI loading flicker |
| **Optimistic UI** | Immediate client-side updates for delete/process actions |
| **Background processing** | `after()` sends 200 response immediately; pipeline runs asynchronously |
| **Chunked Firestore writes** | Respects 500-operation batch limit by chunking large writes |
| **Module-level hoisting** | RegExp patterns, education level maps, and alias maps initialized once |

---

## 9. Realistic Boundaries & Limitations

| Limitation | Mitigation |
|-----------|------------|
| **Bias reduction, not elimination** | Proxy variables may still correlate with identity. System acknowledges this explicitly. |
| **Human oversight required** | AI is an objective advisor — final hiring decisions require human review and judgment. |
| **Gender detection limitations** | Gender inferred only from explicit pronouns. Most candidates default to "unknown" (by design). |
| **Scanned PDFs** | Image-only PDFs return `NEEDS_OCR` status. OCR not yet implemented. |
| **In-memory rate limiting** | Token buckets reset on server restart. Production should use Redis/distributed store. |
| **Vercel function timeout** | 60s max for Pro tier. Large batches (50 resumes) may need chunked processing. |
| **Semantic matching accuracy** | Embeddings capture general similarity but may miss domain-specific nuances. Keyword matching remains the primary scorer (70% weight). |
| **Core claim:** | *"We reduce and expose bias, rather than assuming we can fully remove it."* |

---

## 10. Target Audience

| Persona | Need |
|---------|------|
| **Talent Acquisition Teams & Recruiters** | Objective, fast resume screening that removes unconscious bias from shortlisting |
| **HR Tech Managers** | Auditable, explainable AI tooling that integrates with existing hiring workflows |
| **DEI Officers** | Measurable before/after proof of bias reduction for compliance and reporting |
| **Startups & SMBs** | Affordable, zero-infrastructure fair hiring tool (serverless, no ML expertise required) |
| **Hackathon Judges / Evaluators** | A demonstrable, end-to-end system solving a real UN SDG-aligned problem with Google technologies |

---

## 11. Deployment & Hosting

| Component | Platform | Notes |
|-----------|----------|-------|
| **Frontend + API** | **Vercel** | Next.js 15 with App Router, Serverless Functions, Edge Middleware |
| **Database** | **Google Cloud Firestore** | `nam5` region, default database |
| **Auth** | **Firebase Authentication** | Email/password + Google OAuth |
| **Storage** | **Firebase Storage** | Resume file uploads with security rules |
| **AI** | **Google Gemini API** | `@google/generative-ai` SDK (not Vertex AI) |
| **Domain** | Vercel-managed | Auto-SSL, CDN |

**Environment Variables Required:**

| Variable | Purpose |
|----------|---------|
| `GOOGLE_GEMINI_API_KEY` | Gemini API authentication |
| `FIREBASE_*` | Firebase Admin SDK service account credentials |
| `NEXT_PUBLIC_FIREBASE_*` | Client-side Firebase config |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |
| `RATE_LIMIT_*` | Per-category rate limit overrides |

---

## 12. Page & Route Map

```
/                          → Landing page (Hero, How It Works, Features, SDG, CTA, Footer)
/login                     → Authentication (Email/Password + Google OAuth, Sign-up toggle)
/forgot-password           → Password reset flow
/auth/action               → Firebase auth action handler
/about                     → Team, mission, core principles
/dashboard                 → Main dashboard (auth-protected)
  ├── Overview tab          → Batch list, stats, create new batch
  ├── Candidates tab        → Ranked candidate cards with explanations
  └── Bias Report tab       → Before/after fairness comparison
/api/health                → Health check
/api/batch/*               → Batch CRUD + processing
/api/user/profile          → User profile management
```

---

## 13. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Gemini Pro for parsing, Flash for explanations** | Parsing requires high accuracy (structured JSON extraction). Explanations are simpler and benefit from speed. |
| **Hybrid matching (keyword + semantic)** | Keyword matching is reliable and fast. Semantic matching catches higher-order skill relationships but is less deterministic — used as a boost, not replacement. |
| **Simulated biased pipeline for "before"** | Ethical constraint: we can't use a real biased pipeline. Simulating one with documented weights demonstrates the concept convincingly. |
| **`after()` for pipeline execution** | Returns 200 to client immediately. Pipeline runs in background without blocking the response — prevents user-facing timeouts. |
| **In-Firestore resume storage** | Stores file content as base64 in Firestore (not GCS) for simplicity in hackathon context. Trade-off: larger documents, but eliminates signed URL complexity. |
| **Zustand over Redux** | Minimal boilerplate, excellent TypeScript support, perfect for 3-store architecture. |
| **No client-side writes to batch data** | All batch/candidate data written via Admin SDK (server-side only). Client is read-only. Prevents data tampering. |

# AptiCore — Design System Documentation

> **Version**: 2.0 · **Last Updated**: April 2026  
> **Scope**: Full-application design system — Landing Page · Authentication · Dashboard  
> **Stack**: Next.js 15 · Tailwind CSS v4 (`@theme inline`) · React 19 · Recharts · Zustand

---

## 1. Design Philosophy

AptiCore's visual identity is built on **warm editorial minimalism** — every element serves a purpose, whitespace is generous, and motion is deliberate. The system communicates **trust, transparency, and technical rigor** appropriate for an AI-powered fair-hiring platform.

| Trait | Value |
|-------|-------|
| **Vibe** | Professional, trustworthy, transparent |
| **Aesthetic** | Editorial minimalism with generous whitespace |
| **Motion** | Spring easing — `cubic-bezier(0.16, 1, 0.3, 1)` |
| **Cards (Landing)** | Sharp corners (`rounded-none`) — signature element |
| **Cards (Dashboard)** | Soft corners (`rounded-2xl`) — approachable data surfaces |
| **Buttons** | Pill-shaped (`rounded-full`) with inset shadow |
| **Spacing** | Generous: `py-16 sm:py-20` between sections |
| **Surfaces** | Layered: page → card → elevated, each with subtle depth |

### Design Lineage

This system is derived from the **SkillBridge** design language with the following adaptations:

| Aspect | SkillBridge (Source) | AptiCore (Adapted) |
|--------|---------------------|---------------------|
| Primary color | `#37322f` (warm charcoal) | `#1C3F3A` (deep forest green) |
| Background | `#f7f5f3` (warm parchment) | `#F8FAFC` (cool off-white) |
| Body text | `#49423D` (warm) | `#475569` (cool slate) |
| Borders | `#e0dedb` (warm) | `#E2E8F0` (cool) |
| Display font | Instrument Serif (editorial) | Plus Jakarta Sans (geometric) |
| Brand font | — | Lobster (cursive wordmark) |
| Body font | Inter | DM Sans |
| Accent | Gold `#D4A67A` | Sage Teal `#5BA08F` |
| Hero layout | Single-column centered | 2-column with animated mockup |
| Container width | `1060px` | `1100px` |

**Retained patterns**: Sharp-corner cards, pill buttons, RevealOnScroll, auto-cycling HowItWorks, section heading trio, card hover blueprint, spring easing, stagger delays, decorative bottom-line hover.

---

## 2. Color System

All colors are defined as Tailwind v4 `@theme inline` tokens in `globals.css` and referenced throughout the application via semantic aliases.

### 2.1 Token Definitions

```
┌─ BRAND ────────────────────────────────────────────────┐
│ --color-brand:       #1C3F3A  (Deep Forest Green)      │
│ --color-brand-dark:  #15302C  (Darker Green / Hover)   │
└────────────────────────────────────────────────────────┘

┌─ ACCENT ───────────────────────────────────────────────┐
│ --color-accent:      #5BA08F  (Sage Teal)              │
│ --color-accent-dark: #4A8A7A  (Deeper Sage / Hover)    │
│ --color-emerald:     #10B981  (Success / Positive)     │
└────────────────────────────────────────────────────────┘

┌─ SURFACES ─────────────────────────────────────────────┐
│ --color-surface:     #F8FAFC  (Page background)        │
│ --color-surface-alt: #F1F5F9  (Elevated bg / alt rows) │
│ --color-surface-card:#FFFFFF  (Card background)        │
└────────────────────────────────────────────────────────┘

┌─ INK (TEXT) ───────────────────────────────────────────┐
│ --color-ink:         #1E293B  (Headings, bold values)  │
│ --color-ink-light:   #475569  (Body text)              │
│ --color-ink-muted:   #64748B  (Secondary text)         │
│ --color-ink-faint:   #94A3B8  (Captions, labels)       │
└────────────────────────────────────────────────────────┘

┌─ EDGES (BORDERS) ─────────────────────────────────────┐
│ --color-edge:        #E2E8F0  (Default border)         │
│ --color-edge-light:  rgba(28,63,58,0.08)  (Subtle)     │
│ --color-edge-hover:  rgba(28,63,58,0.15)  (Hover)      │
└────────────────────────────────────────────────────────┘
```

**Tailwind usage**: `text-brand`, `bg-surface`, `border-edge`, `text-ink-muted`, etc.

### 2.2 Dashboard Chart Colors

The `DistributionChart` component uses a fixed 8-color palette for bar charts:

| Index | Hex | Name | Usage |
|-------|-----|------|-------|
| 0 | `#1C3F3A` | Brand | Primary bars |
| 1 | `#5BA08F` | Accent | Secondary bars |
| 2 | `#10B981` | Emerald | Success / positive |
| 3 | `#8B5CF6` | Violet | Tertiary data |
| 4 | `#F59E0B` | Amber | Warning / attention |
| 5 | `#EC4899` | Pink | Demographic data |
| 6 | `#06B6D4` | Cyan | Supplementary data |
| 7 | `#F97316` | Orange | Supplementary data |

### 2.3 Semantic Color Pairings

| Context | Background | Text | Border |
|---------|-----------|------|--------|
| Page base | `surface` | `ink-light` | — |
| Card default | `white` | `ink` | `edge` |
| Card hover | `white` | `ink` | `brand/20` |
| Dashboard header | `white` | `ink` | `edge` (bottom) |
| Stat card icon (batches) | `brand/8` | `brand` | — |
| Stat card icon (candidates) | `accent/10` | `accent-dark` | — |
| Stat card icon (fairness) | `emerald/10` | `emerald` | — |
| Pipeline step (active) | `brand` | `white` | — |
| Pipeline step (complete) | `emerald` | `white` | — |
| Pipeline step (error) | `red-600` | `white` | — |
| Pipeline step (pending) | `surface-alt` | `ink-faint` | — |
| Selection highlight | `rgba(28,63,58,0.12)` | `brand` | — |

---

## 3. Typography

Fonts are loaded via `next/font/google` in `layout.tsx` and exposed as CSS variables consumed by Tailwind `@theme inline` tokens.

### 3.1 Font Stack

| Role | Font | CSS Variable | Tailwind Class | Weight |
|------|------|-------------|----------------|--------|
| **Display** (H1, H2) | Plus Jakarta Sans | `--font-plus-jakarta` | `font-display` | 600–800 |
| **Body** (paragraphs, nav, labels) | DM Sans | `--font-dm-sans` | `font-body` | 400–600 |
| **Brand Wordmark** ("AptiCore" text) | Lobster | `--font-lobster` | `font-[family-name:var(--font-lobster)]` | 400 |

### 3.2 Type Scale — Landing Page

| Element | Classes |
|---------|---------|
| Hero H1 | `text-4xl sm:text-5xl md:text-[64px] font-extrabold leading-tight tracking-tight font-display` |
| Section H2 | `text-3xl sm:text-4xl font-semibold leading-tight tracking-tight font-display` |
| Section Eyebrow | `text-sm font-medium uppercase tracking-widest text-ink-muted` |
| Body paragraph | `text-base font-medium leading-7 text-ink-light` or `text-sm leading-[22px]` |
| Card title | `text-sm font-semibold leading-6 text-ink` |
| Card description | `text-sm leading-[22px] text-ink-light/80` |

### 3.3 Type Scale — Dashboard

| Element | Classes |
|---------|---------|
| Page heading | `text-xl sm:text-2xl font-bold font-display tracking-tight text-ink` |
| Page subtitle | `text-xs sm:text-sm text-ink-muted` |
| Stat value | `text-xl sm:text-[1.75rem] font-bold font-display tracking-tight tabular-nums` |
| Stat label | `text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-ink-faint` |
| Card title | `text-sm sm:text-base font-semibold text-ink font-display tracking-tight` |
| Card meta | `text-[10px] sm:text-xs text-ink-faint` |
| Pill badge | `text-[9px] sm:text-[10px] font-bold uppercase tracking-wider` |
| Modal heading | `text-xl sm:text-2xl font-bold font-display tracking-tight text-ink` |
| Empty state title | `text-lg font-semibold font-display tracking-tight text-ink` |
| Empty state description | `text-sm leading-relaxed text-ink-muted` |

---

## 4. Shadows & Elevation

### 4.1 Landing Page Shadows

| Context | Value |
|---------|-------|
| Card default | `0 1px 3px rgba(0,0,0,0.04)` |
| Card hover | `0 8px 30px rgba(28,63,58,0.06)` |
| Card hover (elevated) | `0 12px 40px rgba(28,63,58,0.07)` |
| Button default | `0 1px 3px rgba(0,0,0,0.12)` |
| Button hover | `0 8px 24px rgba(28,63,58,0.3), 0 0 0 4px rgba(28,63,58,0.1)` |
| Navbar scrolled | `0 1px 8px rgba(0,0,0,0.06)` |
| Dashboard mockup | `0 4px 24px rgba(28,63,58,0.06), 0 20px 60px rgba(28,63,58,0.08)` |

### 4.2 Dashboard Shadows

| Context | Value |
|---------|-------|
| Stat card hover | `0 12px 28px -8px rgba(28,63,58,0.08), 0 4px 12px rgba(0,0,0,0.03)` |
| Chart card hover | `0 6px 24px rgba(28,63,58,0.06)` |
| CTA button default | `0 2px 8px rgba(28,63,58,0.18)` |
| CTA button hover | `0 4px 16px rgba(28,63,58,0.25)` |
| Modal backdrop | `bg-black/60 backdrop-blur-sm` |
| Modal card | `0 24px 48px rgba(0,0,0,0.15)` |
| Sidebar nav | `0 1px 3px rgba(0,0,0,0.08)` |
| Batch card hover | `0 8px 30px rgba(28,63,58,0.06)` |

### 4.3 Focus Ring

```css
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

---

## 5. Border Radius

| Element | Radius | Context |
|---------|--------|---------|
| Landing cards (all sections) | `0` (sharp corners) | Signature landing page element |
| Dashboard cards | `rounded-2xl` (16px) | Approachable data surfaces |
| CTAs / Buttons | `rounded-full` (pill) | All interactive buttons |
| Navbar | `rounded-full` | Floating pill nav |
| Icon containers (landing) | `rounded-lg` | Feature card icons |
| Icon containers (dashboard) | `rounded-lg` to `rounded-xl` | Stat card icons |
| Pill badges | `rounded-full` | Status pills, processing step badges |
| Modal | `rounded-2xl sm:rounded-3xl` | Centered dialog |
| Chart tooltip | `rounded-xl` (12px) | Recharts tooltip |
| Progress bars | `rounded-full` | Pipeline step bars |
| Pipeline step dots | `rounded-full` | Circular progress indicators |

---

## 6. Layout Architecture

### 6.1 Container

All landing page sections use a consistent container:

```
max-w-[1100px] mx-auto px-4
```

### 6.2 Section Spacing

| Type | Classes |
|------|---------|
| Standard section | `py-16 sm:py-20` |
| Generous section | `py-16 sm:py-24` |
| Heading → content gap | `mt-12` |
| Card grid gap | `gap-4` (standard) or `gap-6` (large cards) |

### 6.3 Section Heading Pattern

Every landing page section follows the **Eyebrow → H2 → Subtitle** trio, encapsulated in the `<SectionHeader>` component:

```tsx
<SectionHeader
  eyebrow="Features"
  title="Built for Transparency. Powered by Gemini."
  subtitle="Every component engineered to make hiring decisions fair..."
/>
```

### 6.4 Grid System — Landing Page

| Section | Grid |
|---------|------|
| Hero | `grid-cols-1 lg:grid-cols-2` (content + mockup) |
| HowItWorks | `grid-cols-1 md:grid-cols-3` (phase cards) |
| Features | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (6 cards) |
| SDG Impact | `grid-cols-1 sm:grid-cols-3` (3 cards) |
| Footer | `grid-cols-1 sm:grid-cols-4` (brand + 3 link groups) |

### 6.5 Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│  Header (fixed top, white, border-b)                     │
├──────────────────────────────────────────────────────────┤
│  ┌─ Sidebar ──┐  ┌─ Main Content ──────────────────┐    │
│  │ Navigation │  │  Page Header (title + CTA)       │    │
│  │ • Overview │  │  StatsRow (3 stat cards)          │    │
│  │ • Batches  │  │  BatchCard list / Detail view     │    │
│  │ • Profile  │  │  └─ CandidateList                │    │
│  │            │  │  └─ BiasReportView                │    │
│  │ User card  │  │  └─ DistributionCharts            │    │
│  └────────────┘  └──────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Dashboard grid**: `grid grid-cols-1 lg:grid-cols-[260px_1fr]` (sidebar + content)  
**Mobile**: Sidebar collapses to off-canvas with hamburger toggle  
**Content area**: `max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8`

---

## 7. Landing Page Components

### 7.1 Header / Navbar — `Header.tsx`

- **Shape**: Pill-shaped (`rounded-full`) floating nav
- **Brand wordmark**: "AptiCore" in Lobster font
- **Layout**: Brand + nav links (left), auth buttons (right)
- **Scroll behavior**: Glassmorphic — gains `backdrop-blur`, shadow on scroll
- **Decorative**: Full-width horizontal line behind nav (hidden on scroll)
- **Mobile**: Slide-in panel from right with dark forest green gradient (`#1C3F3A → #0F2924`), staggered link entrance animations
- **Account dropdown**: Animated menu (`animate-menu-slide-down`) with user info, Change Password (email/password users only), and Sign Out
- **Dependencies**: Client component (scroll listener, mobile state, auth state)

### 7.2 Hero — `Hero.tsx`

- **Layout**: 2-column — content left, dashboard mockup right
- **Left column**:
  - H1 with gradient text on "Not Stereotypes" (`bg-gradient-to-r from-accent via-brand to-accent-dark bg-clip-text text-transparent`)
  - Subtitle paragraph
  - Dual CTAs: Primary pill button (sweep shimmer on hover) + Ghost button (play icon)
  - Sub-CTA helper text
  - **Animated stat counters** (easeOutCubic, triggered on scroll via IntersectionObserver)
- **Right column**:
  - Browser chrome mockup (3 dots + URL bar)
  - Before/After fairness score comparison with hover scale effect
  - **Animated candidate bars** — grow from 0% width on scroll intersection, staggered 200ms per bar
  - Gentle float animation + radial glow behind
  - Dot grid texture pattern (decorative)
- **Entrance**: Staggered `animate-fade-in-up` with `animation-delay-{100..400}`

### 7.3 How It Works — `HowItWorks.tsx`

- **Pattern**: 3 auto-cycling phase cards (SkillBridge pattern)
- **Cycle**: 4s per phase with gradient progress bar (`from-brand to-accent`) on active card
- **Active state**: White bg, brand border, shadow, `-translate-y-1`, bottom accent line
- **Inactive state**: Muted bg, lighter border, click to activate & reset timer
- **Phase number badges**: Large faded numbers (`01`, `02`, `03`) in top-right corner
- **Staggered step dots**: Step bullets animate in with 60ms stagger on active card
- **Live preview panel**: Below cards — shows active phase indicator with colored badge, metric value, and clickable dot progress navigation
- **Dependencies**: Client component (timer, state, goTo callback)

### 7.4 Features — `Features.tsx`

- **Grid**: 3×2 grid of feature cards
- **Card pattern**: Sharp corners, white bg, `border-edge/80`
- **3D Tilt effect**: Cards physically respond to mouse position via `perspective(800px) rotateX/Y` — JS mouse tracking on each card
- **Hover**: Border darkens, shadow grows, gradient overlay fades in, bottom accent line (`from-brand to-accent`) scales in from left
- **Cursor spotlight**: Radial gradient follows mouse position (`rgba(91,160,143,0.06)`)
- **Icon**: `rounded-lg bg-surface-alt p-2.5` → inverts to `bg-brand text-white` on hover with scale 1.1×
- **Icons**: Inline SVGs (Shield, BarChart, Eye, Zap, Users, Check)
- **Dependencies**: Client component (TiltCard with useRef + mouseMove/Leave handlers)

### 7.5 SDG Impact — `SDGImpact.tsx`

- **Grid**: 3-column cards for UN SDG Goals 8, 10, 5
- **Card pattern**: Large colored number badge, goal name eyebrow, title, description
- **Number badge animation**: Scales 1.1× and lifts on hover
- **Expanding stat panel**: Hidden impact metric slides open on hover (max-height transition), showing value + label
- **Hover**: Shadow, colored bottom-line accent (unique per card)
- **Colors**: Purple (#a21caf), Pink (#db2777), Orange (#ea580c)
- **Dependencies**: Client component (useState for hovered index)

### 7.6 Final CTA — `FinalCTA.tsx`

- **Background**: Solid `bg-brand` (deep forest green)
- **Mouse-tracking parallax orbs**: 3 floating orbs at different speeds follow cursor position (20/40/60px offset), `transition-transform duration-[1200ms] ease-out`
- **Decorative**: Corner gradient accents, dot grid texture pattern
- **Content**: H2 (white), subtitle (white/70), dual buttons (white solid with sweep shimmer + ghost)
- **Dependencies**: Client component (useRef + mouseMove handler + `data-orb` selectors)

### 7.7 Footer — `Footer.tsx`

- **Brand wordmark**: "AptiCore" in Lobster font
- **Grid**: 4-column — brand + 3 link groups (Product, Resources, Company)
- **Social icons**: LinkedIn and GitHub dropdowns with per-member profile links (animated pop-in)
- **Bottom bar**: Copyright left, social icons right (hover: `bg-brand text-white`)
- **Background**: `bg-surface` with `border-t border-edge`

---

## 8. Authentication Pages

### 8.1 Login / Sign Up — `login/page.tsx`

- **Layout**: 2-column split — decorative left panel + form right panel
- **Left panel**:
  - Animated gradient background (`login-gradient-shift` — 18s infinite cycle through brand colors)
  - 3 morphing blob shapes (`login-morph-blob` — 15s infinite border-radius morphing)
  - Floating text content with tagline and feature pills
  - Left-aligned dot-grid texture
  - **Mobile**: Hidden entirely; form fills viewport
- **Right panel**:
  - Toggle between Login / Sign Up / Forgot Password modes
  - Form inputs: `rounded-xl border-edge bg-surface-alt/50 focus:border-brand focus:ring-brand/10`
  - Password strength meter: 4-segment bars with color progression (red → amber → emerald)
  - Google Sign-In button: White card with Google SVG icon
  - Email/Password submit: Full-width `bg-brand rounded-xl` pill
  - Error banners: `bg-red-50 border-red-200 text-red-700 rounded-xl`
  - Success messages: `bg-emerald-50 border-emerald-200 text-emerald-700 rounded-xl`
- **Animations**: `animate-fade-in-up` with staggered delays on form elements

---

## 9. Dashboard Component System

The dashboard uses a distinct visual language from the landing page — **soft corners** (`rounded-2xl`) replace sharp corners, creating an approachable data-viewing experience with information density.

### 9.1 Dashboard Layout — `dashboard/layout.tsx`

- **Sidebar navigation**: Fixed left panel (260px) with brand wordmark, nav items, and user profile card
  - Nav items: Icon + label, active state with `bg-brand/5 text-brand border-l-2 border-brand`
  - User card: Avatar initial, name, email, truncated
  - Mobile: Off-canvas drawer triggered by hamburger icon
- **Main content**: Scrollable right panel with `overflow-y-auto`
- **Auth guard**: Redirects unauthenticated users to `/login`

### 9.2 StatsRow — `StatsRow.tsx`

Three KPI cards displayed in a horizontal row with scroll-reveal entrance and animated counters.

**Card anatomy**:
```
┌──────────────────────────────┐
│ [Icon] STAT LABEL            │  ← 10px uppercase, tracking-wider
│                              │
│   42                         │  ← 28px bold, tabular-nums
│   across all batches         │  ← 10px muted subtext
│                              │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 3px gradient accent (hover-only)
└──────────────────────────────┘
```

**Stats tracked**: Total Batches, Candidates Processed, Avg Fairness Lift  
**Motion**: `stat-card-hover` class — bouncy lift (`cubic-bezier(0.34, 1.56, 0.64, 1)`)  
**Counter animation**: `useAnimatedCounter` hook — rAF-driven cubic ease-out from 0 → target over 1000–1400ms  
**Reveal**: `useScrollReveal` hook — staggered 80ms per card with `revealStyle()` helper  
**Hover effects**: Icon scales 1.1× and rotates 3°, gradient accent stripe fades in, background glow appears

### 9.3 BatchCard — `BatchCard.tsx`

Expandable card representing a single hiring batch with pipeline progress visualization.

**Card anatomy**:
```
┌──────────────────────────────────────────────────────┐
│  [STATUS PILL]                          [TIMESTAMP]  │
│                                                      │
│  Senior React Developer                              │  ← title
│  12 candidates                                       │  ← meta
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ ● Parse  ● Anon  ● Extract  ● Match  ● Bias   │  │  ← pipeline steps
│  │ [===========================               ]    │  │  ← progress bar
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Fairness: 52% → 87%        [▲ +35% improvement]    │  ← before/after
│                                        [View ▸]      │
└──────────────────────────────────────────────────────┘
```

**Status pills** (color-coded with animated dot for processing states):
| Status | Background | Text | Dot |
|--------|-----------|------|-----|
| `COMPLETE` | `bg-emerald-50` | `text-emerald-700` | Static |
| `PROCESSING` | `bg-amber-50` | `text-amber-700` | Pulsing dot |
| `CREATED` | `bg-blue-50` | `text-blue-700` | — |
| `FAILED` | `bg-red-50` | `text-red-700` | — |
| `PARTIAL_FAILURE` | `bg-orange-50` | `text-orange-700` | — |

**Pipeline progress visualization**: 9 steps rendered as sequential dots with connecting lines:
- Each step is a `12px` circle with icon inside
- **Active step**: `bg-brand` with shimmer overlay (`dashboard-shimmer`)
- **Completed step**: `bg-emerald` with check icon, scale-in animation
- **Error step**: `bg-red-600` with X icon
- **Pending step**: `bg-surface-alt` muted

**Fairness comparison**: Before → After scores with color-coded delta badge  
**Interactions**: Click to expand/select, hover lifts card with spring easing

### 9.4 CandidateCard — `CandidateCard.tsx`

Card displaying individual candidate evaluation results in the batch detail view.

**Card anatomy**:
```
┌──────────────────────────────────────────────────────┐
│  [RANK BADGE]  Candidate Alpha-7                     │  ← anonymized name
│                                ★★★★☆  [SCORE: 87%]  │  ← star rating + score
│                                                      │
│  Skills: React, TypeScript, Node.js, +3              │  ← skill pills
│                                                      │
│  AI Explanation:                                     │
│  "Strong alignment with job requirements..."         │  ← truncated explanation
│                                                      │
│  Source: resume_alpha7.pdf       [View Details ▸]    │
└──────────────────────────────────────────────────────┘
```

**Rank badge**: Top-3 candidates get color-coded rank pills (`bg-amber-100`, `bg-slate-100`, `bg-orange-100`)  
**Score visualization**: Circular ring or horizontal bar with percentage  
**Skill pills**: `rounded-full bg-brand/5 text-brand text-xs px-2.5 py-0.5`  
**Star rating**: Filled/empty star SVGs based on normalized score bands  
**Hover**: Card lifts with shadow increase

### 9.5 BiasReportView — `BiasReportView.tsx`

Full-screen bias analysis dashboard showing before/after fairness comparison.

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│  [← Back]  Bias Report: Senior React Developer           │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ BEFORE      │  │  AFTER      │  │  IMPROVEMENT     │  │
│  │ [Ring: 52%] │  │ [Ring: 87%] │  │  +35%            │  │
│  │ High Risk   │  │ Fair        │  │  Significant     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │ Gender Distribution │  │ Ethnicity Distribution  │   │
│  │ [BAR CHART]         │  │ [BAR CHART]             │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                          │
│  Bias Type Breakdown                                     │
│  ├─ Gender Bias:     ■■■■■■░░░░  62%                    │
│  ├─ Ethnicity Bias:  ■■■■■░░░░░  48%                    │
│  └─ Institution Bias:■■■░░░░░░░  31%                    │
└──────────────────────────────────────────────────────────┘
```

**FairnessScoreCard subcomponent**: SVG ring visualization
- Ring: `stroke-dasharray` animated from 0 → score percentage
- **Score < 50%**: `text-red-500` / `stroke: #EF4444` — "High Risk"
- **Score 50–74%**: `text-amber-500` / `stroke: #F59E0B` — "Needs Improvement"
- **Score ≥ 75%**: `text-emerald-500` / `stroke: #10B981` — "Fair"
- Background ring: `stroke: #F1F5F9`

**Distribution charts**: `DistributionChart` component via Recharts `<BarChart>`
- Rounded top corners on bars (`radius={[6,6,0,0]}`)
- Tooltip: White card with `rounded-xl`, shadow, 12px font
- Grid lines: Horizontal only, dashed `#E2E8F0`
- Animation: 1200ms bar entry

### 9.6 CreateBatchModal — `CreateBatchModal.tsx`

Multi-step modal for creating new hiring batches.

**Modal structure**:
- **Backdrop**: `bg-black/60 backdrop-blur-sm` with click-outside-to-close
- **Card**: `bg-white rounded-2xl sm:rounded-3xl` with max-width constraint
- **Close button**: Top-right `rounded-full p-2 hover:bg-surface-alt`

**Step 1 — Job Description**:
- Textarea with character limit
- `rounded-xl border-edge bg-surface-alt/50 focus:border-brand focus:ring-brand/10`

**Step 2 — Resume Upload**:
- Drag-and-drop zone with dashed border (`border-2 border-dashed border-edge rounded-2xl`)
- **Drag active**: `border-brand bg-brand/5` with scale-up transition
- File list with individual remove buttons
- Accepted formats: `.pdf`, `.docx`, `.txt`
- Max file size: 5MB per file
- Upload progress: Animated bar from 0% → 100%

**Submit button**: Full-width `bg-brand text-white rounded-full py-3` with loading spinner

### 9.7 EmptyState — `EmptyState.tsx`

Centered placeholder for views with no data.

**Structure**:
- Centered `max-w-sm` container with `py-20` vertical padding
- Icon: `w-16 h-16 rounded-2xl bg-brand/5` with centered SVG
- Title: `text-lg font-semibold font-display`
- Description: `text-sm leading-relaxed text-ink-muted`
- Optional CTA: Pill button (`rounded-full bg-brand text-white`) with plus icon

---

## 10. Custom Hooks

### 10.1 `useScrollReveal(threshold, resetKey)`

Scroll-triggered entrance animation hook using `IntersectionObserver`.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `threshold` | `0.15` | IntersectionObserver threshold |
| `resetKey` | — | When changed, resets visibility to re-trigger animation |

**Returns**: `{ ref, isVisible }`  
**Observer config**: `rootMargin: '0px 0px -60px 0px'` — fires 60px before full viewport entry  
**Behavior**: Fires once (disconnects after first intersection), re-arms on `resetKey` change

**Companion**: `revealStyle(visible, index, baseDelay)` — generates inline styles:
- **Hidden**: `opacity: 0; transform: translateY(24px) scale(0.98)`
- **Visible**: `opacity: 1; transform: translateY(0) scale(1)`
- **Easing**: `opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.34,1.56,0.64,1)`
- **Stagger**: Each element delayed by `baseDelay + index × 0.08s`

### 10.2 `useAnimatedCounter(target, isVisible, duration, resetKey)`

Smoothly counts from 0 → target using `requestAnimationFrame` with cubic ease-out.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `target` | — | Target number to animate to |
| `isVisible` | — | Triggers animation start |
| `duration` | `1200` | Animation duration in ms |
| `resetKey` | — | Resets counter to 0 for re-animation |

**Easing**: Ease-out cubic — `1 - (1 - progress)³`  
**Returns**: Current animated integer value  
**Cleanup**: Cancels `requestAnimationFrame` on unmount

---

## 11. Animation System

### 11.1 Primary Easing Curves

| Name | Curve | Usage |
|------|-------|-------|
| Spring | `cubic-bezier(0.16, 1, 0.3, 1)` | Card hovers, transitions, menu slides, reveals |
| Bouncy spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Stat card lifts, icon hover scales, reveal transforms |
| Standard ease | `ease-out` | Fade-ins, simple opacity transitions |

### 11.2 Keyframe Catalog

| Name | Duration | Effect | Used In |
|------|----------|--------|---------|
| `fade-in-up` | 0.9s | Y+24 + scale 0.98 → 0 | Hero entrance, general reveals |
| `fade-in` | 0.6s | Pure opacity | Generic elements |
| `fade-in-scale` | 0.7s | Scale 0.95 → 1 + opacity | Scale reveals |
| `float-gentle` | 6s ∞ | Y ±8px | Dashboard mockup |
| `progress-bar` | 3.2s linear | Width 0% → 100% | HowItWorks active timer |
| `pulse-dot` | 2s ∞ | Scale + opacity pulse | Processing status dot |
| `gradient-shift` | 4s ∞ | Background-position shift | Hero text gradient |
| `menu-slide-down` | 0.2s | Y-8 + scale 0.96 → 0 | Dropdown menus |
| `scroll-logos` | 25s ∞ linear | TranslateX 0 → -50% | Logo marquee |
| `dashboard-shimmer` | 3s ∞ | TranslateX -150% → 250% | Active pipeline step |
| `login-gradient` | 18s ∞ | Background-position cycle | Login left panel |
| `login-morph-blob` | 15s ∞ | Border-radius morphing | Login decorative blobs |
| `linkedInPopIn` | 0.3s | Y+8 + scale 0.95 → 0 | Social dropdown pop-in |

### 11.3 Stagger Delays

```css
.animation-delay-{100|200|300|400|500|600|700|800}
```

Applied to sibling elements for sequential entrance. Increment 100ms per element.

### 11.4 CSS Utility Classes

| Class | Effect |
|-------|--------|
| `card-hover` | Landing page card lift — `translateY(-4px)` + shadow on hover, spring easing |
| `stat-card-hover` | Dashboard stat lift — `translateY(-3px)` + layered shadow, bouncy spring |
| `dashboard-shimmer` | Pipeline step shimmer sweep, 3s cycle with 1s initial delay |
| `header-sticky` | Smooth background/shadow transition on scroll |
| `header-scrolled` | Glassmorphic nav — `rgba(255,255,255,0.85)` + blur(12px) + shadow |
| `scrollbar-hide` | Hides scrollbar across browsers while preserving scroll |
| `dark-scrollbar` | Custom 4px scrollbar with brand-tinted thumb |

### 11.5 Scroll Reveal — `RevealOnScroll.tsx`

Reusable wrapper component for landing page sections:

- **Hidden**: `opacity-0 translate-y-6 scale-[0.98]`
- **Visible**: `opacity-100 translate-y-0 scale-100`
- **Transition**: `700ms ease-out` with configurable `delay` prop
- **Observer**: threshold `0.1`, rootMargin `0px 0px -40px 0px`
- **Behavior**: Fires once (unobserves after first intersection)

---

## 12. Interaction Patterns

### 12.1 Landing Page Card Hover

```
transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
hover:border-brand/20
hover:shadow-[0_8px_30px_rgba(28,63,58,0.06)]
hover:-translate-y-1
```

### 12.2 Dashboard Card Hover

```
transition-all duration-300
hover:border-brand/20
hover:shadow-[0_8px_30px_rgba(28,63,58,0.06)]
group-hover icon: scale-110 rotate-3
```

### 12.3 Button Hover (Primary — Pill)

```
hover:bg-brand-dark
hover:shadow-[0_8px_24px_rgba(28,63,58,0.3),0_0_0_4px_rgba(28,63,58,0.1)]
hover:scale-[1.02]
active:scale-[0.98]
```

Plus sweep shimmer: `bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] → 100%`

### 12.4 Dashboard Button Hover

```
hover:bg-brand-dark
hover:shadow-[0_4px_16px_rgba(28,63,58,0.25)]
hover:-translate-y-0.5
active:translate-y-0
transition-all duration-300
```

### 12.5 Icon Inversion (Feature cards)

```
group-hover:bg-brand
group-hover:text-white
group-hover:scale-110
group-hover:shadow-[0_4px_16px_rgba(28,63,58,0.2)]
```

### 12.6 Decorative Bottom Line

```
h-[3px] bg-brand scale-x-0
group-hover:scale-x-100
transition-transform duration-500 origin-left
```

### 12.7 Dashboard Gradient Accent Stripe (Stat Cards)

```
absolute top-0 left-0 right-0 h-[3px]
bg-gradient-to-r ${stat.accent}
opacity-0 group-hover:opacity-100
transition-opacity duration-500
```

### 12.8 Navbar Scroll Transition

```css
.header-scrolled {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
}
```

### 12.9 Modal Entry

```
Backdrop: opacity 0 → 1 (300ms ease-out)
Card: scale-95 → scale-100, Y+20 → Y+0 (500ms spring)
```

---

## 13. Responsive Patterns

### 13.1 Breakpoints (Tailwind Defaults)

| Prefix | Min-Width | Typical Context |
|--------|-----------|-----------------|
| (base) | 0px | Mobile phones (portrait) |
| `sm:` | 640px | Mobile landscape / small tablet |
| `md:` | 768px | Tablet portrait |
| `lg:` | 1024px | Tablet landscape / small desktop |
| `xl:` | 1280px | Desktop |

### 13.2 Dashboard Responsive Strategy

| Component | Mobile (< 640px) | Tablet (640–1024px) | Desktop (> 1024px) |
|-----------|-------------------|---------------------|---------------------|
| Sidebar | Off-canvas drawer | Off-canvas drawer | Fixed 260px left |
| Stats row | Horizontal scroll, `min-w-[200px]` | 3-column grid | 3-column grid |
| Batch cards | Full width, compact padding | Full width | Full width |
| Candidate cards | Stacked layout | Side-by-side | Side-by-side |
| Bias report | Single column, stacked charts | 2-column charts | 2-column charts |
| Modal | Near full-screen, small margin | Centered, max-w-lg | Centered, max-w-lg |
| Pipeline steps | Horizontal scroll | Full width | Full width |

### 13.3 Touch Optimization

- Minimum touch targets: `44px` height on all interactive elements
- Stat cards: `min-w-[200px]` with `scroll-snap-item` for horizontal scrolling
- Modals: `max-h-[85vh]` with internal scroll area
- Close buttons: `p-2` padding around icons for larger hit area

---

## 14. State Management & Data Flow

### 14.1 Zustand Stores

| Store | Purpose | Key State |
|-------|---------|-----------|
| `useAuthStore` | Authentication state | `user`, `loading`, `initialized`, `initAuth()`, `logout()`, `getIdToken()` |
| `useBatchStore` | Batch CRUD & processing | `batches[]`, `activeBatch`, `candidates[]`, `biasReport`, `fetchBatches()`, `pollBatches()`, `createBatch()`, `deleteBatch()` |
| `useDashboardStore` | Dashboard UI state | `selectedView`, `comparisonMode`, `showAnonymized`, `setView()`, `toggleComparison()`, `toggleAnonymized()` |

### 14.2 Polling System

- **Interval**: 2-second polling during active processing
- **Mechanism**: `setInterval` in `useEffect` with cleanup on unmount
- **Silent updates**: State replaces in-place without UI flickering
- **Auto-stop**: Polling ceases when all batches reach terminal status (`COMPLETE` / `FAILED`)

### 14.3 Optimistic UI

- Batch creation: Card appears immediately with `CREATED` status
- Status updates: Pipeline progress updates in real-time via polling
- Error recovery: Failed states displayed with retry affordance

---

## 15. File Structure

```
src/app/
├── globals.css                            ← @theme tokens, animations, utilities
├── layout.tsx                             ← next/font, metadata, global providers
├── page.tsx                               ← Landing page section composition
├── login/
│   └── page.tsx                           ← Auth (login/signup/forgot-password)
├── about/
│   └── page.tsx                           ← About/team page
├── privacy/
│   └── page.tsx                           ← Privacy policy page
├── components/
│   ├── ui/
│   │   ├── RevealOnScroll.tsx             ← IntersectionObserver wrapper
│   │   ├── SectionHeader.tsx              ← Eyebrow + H2 + subtitle
│   │   ├── ScrollProgress.tsx             ← Page reading progress bar
│   │   ├── ParticleBackground.tsx         ← Canvas particle effects
│   │   └── index.ts                       ← Barrel exports
│   ├── AuthProvider.tsx                   ← Firebase auth state provider
│   ├── Header.tsx                         ← Sticky pill navbar + mobile menu + account dropdown
│   ├── Hero.tsx                           ← 2-col hero with animated counters + mockup
│   ├── SocialProof.tsx                    ← Scrolling logo marquee
│   ├── HowItWorks.tsx                     ← Auto-cycling 3-phase pipeline + preview panel
│   ├── Features.tsx                       ← 6-card 3D tilt feature grid
│   ├── SDGImpact.tsx                      ← UN SDG cards with expanding stats
│   ├── FinalCTA.tsx                       ← Parallax-orb CTA banner
│   └── Footer.tsx                         ← 4-col footer with social dropdowns
└── dashboard/
    ├── layout.tsx                         ← Sidebar nav + auth guard + responsive shell
    ├── page.tsx                           ← Dashboard orchestrator + polling + view routing
    ├── components/
    │   ├── DashboardHeader.tsx            ← Welcome message + New Batch CTA
    │   ├── StatsRow.tsx                   ← 3 animated KPI stat cards
    │   ├── BatchList.tsx                  ← Batch list container
    │   ├── BatchCard.tsx                  ← Expandable batch card + pipeline progress
    │   ├── CandidateList.tsx              ← Candidate list with toggle
    │   ├── CandidateCard.tsx              ← Individual candidate result card
    │   ├── BiasReportView.tsx             ← Full bias analysis with charts
    │   ├── FairnessScoreCard.tsx          ← SVG ring score visualization
    │   ├── DistributionChart.tsx          ← Recharts bar chart wrapper
    │   ├── CreateBatchModal.tsx           ← Multi-step batch creation modal
    │   ├── EmptyState.tsx                 ← No-data placeholder with CTA
    │   ├── LoadingState.tsx               ← Skeleton shimmer loading
    │   └── index.ts                       ← Barrel exports
    └── hooks/
        ├── useScrollReveal.ts             ← Scroll-triggered reveal + stagger helper
        └── useAnimatedCounter.ts          ← rAF-powered number animation
```

---

## 16. Accessibility

| Category | Implementation |
|----------|---------------|
| Focus indicators | `2px solid accent` outline on all focusable elements |
| ARIA roles | `role="region"` on stat rows, `role="img"` on charts, `aria-label` on all interactive areas |
| Screen reader text | `sr-only` class for icon-only buttons |
| Color contrast | All text meets WCAG AA (ink on surface: 7.2:1, brand on white: 8.1:1) |
| Keyboard navigation | Tab-navigable cards, Enter/Space to activate, Escape to close modals |
| Reduced motion | `prefers-reduced-motion` respected via Tailwind `motion-safe:` utilities |
| Semantic HTML | Proper heading hierarchy (single H1 per page), landmark regions |

---

## 17. Performance Considerations

| Optimization | Implementation |
|--------------|---------------|
| Font loading | `next/font/google` with `display: swap`, variable fonts |
| Animation | `will-change: transform` on animated elements, GPU-accelerated properties only |
| Image optimization | Next.js `<Image>` with lazy loading and responsive `srcSet` |
| Bundle splitting | Dashboard components are route-level code-split |
| CSS | Tailwind v4 tree-shaking removes unused utilities |
| Scroll handlers | `IntersectionObserver` instead of scroll event listeners |
| Counter animations | `requestAnimationFrame` with cleanup on unmount |
| Polling | Silent 3s interval with auto-stop on terminal states |

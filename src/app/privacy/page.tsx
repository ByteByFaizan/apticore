"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollProgress from "../components/ui/ScrollProgress";

/* ─── Reveal on Scroll ─── */
function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    up: "translateY(32px)",
    left: "translateX(-32px)",
    right: "translateX(32px)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate(0) scale(1)"
          : `${transforms[direction]} scale(0.97)`,
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Parallax Float ─── */
function useParallax(speed = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translateY(${center * speed}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return ref;
}

/* ─── Section Icons ─── */
const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
);

/* ─── Privacy Principles ─── */
const principles = [
  {
    icon: EyeOffIcon,
    number: "01",
    title: "PII Removal Before Analysis",
    description:
      "Names, emails, phone numbers, addresses, and institution names are stripped before any AI scoring occurs. Candidates become anonymous identifiers like \"Candidate Alpha-1.\"",
  },
  {
    icon: LockIcon,
    number: "02",
    title: "No Training on Your Data",
    description:
      "Your resume data is never used to train or fine-tune any AI models. It is processed in real-time and used solely to generate your batch results.",
  },
  {
    icon: ShieldIcon,
    number: "03",
    title: "Temporary Processing",
    description:
      "AI processing is performed in-memory during pipeline execution. Raw resume text is not persisted after structured data extraction is complete.",
  },
];

/* ─── Policy Sections ─── */
interface ContentBlock {
  subtitle?: string;
  text: string;
  items?: string[];
}

const sections: { id: string; label: string; title: string; content: ContentBlock[] }[] = [
  {
    id: "information-we-collect",
    label: "Section 01",
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create an account, we collect the information you provide, including:",
        items: [
          "Email address",
          "Display name",
          "Authentication credentials (managed securely by Firebase Authentication)",
          "Google profile information (if you sign in with Google)",
        ],
      },
      {
        subtitle: "Hiring Batch Data",
        text: "When you create a hiring batch, we process:",
        items: [
          "Job descriptions you provide",
          "Resume files uploaded by you (PDF, DOCX, or TXT format)",
          "Structured data extracted from resumes (skills, experience, education)",
        ],
      },
      {
        subtitle: "Automatically Collected Data",
        text: "We may automatically collect:",
        items: [
          "IP address (used for rate limiting and security, not stored long-term)",
          "Browser type and device information",
          "Usage patterns and feature interactions",
        ],
      },
    ],
  },
  {
    id: "how-we-use",
    label: "Section 02",
    title: "How We Use Your Information",
    content: [
      {
        text: "We use the collected information exclusively for:",
        items: [
          "Providing our core service — parsing resumes, matching candidates, and generating bias reports",
          "Anonymizing candidate data — removing PII before AI evaluation",
          "Detecting and measuring bias — running dual-pipeline comparisons",
          "Authenticating and securing — verifying identity and preventing unauthorized access",
          "Improving the platform — understanding usage to enhance functionality",
        ],
      },
    ],
  },
  {
    id: "data-storage",
    label: "Section 03",
    title: "Data Storage & Security",
    content: [
      {
        text: "Your data is stored using Google's Firebase infrastructure with enterprise-grade security:",
        items: [
          "Firestore — Batch data and user profiles stored with owner-based access rules",
          "Cloud Storage — Resumes stored with strict file-type and 5MB size restrictions",
          "Firebase Authentication — Credentials managed by Google; we never store passwords",
          "Encryption — All data encrypted in transit (TLS) and at rest (AES-256) via Google Cloud",
        ],
      },
    ],
  },
  {
    id: "data-sharing",
    label: "Section 04",
    title: "Data Sharing",
    content: [
      {
        text: "We do not sell, rent, or share your personal data with third parties for marketing. Data may only be shared in these limited cases:",
        items: [
          "Google Cloud Services — Firebase and Gemini AI process your data, subject to Google's Privacy Policy",
          "Legal Requirements — If required by law, regulation, or legal process",
          "Safety — To protect the rights, property, or safety of AptiCore, our users, or the public",
        ],
      },
    ],
  },
  {
    id: "your-rights",
    label: "Section 05",
    title: "Your Rights",
    content: [
      {
        text: "You have the right to:",
        items: [
          "Access — View all data associated with your account through the dashboard",
          "Delete — Remove individual batches and all associated candidate data at any time",
          "Portability — Export your batch results and bias reports",
          "Account Deletion — Request complete deletion of your account and all data",
          "Withdraw Consent — Stop using the platform; no further data will be collected",
        ],
      },
    ],
  },
  {
    id: "cookies",
    label: "Section 06",
    title: "Cookies & Tracking",
    content: [
      {
        text: "AptiCore uses minimal cookies strictly necessary for functionality:",
        items: [
          "Authentication cookies — Managed by Firebase to maintain your login session",
          "No advertising cookies — We do not use any advertising or tracking cookies",
          "No third-party trackers — We do not embed third-party analytics scripts",
        ],
      },
    ],
  },
  {
    id: "data-retention",
    label: "Section 07",
    title: "Data Retention",
    content: [
      {
        text: "We retain your data for as long as your account is active or as needed to provide services:",
        items: [
          "Account data — Retained until you delete your account",
          "Batch data — Retained until you explicitly delete the batch",
          "Uploaded resumes — Stored until the associated batch is deleted",
          "Rate limiting data — Held in memory only, never persisted to disk",
        ],
      },
    ],
  },
  {
    id: "children",
    label: "Section 08",
    title: "Children's Privacy",
    content: [
      {
        text: "AptiCore is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.",
      },
    ],
  },
  {
    id: "changes",
    label: "Section 09",
    title: "Changes to This Policy",
    content: [
      {
        text: 'We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this policy periodically to stay informed about how we protect your data.',
      },
    ],
  },
];

/* ═══════════════════════════════════════════════
   PRIVACY POLICY PAGE
   ═══════════════════════════════════════════════ */
export default function PrivacyPage() {
  const orbRef1 = useParallax(0.08);
  const orbRef2 = useParallax(-0.06);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main className="overflow-x-hidden">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HERO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative pt-24 pb-12 sm:pt-36 sm:pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
          {/* Atmospheric orbs */}
          <div
            ref={orbRef1}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] sm:w-[900px] sm:h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(28,63,58,0.05),transparent)] rounded-full blur-3xl pointer-events-none"
          />
          <div
            ref={orbRef2}
            className="absolute top-1/3 right-[10%] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(91,160,143,0.06),transparent)] rounded-full blur-2xl pointer-events-none"
            style={{
              transform: `translate(${mousePos.x * 20 - 10}px, ${mousePos.y * 20 - 10}px)`,
            }}
          />

          {/* Dot grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--color-brand) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative max-w-[1100px] mx-auto px-5 sm:px-6">
            <div className="flex flex-col items-center text-center gap-6 sm:gap-8">
              {/* Animated accent line */}
              <div className="w-[2px] h-12 sm:h-16 bg-gradient-to-b from-transparent via-brand/30 to-brand/60 rounded-full animate-fade-in" />

              <h1
                className="max-w-[720px] font-extrabold leading-[1.1] sm:leading-tight font-display animate-fade-in-up text-balance text-ink"
                style={{ fontSize: "clamp(2rem, 5vw + 0.5rem, 4rem)" }}
              >
                Your privacy is a{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-accent via-brand to-accent-dark bg-clip-text text-transparent animate-gradient-shift">
                    promise.
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-brand rounded-full animate-fade-in animation-delay-600" />
                </span>
              </h1>

              <p
                className="max-w-[560px] text-ink-light font-medium leading-relaxed animate-fade-in-up animation-delay-200"
                style={{
                  fontSize: "clamp(0.95rem, 1.2vw + 0.5rem, 1.15rem)",
                }}
              >
                <span className="font-[family-name:var(--font-lobster)] font-normal tracking-wide text-[1.15em] text-brand">
                  AptiCore
                </span>{" "}
                is built on transparency. This policy explains exactly how your
                data is collected, processed, and protected — no fine print, no
                surprises.
              </p>

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted animate-fade-in-up animation-delay-400">
                Last updated — April 15, 2026
              </p>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center opacity-40 pointer-events-none animate-fade-in animation-delay-800">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted hidden sm:block">
                Scroll Down
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ink-muted animate-float-gentle"
              >
                <path d="M12 5v14" />
                <path d="M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            AI & DATA PRINCIPLES (card grid)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-12 sm:py-20 lg:py-28 border-t border-edge">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6">
            <Reveal>
              <div className="text-center mb-10 sm:mb-14">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Our Commitment
                </span>
                <h2
                  className="mt-4 font-display font-semibold leading-snug text-ink"
                  style={{
                    fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)",
                  }}
                >
                  Three principles that protect your data
                </h2>
              </div>
            </Reveal>

            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {principles.map((principle, i) => (
                <Reveal key={principle.title} delay={i * 120}>
                  <div className="group relative bg-white border border-edge/80 p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-brand/15 hover:shadow-[0_12px_40px_rgba(28,63,58,0.07)] cursor-default h-full overflow-hidden">
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.01] to-brand/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Number badge */}
                    <span className="absolute top-4 right-4 text-brand/10 group-hover:text-brand/20 transition-colors duration-500 font-display text-2xl font-bold">
                      {principle.number}
                    </span>

                    {/* Icon */}
                    <div className="relative inline-flex rounded-lg bg-surface-alt p-3 text-brand transition-all duration-300 group-hover:bg-brand group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_4px_16px_rgba(28,63,58,0.2)]">
                      <principle.icon />
                    </div>

                    <h3 className="relative mt-5 sm:mt-6 text-base sm:text-lg font-semibold text-ink">
                      {principle.title}
                    </h3>
                    <p className="relative mt-2 sm:mt-3 text-sm leading-[1.75] text-ink-light/85">
                      {principle.description}
                    </p>

                    {/* Decorative bottom line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            POLICY SECTIONS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-12 sm:py-20 lg:py-28 border-t border-edge">
          <div className="max-w-[780px] mx-auto px-5 sm:px-6">
            <Reveal>
              <div className="mb-12 sm:mb-16">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  Full Policy
                </span>
                <h2
                  className="mt-4 font-display font-semibold leading-snug text-ink"
                  style={{
                    fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)",
                  }}
                >
                  The details, plainly stated
                </h2>
              </div>
            </Reveal>

            <div className="space-y-0">
              {sections.map((section, sIdx) => (
                <Reveal key={section.id} delay={sIdx * 60}>
                  <div className="group border-t border-edge py-8 sm:py-10">
                    <div className="flex items-start gap-4 sm:gap-6">
                      {/* Section number */}
                      <span className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-surface-alt flex items-center justify-center text-xs sm:text-sm font-bold text-brand/60 group-hover:bg-brand group-hover:text-white transition-all duration-300 mt-0.5">
                        {String(sIdx + 1).padStart(2, "0")}
                      </span>

                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-display font-semibold text-ink leading-snug"
                          style={{
                            fontSize:
                              "clamp(1.1rem, 1.5vw + 0.5rem, 1.4rem)",
                          }}
                        >
                          {section.title}
                        </h3>

                        <div className="mt-4 space-y-5">
                          {section.content.map((block, bIdx) => (
                            <div key={bIdx}>
                              {block.subtitle && (
                                <h4 className="text-sm sm:text-[15px] font-semibold text-ink mb-2">
                                  {block.subtitle}
                                </h4>
                              )}
                              <p className="text-[14px] sm:text-[15px] leading-[1.8] text-ink-light">
                                {block.text}
                              </p>
                              {block.items && (
                                <ul className="mt-3 space-y-2 ml-5 list-disc marker:text-brand/30">
                                  {block.items.map((item, iIdx) => (
                                    <li
                                      key={iIdx}
                                      className="text-[14px] sm:text-[15px] leading-[1.7] text-ink-light"
                                    >
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CONTACT / CTA (brand block)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-12 sm:py-20 lg:py-28">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6">
            <Reveal>
              <div className="relative bg-brand text-white p-8 sm:p-12 lg:p-16 overflow-hidden">
                {/* Decorative corners */}
                <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-bl from-white/[0.06] to-transparent" />
                <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-60 sm:h-60 bg-gradient-to-tr from-white/[0.03] to-transparent" />

                {/* Dot textures */}
                <div
                  className="absolute top-6 right-6 w-24 h-24 sm:w-32 sm:h-32 pointer-events-none opacity-60"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                  }}
                />

                {/* Floating accent orb */}
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-accent/10 rounded-full blur-2xl animate-float-gentle pointer-events-none" />

                <div className="relative max-w-[640px]">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Questions?
                  </span>
                  <h2
                    className="mt-4 font-display font-semibold leading-snug text-white"
                    style={{
                      fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)",
                    }}
                  >
                    We&apos;re here to help
                  </h2>
                  <div className="mt-5 sm:mt-6 space-y-4 text-[14px] sm:text-[15px] leading-[1.85] text-white/85">
                    <p>
                      If you have any questions about this Privacy Policy or how{" "}
                      <span className="font-[family-name:var(--font-lobster)] font-normal tracking-wide text-[1.15em]">
                        AptiCore
                      </span>{" "}
                      handles your data, please reach out to us. Transparency
                      is one of our core values — we&apos;ll always give you a
                      straight answer.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-4">
                    <a
                      href="mailto:faizan91work@gmail.com"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand text-sm font-semibold transition-all duration-300 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="2"
                          y="4"
                          width="20"
                          height="16"
                          rx="2"
                        />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      Email Us
                    </a>
                    <a
                      href="https://github.com/ByteByFaizan/apticore"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-white/25 text-white text-sm font-semibold transition-all duration-300 hover:bg-white/10 hover:border-white/40"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      View Source
                    </a>
                  </div>

                  <p className="mt-8 text-xs text-white/40 leading-relaxed">
                    AptiCore is open-source under the{" "}
                    <a
                      href="https://github.com/ByteByFaizan/apticore/blob/main/LICENSE"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-white/60 transition-colors"
                    >
                      MIT License
                    </a>
                    . You can review all data handling and processing logic on
                    GitHub.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Back to home */}
        <div className="max-w-[1100px] mx-auto px-5 sm:px-6 pb-12 sm:pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-brand transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}

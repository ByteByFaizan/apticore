"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollProgress from "../components/ui/ScrollProgress";

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

/* ─── Reveal on Scroll (inline, enhanced with direction) ─── */
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
        transform: visible ? "translate(0) scale(1)" : `${transforms[direction]} scale(0.97)`,
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

/* ─── Tilt Card ─── */
function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.innerWidth < 768) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    el.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`;
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0px)";
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{ transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}
    >
      {children}
    </div>
  );
}

/* ─── Value Icons ─── */
const TransparencyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const MeritIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const AccountabilityIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const values = [
  {
    icon: TransparencyIcon,
    number: "01",
    title: "Radical Transparency",
    description:
      "Every score, every ranking, every decision comes with a clear explanation. We don't ask you to trust a black box — we show you exactly why each candidate was ranked the way they were.",
  },
  {
    icon: MeritIcon,
    number: "02",
    title: "Merit-First Evaluation",
    description:
      "Skills. Experience. Relevance. That's it. AptiCore strips away names, photos, university prestige, and location signals — leaving only what actually predicts job performance.",
  },
  {
    icon: AccountabilityIcon,
    number: "03",
    title: "Measurable Accountability",
    description:
      "We don't just say things got fairer — we prove it. Every analysis generates a before-and-after Fairness Score so you can track exactly how much bias was reduced.",
  },
];

/* ─── Impact Stats Data ─── */
const impactStats = [
  { value: 73, suffix: "%", label: "Bias Reduction", color: "from-brand to-accent" },
  { value: 98, suffix: "%", label: "Accuracy Rate", color: "from-accent to-emerald" },
  { value: 30, suffix: "s", label: "Setup Time", color: "from-brand-dark to-brand" },
];

/* ─── Stat Card ─── */
function StatCard({ value, suffix, label, color, delay }: {
  value: number;
  suffix: string;
  label: string;
  color: string;
  delay: number;
}) {
  const { count, ref } = useAnimatedCounter(value, 2200);
  return (
    <Reveal delay={delay}>
      <div ref={ref} className="group relative text-center p-6 sm:p-8">
        <div className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {count}
          <span className="text-xl sm:text-3xl lg:text-4xl">{suffix}</span>
        </div>
        <p className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-ink-muted">{label}</p>
        {/* Animated underline */}
        <div className={`mx-auto mt-3 h-[2px] w-0 group-hover:w-12 bg-gradient-to-r ${color} transition-all duration-500`} />
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════
   ABOUT PAGE
   ═══════════════════════════════════════════════ */
export default function AboutPage() {
  const orbRef1 = useParallax(0.08);
  const orbRef2 = useParallax(-0.06);
  const orbRef3 = useParallax(0.12);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
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
          <div ref={orbRef1} className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] sm:w-[900px] sm:h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(28,63,58,0.05),transparent)] rounded-full blur-3xl pointer-events-none" />
          <div
            ref={orbRef2}
            className="absolute top-1/3 right-[10%] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(91,160,143,0.06),transparent)] rounded-full blur-2xl pointer-events-none"
            style={{ transform: `translate(${mousePos.x * 20 - 10}px, ${mousePos.y * 20 - 10}px)` }}
          />
          <div ref={orbRef3} className="absolute bottom-0 left-[15%] w-[250px] h-[250px] bg-[radial-gradient(ellipse_at_center,rgba(28,63,58,0.03),transparent)] rounded-full blur-2xl pointer-events-none animate-float-gentle" />

          {/* Dot grid texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, var(--color-brand) 1px, transparent 1px)",
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
                Making hiring decisions you can actually{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-accent via-brand to-accent-dark bg-clip-text text-transparent animate-gradient-shift">
                    defend.
                  </span>
                  {/* Underline accent */}
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-accent to-brand rounded-full animate-fade-in animation-delay-600" />
                </span>
              </h1>

              <p
                className="max-w-[560px] text-ink-light font-medium leading-relaxed animate-fade-in-up animation-delay-200"
                style={{ fontSize: "clamp(0.95rem, 1.2vw + 0.5rem, 1.15rem)" }}
              >
                <span className="font-[family-name:var(--font-lobster)] font-normal tracking-wide text-[1.15em] text-brand">AptiCore</span> is an AI-powered platform that detects unconscious bias
                in your hiring pipeline, removes it through anonymization, and
                proves the improvement with transparent, explainable metrics.
              </p>

              {/* Impact stats row */}
              <div className="w-full max-w-[640px] mt-4 sm:mt-8 grid grid-cols-3 divide-x divide-edge/50 animate-fade-in-up animation-delay-400">
                {impactStats.map((stat, i) => (
                  <StatCard key={stat.label} {...stat} delay={i * 150 + 500} />
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center opacity-40 pointer-events-none animate-fade-in animation-delay-800">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted hidden sm:block">
                Scroll Down
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted animate-float-gentle">
                <path d="M12 5v14" />
                <path d="M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MISSION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-12 sm:py-20 lg:py-28">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16 items-start">
              {/* Left — body */}
              <Reveal direction="left">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                    Our Mission
                  </span>
                  <h2
                    className="mt-4 font-display font-semibold leading-snug text-ink"
                    style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)" }}
                  >
                    Fairness shouldn&apos;t be a feeling — it should be a number.
                  </h2>
                  <div className="mt-6 space-y-4 text-[15px] leading-[1.8] text-ink-light">
                    <p>
                      Most hiring tools assume the process is already fair. They
                      optimize for speed — faster screening, quicker shortlists —
                      without questioning whether the criteria themselves carry
                      bias. Names, universities, locations, and gender indicators
                      silently shape outcomes before a recruiter even reads a
                      resume.
                    </p>
                    <p>
                      <span className="font-[family-name:var(--font-lobster)] font-normal tracking-wide text-[1.15em] text-brand">AptiCore</span> takes the opposite approach. Instead of starting
                      with assumptions, we start with measurement. Our AI scans
                      your pipeline for patterns that correlate with identity
                      rather than skill, assigns a quantifiable Fairness Score,
                      then strips away everything that isn&apos;t merit. The result: a
                      ranking you can explain, defend, and improve.
                    </p>
                    <p>
                      No black boxes. No vague promises. Just measurable proof
                      that your hiring got fairer.
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* Right — pull-quote card */}
              <Reveal direction="right" delay={200}>
                <TiltCard className="relative lg:mt-12">
                  <div className="border-l-[3px] border-brand/30 bg-white p-6 sm:p-8 lg:p-10 shadow-[0_2px_16px_rgba(28,63,58,0.04)] hover:shadow-[0_8px_32px_rgba(28,63,58,0.08)] transition-shadow duration-500">
                    <blockquote
                      className="font-display leading-relaxed text-ink italic"
                      style={{ fontSize: "clamp(1.1rem, 1.5vw + 0.5rem, 1.5rem)" }}
                    >
                      &ldquo;The biggest barrier to fair hiring isn&apos;t intent
                      — it&apos;s invisibility. You can&apos;t fix what you
                      can&apos;t measure.&rdquo;
                    </blockquote>
                    <p className="mt-5 flex items-center text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
                      — The idea behind <span className="ml-1.5 font-[family-name:var(--font-lobster)] normal-case tracking-normal text-[16px] text-brand -translate-y-[1px]">AptiCore</span>
                    </p>
                  </div>
                </TiltCard>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            VALUES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-12 sm:py-20 lg:py-28 border-t border-edge">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6">
            <Reveal>
              <div className="text-center mb-10 sm:mb-14">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  What We Believe
                </span>
                <h2
                  className="mt-4 font-display font-semibold leading-snug text-ink"
                  style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)" }}
                >
                  Three principles that shape everything
                </h2>
              </div>
            </Reveal>

            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value, i) => (
                <Reveal key={value.title} delay={i * 120}>
                  <TiltCard className="h-full">
                    <div className="group relative bg-white border border-edge/80 p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-brand/15 hover:shadow-[0_12px_40px_rgba(28,63,58,0.07)] cursor-default h-full overflow-hidden">
                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.01] to-brand/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      {/* Number badge */}
                      <span className="absolute top-4 right-4 text-brand/10 group-hover:text-brand/20 transition-colors duration-500 font-display text-2xl font-bold">
                        {value.number}
                      </span>

                      {/* Icon */}
                      <div className="relative inline-flex rounded-lg bg-surface-alt p-3 text-brand transition-all duration-300 group-hover:bg-brand group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_4px_16px_rgba(28,63,58,0.2)]">
                        <value.icon />
                      </div>

                      <h3 className="relative mt-5 sm:mt-6 text-base sm:text-lg font-semibold text-ink">
                        {value.title}
                      </h3>
                      <p className="relative mt-2 sm:mt-3 text-sm leading-[1.75] text-ink-light/85">
                        {value.description}
                      </p>

                      {/* Decorative bottom line */}
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left" />
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STORY / ORIGIN
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
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
                    backgroundSize: "12px 12px",
                  }}
                />
                <div
                  className="absolute bottom-8 right-1/4 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none opacity-40 hidden sm:block"
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
                    backgroundSize: "10px 10px",
                  }}
                />

                {/* Floating accent orb */}
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-accent/10 rounded-full blur-2xl animate-float-gentle pointer-events-none" />

                <div className="relative max-w-[640px]">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Our Story
                  </span>
                  <h2
                    className="mt-4 font-display font-semibold leading-snug text-white"
                    style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)" }}
                  >
                    Why <span className="font-[family-name:var(--font-lobster)] font-normal tracking-wide">AptiCore</span> exists
                  </h2>
                  <div className="mt-5 sm:mt-6 space-y-4 text-[14px] sm:text-[15px] leading-[1.85] text-white/85">
                    <p>
                      Hiring is one of the highest-stakes decisions an
                      organization makes — and one of the least transparent.
                      Research consistently shows that identical resumes with
                      different names receive dramatically different callback
                      rates. Yet most hiring tools treat this as someone
                      else&apos;s problem.
                    </p>
                    <p>
                      <span className="font-[family-name:var(--font-lobster)] font-normal tracking-wide text-[1.15em]">AptiCore</span> was built to make bias impossible to ignore. We
                      use AI not to automate hiring, but to audit it — exposing
                      the invisible patterns that shape outcomes and giving
                      recruiters the data they need to make genuinely fair
                      decisions.
                    </p>
                    <p>
                      We believe that where you studied or what your name sounds
                      like should never determine your career. A measurable,
                      explainable process can change that.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MEET THE TEAM
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-12 sm:py-20 lg:py-28 border-t border-edge">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-6">
            <Reveal>
              <div className="text-center mb-10 sm:mb-14">
                <span className="flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-ink-muted">
                  The People Behind <span className="ml-1.5 font-[family-name:var(--font-lobster)] normal-case tracking-normal text-[16px] text-brand -translate-y-[1px]">AptiCore</span>
                </span>
                <h2
                  className="mt-4 font-display font-semibold leading-snug text-ink"
                  style={{ fontSize: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)" }}
                >
                  Meet the Team
                </h2>
              </div>
            </Reveal>

            <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 max-w-[680px] mx-auto">
              {[
                { name: "Md Faizan", role: "Founder & Developer", github: "ByteByFaizan" },
                { name: "Laiba Khan", role: "Founder & Developer", github: "ByteByLaiba" },
              ].map((member, i) => (
                <Reveal key={member.name} delay={i * 150}>
                  <TiltCard>
                    <a
                      href={`https://github.com/${member.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center bg-white border border-edge/80 p-6 sm:p-8 lg:p-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-brand/15 hover:shadow-[0_12px_40px_rgba(28,63,58,0.07)] cursor-pointer relative overflow-hidden"
                    >
                      {/* Bottom accent line */}
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left" />

                      {/* Hover glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.01] to-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-[3px] border-edge group-hover:border-brand/30 transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(28,63,58,0.15)]">
                        <Image
                          src={`https://github.com/${member.github}.png`}
                          alt={member.name}
                          fill
                          sizes="(max-width: 768px) 96px, 128px"
                          className="object-cover"
                        />
                      </div>

                      <h3 className="relative mt-4 sm:mt-5 text-base sm:text-lg font-semibold text-ink">
                        {member.name}
                      </h3>
                      <p className="relative mt-1.5 inline-block text-[11px] font-semibold text-ink-muted uppercase tracking-[0.12em] bg-surface-alt px-3 py-1 rounded-full">
                        {member.role}
                      </p>

                      <div className="relative mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint group-hover:text-brand transition-colors duration-300">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        @{member.github}
                      </div>
                    </a>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CTA
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative py-12 sm:py-16 lg:py-20 border-t border-b border-edge bg-surface-alt overflow-hidden">
          {/* Floating orbs */}
          <div className="absolute -top-20 -right-20 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(28,63,58,0.04),transparent)] rounded-full blur-2xl pointer-events-none animate-float-gentle" />
          <div className="absolute -bottom-20 -left-20 w-[180px] h-[180px] sm:w-[250px] sm:h-[250px] bg-[radial-gradient(ellipse_at_center,rgba(28,63,58,0.03),transparent)] rounded-full blur-2xl pointer-events-none animate-float-gentle animation-delay-300" />

          <div className="relative max-w-[1100px] mx-auto px-5 sm:px-6 text-center">
            <Reveal>
              <h2
                className="font-display font-semibold leading-tight tracking-tight text-ink"
                style={{ fontSize: "clamp(1.5rem, 3.5vw + 0.5rem, 3rem)" }}
              >
                Ready to make hiring fair?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-ink-light font-medium leading-7" style={{ fontSize: "clamp(0.9rem, 1vw + 0.5rem, 1.15rem)" }}>
                Start your first bias analysis in under 40 seconds. Signup
                required. No cost. Just transparent, explainable results.
              </p>
              <div className="mt-8 sm:mt-10">
                <a
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 sm:px-8 sm:py-3.5 text-sm font-medium text-white shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] transition-all hover:bg-brand-dark hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(28,63,58,0.3),0_0_0_4px_rgba(28,63,58,0.1)] active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <span className="relative z-10">Start Free Analysis</span>
                  <svg
                    className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

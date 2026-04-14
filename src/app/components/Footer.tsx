"use client";

import Link from "next/link";
import { useCallback, useState, useEffect, useRef } from "react";

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Impact", href: "/#impact" },
    { label: "Privacy Policy", href: "#" },
  ],
};

/* ── SVG Social Icons ── */
const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);



const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const linkedInProfiles = [
  { name: "Md Faizan", href: "https://www.linkedin.com/in/md-faizan-179a06358/" },
  { name: "Laiba Khan", href: "https://www.linkedin.com/in/laiba-khan-80279938b/" },
];

const gitHubProfiles = [
  { name: "Md Faizan", href: "https://github.com/ByteByFaizan" },
  { name: "Laiba Khan", href: "https://github.com/ByteByLaiba" },
];

export default function Footer() {
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [linkedInOpen, setLinkedInOpen] = useState(false);
  const linkedInRef = useRef<HTMLDivElement>(null);
  const [gitHubOpen, setGitHubOpen] = useState(false);
  const gitHubRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!linkedInOpen && !gitHubOpen) return;
    function handleClick(e: MouseEvent) {
      if (linkedInOpen && linkedInRef.current && !linkedInRef.current.contains(e.target as Node)) {
        setLinkedInOpen(false);
      }
      if (gitHubOpen && gitHubRef.current && !gitHubRef.current.contains(e.target as Node)) {
        setGitHubOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [linkedInOpen, gitHubOpen]);

  // Close dropdowns on Escape
  useEffect(() => {
    if (!linkedInOpen && !gitHubOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLinkedInOpen(false);
        setGitHubOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [linkedInOpen, gitHubOpen]);

  return (
    <footer className="border-t border-edge bg-surface">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="flex flex-col sm:flex-row justify-between gap-8 sm:gap-12">
          {/* Brand */}
          <div className="sm:max-w-[320px]">
            <Link href="/" className="font-[family-name:var(--font-lobster)] text-3xl sm:text-4xl text-ink tracking-tight hover:opacity-80 transition-opacity">
              AptiCore
            </Link>
            <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-ink-muted">
              AI-powered fair hiring platform that detects, removes, and proves bias reduction.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12 sm:gap-16 md:gap-20">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="min-w-[100px] sm:min-w-[120px]">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-ink/60">
                  {heading}
                </h4>
                <ul className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm sm:text-[15px] text-ink-muted transition-colors hover:text-brand"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 sm:mt-16 flex flex-col items-center justify-between gap-4 border-t border-edge pt-6 sm:pt-8 sm:flex-row">
          <p className="text-xs sm:text-[13px] text-ink-faint">
            &copy; {new Date().getFullYear()} AptiCore. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-ink-muted hover:bg-brand hover:text-white transition-all duration-300 cursor-pointer group"
              aria-label="Back to top"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:-translate-y-0.5"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>

            <div className="w-px h-5 bg-edge mx-1" />

            {/* GitHub — single button with dropdown */}
            <div ref={gitHubRef} className="relative">
              <button
                onClick={() => { setGitHubOpen(!gitHubOpen); setLinkedInOpen(false); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  gitHubOpen
                    ? "bg-brand text-white"
                    : "bg-surface-alt text-ink-muted hover:bg-brand hover:text-white"
                }`}
                aria-label="GitHub profiles"
                aria-expanded={gitHubOpen}
              >
                <GitHubIcon />
              </button>

              {gitHubOpen && (
                <div
                  className="absolute bottom-full mb-2 right-0 w-48 bg-white border border-edge-light rounded-xl shadow-[0_8px_32px_rgba(28,63,58,0.12)] py-1.5 z-50"
                  style={{ animation: "linkedInPopIn 0.2s cubic-bezier(0.16,1,0.3,1)" }}
                >
                  {gitHubProfiles.map((profile) => (
                    <a
                      key={profile.name}
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-ink-light hover:bg-brand/[0.04] hover:text-brand transition-colors duration-200"
                      onClick={() => setGitHubOpen(false)}
                    >
                      <span className="w-6 h-6 rounded-full bg-[#24292f] flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </span>
                      {profile.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* LinkedIn — single button with dropdown */}
            <div ref={linkedInRef} className="relative">
              <button
                onClick={() => { setLinkedInOpen(!linkedInOpen); setGitHubOpen(false); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  linkedInOpen
                    ? "bg-brand text-white"
                    : "bg-surface-alt text-ink-muted hover:bg-brand hover:text-white"
                }`}
                aria-label="LinkedIn profiles"
                aria-expanded={linkedInOpen}
              >
                <LinkedInIcon />
              </button>

              {/* Dropdown */}
              {linkedInOpen && (
                <div
                  className="absolute bottom-full mb-2 right-0 w-48 bg-white border border-edge-light rounded-xl shadow-[0_8px_32px_rgba(28,63,58,0.12)] py-1.5 z-50"
                  style={{
                    animation: "linkedInPopIn 0.2s cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  {linkedInProfiles.map((profile) => (
                    <a
                      key={profile.name}
                      href={profile.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-ink-light hover:bg-brand/[0.04] hover:text-brand transition-colors duration-200"
                      onClick={() => setLinkedInOpen(false)}
                    >
                      <span className="w-6 h-6 rounded-full bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </span>
                      {profile.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}

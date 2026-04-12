import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#" },
    { label: "API Docs", href: "#" },
  ],
  Resources: [
    { label: "Blog", href: "#" },
    { label: "Case Studies", href: "#" },
    { label: "Guides", href: "#" },
    { label: "Support", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Impact", href: "#impact" },
    { label: "Careers", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-edge bg-surface">
      <div className="max-w-[1100px] mx-auto px-4 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="font-[family-name:var(--font-lobster)] text-2xl text-ink tracking-tight">
              AptiCore
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              AI-powered fair hiring platform that detects, removes, and proves bias reduction.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-ink/60">
                {heading}
              </h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-edge pt-8 sm:flex-row">
          <p className="text-xs text-ink-faint">
            &copy; {new Date().getFullYear()} AptiCore. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["GH", "X", "in"].map((social) => (
              <a
                key={social}
                href="#"
                className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center text-ink-muted text-xs font-semibold hover:bg-brand hover:text-white transition-all duration-300"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

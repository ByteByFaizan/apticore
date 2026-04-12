import Link from "next/link";

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

export default function Footer() {
  return (
    <footer className="border-t border-edge bg-surface">
      <div className="max-w-[1100px] mx-auto px-4 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row justify-between gap-12 sm:gap-8">
          {/* Brand */}
          <div className="sm:max-w-[320px]">
            <Link href="/" className="font-[family-name:var(--font-lobster)] text-4xl text-ink tracking-tight hover:opacity-80 transition-opacity">
              AptiCore
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              AI-powered fair hiring platform that detects, removes, and proves bias reduction.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 sm:gap-20">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading} className="min-w-[120px]">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-ink/60">
                  {heading}
                </h4>
                <ul className="mt-5 space-y-3.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[15px] text-ink-muted transition-colors hover:text-brand"
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
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-edge pt-8 sm:flex-row">
          <p className="text-[13px] text-ink-faint">
            &copy; {new Date().getFullYear()} AptiCore. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["GH", "X", "in"].map((social) => (
              <a
                key={social}
                href="#"
                className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-ink-muted text-xs font-semibold hover:bg-brand hover:text-white transition-all duration-300"
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

const logos = [
  "Google", "Deloitte", "Accenture", "Infosys", "Wipro",
  "TCS", "McKinsey", "HCLTech", "SAP", "IBM",
];

export default function SocialProof() {
  return (
    <section className="py-6 bg-white border-t border-b border-edge-light text-center overflow-hidden">
      <p className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
        Trusted by forward-thinking organizations
      </p>
      <div className="overflow-hidden">
        <div className="flex animate-scroll-logos w-max">
          {[0, 1].map((dup) => (
            <div className="flex items-center gap-12 px-6" key={dup}>
              {logos.map((name) => (
                <span
                  key={`${dup}-${name}`}
                  className="text-ink-faint/60 font-display text-base font-bold whitespace-nowrap select-none hover:text-ink-muted transition-colors duration-300 tracking-tight"
                >
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

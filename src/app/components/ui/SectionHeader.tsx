import RevealOnScroll from "./RevealOnScroll";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = true,
}: SectionHeaderProps) {
  return (
    <RevealOnScroll className={center ? "text-center" : ""}>
      <p className="text-ink-muted text-sm font-medium uppercase tracking-widest">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-ink text-3xl sm:text-4xl font-semibold leading-tight tracking-tight font-display">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-ink-light text-base font-medium leading-7 ${center ? "max-w-[540px] mx-auto" : "max-w-[506px]"}`}>
          {subtitle}
        </p>
      )}
    </RevealOnScroll>
  );
}

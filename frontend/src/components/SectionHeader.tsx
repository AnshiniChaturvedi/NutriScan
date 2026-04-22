export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl md:text-5xl font-normal leading-[1.02] tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-4 text-sm tracking-[0.12em] text-white/70 max-w-3xl">{subtitle}</p> : null}
    </div>
  );
}

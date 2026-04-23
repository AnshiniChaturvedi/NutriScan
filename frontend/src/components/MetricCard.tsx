export default function MetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="liquid-glass rounded-2xl p-5 border border-white/10 transition-transform duration-300 hover:-translate-y-1">
      <p className="text-3xl md:text-4xl font-normal">{value}</p>
      <p className="mt-2 text-[11px] tracking-[0.2em] text-white/70">{label}</p>
    </div>
  );
}

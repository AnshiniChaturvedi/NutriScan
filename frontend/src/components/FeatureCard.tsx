import { ReactNode } from 'react';

export default function FeatureCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
}) {
  return (
    <article className="glass rounded-2xl p-6 border border-white/10">
      {icon ? <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center mb-4">{icon}</div> : null}
      <h3 className="text-xl font-medium tracking-tight">{title}</h3>
      <p className="mt-3 text-sm text-white/70 leading-relaxed">{body}</p>
    </article>
  );
}

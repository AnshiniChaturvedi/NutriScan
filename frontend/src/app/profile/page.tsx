import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';
import MetricCard from '@/components/MetricCard';

export default function ProfilePage() {
  return (
    <PageShell title="Profile" subtitle="Your nutrition journey overview, preferences, and progress signals.">
      <section className="page-wrap section-block">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AnimatedReveal className="glass rounded-2xl border border-white/10 p-6 lg:col-span-2">
            <h2 className="text-2xl font-medium">User Snapshot</h2>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/75">
              <div className="glass rounded-xl p-4">Name: Demo User</div>
              <div className="glass rounded-xl p-4">Goal: Better label awareness</div>
              <div className="glass rounded-xl p-4">Primary focus: Sugar + sodium</div>
              <div className="glass rounded-xl p-4">Alerts: Weekly digest enabled</div>
            </div>
          </AnimatedReveal>
          <AnimatedReveal delay={0.1} className="space-y-3">
            <MetricCard value="138" label="TOTAL SCANS" />
            <MetricCard value="74" label="AVG HEALTH SCORE" />
            <MetricCard value="+12%" label="IMPROVEMENT TREND" />
          </AnimatedReveal>
        </div>
      </section>
    </PageShell>
  );
}

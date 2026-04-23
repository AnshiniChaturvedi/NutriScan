import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="How we handle your data and protect your privacy.">
      <section className="page-wrap section-block space-y-4">
        <AnimatedReveal className="glass rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-medium">Data We Collect</h2>
          <p className="mt-3 text-sm text-white/70">Account details, scan activity, and app usage data required to personalize your experience.</p>
        </AnimatedReveal>
        <AnimatedReveal delay={0.06} className="glass rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-medium">How We Use Data</h2>
          <p className="mt-3 text-sm text-white/70">To provide scan analysis, improve recommendations, and maintain platform reliability.</p>
        </AnimatedReveal>
        <AnimatedReveal delay={0.12} className="glass rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-medium">Your Choices</h2>
          <p className="mt-3 text-sm text-white/70">You can request account data export or deletion through support contact channels.</p>
        </AnimatedReveal>
      </section>
    </PageShell>
  );
}

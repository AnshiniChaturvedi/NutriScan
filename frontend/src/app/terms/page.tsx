import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service" subtitle="Please read these terms carefully before using NutriScan.">
      <section className="page-wrap section-block space-y-4">
        <AnimatedReveal className="glass rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-medium">Use of Service</h2>
          <p className="mt-3 text-sm text-white/70">NutriScan is intended for informational use and personal wellness education.</p>
        </AnimatedReveal>
        <AnimatedReveal delay={0.06} className="glass rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-medium">Account Responsibility</h2>
          <p className="mt-3 text-sm text-white/70">You are responsible for account security and data entered through your profile.</p>
        </AnimatedReveal>
        <AnimatedReveal delay={0.12} className="glass rounded-2xl border border-white/10 p-6">
          <h2 className="text-2xl font-medium">No Medical Guarantee</h2>
          <p className="mt-3 text-sm text-white/70">Outputs are guidance signals and not a substitute for professional healthcare advice.</p>
        </AnimatedReveal>
      </section>
    </PageShell>
  );
}

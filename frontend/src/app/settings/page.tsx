import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';

export default function SettingsPage() {
  return (
    <PageShell title="Settings" subtitle="Manage your account preferences, alerts, and personalization options.">
      <section className="page-wrap section-block">
        <div className="space-y-4">
          <AnimatedReveal className="glass rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-medium">Notifications</h2>
            <div className="mt-4 space-y-2 text-sm text-white/75">
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-green-500" /> Weekly health summary</label>
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-green-500" /> Product risk alerts</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-green-500" /> New feature updates</label>
            </div>
          </AnimatedReveal>
          <AnimatedReveal delay={0.08} className="glass rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-medium">Nutrition Preferences</h2>
            <p className="mt-3 text-sm text-white/70">Configure dietary priorities such as low sugar, low sodium, and additive sensitivity.</p>
          </AnimatedReveal>
          <AnimatedReveal delay={0.14} className="glass rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-medium">Security</h2>
            <button className="btn-secondary mt-4">CHANGE PASSWORD</button>
          </AnimatedReveal>
        </div>
      </section>
    </PageShell>
  );
}

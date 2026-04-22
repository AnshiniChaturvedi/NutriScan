import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';

export default function ContactPage() {
  return (
    <PageShell title="Contact Us" subtitle="Questions, feedback, partnerships, or support - we would love to hear from you.">
      <section className="page-wrap section-block">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatedReveal className="glass rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-medium">Send us a message</h2>
            <form className="mt-6 space-y-4">
              <input className="w-full rounded-xl bg-[#0f172a] border border-white/10 px-4 py-3 text-sm outline-none" placeholder="Name" />
              <input className="w-full rounded-xl bg-[#0f172a] border border-white/10 px-4 py-3 text-sm outline-none" placeholder="Email" />
              <textarea className="w-full rounded-xl bg-[#0f172a] border border-white/10 px-4 py-3 text-sm outline-none min-h-36" placeholder="Your message" />
              <button type="submit" className="btn-primary w-full">
                SEND MESSAGE
              </button>
            </form>
          </AnimatedReveal>
          <AnimatedReveal delay={0.1} className="liquid-glass-strong rounded-3xl p-8 border border-white/10">
            <h3 className="text-2xl font-medium">Support details</h3>
            <p className="mt-4 text-sm text-white/75">Email: support@nutriscan.ai</p>
            <p className="mt-2 text-sm text-white/75">Partnerships: growth@nutriscan.ai</p>
            <p className="mt-2 text-sm text-white/75">Avg response time: under 24 hours</p>
            <div className="mt-7 rounded-2xl overflow-hidden border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=1200&q=80"
                alt="Customer support"
                className="w-full h-52 object-cover"
              />
            </div>
          </AnimatedReveal>
        </div>
      </section>
    </PageShell>
  );
}

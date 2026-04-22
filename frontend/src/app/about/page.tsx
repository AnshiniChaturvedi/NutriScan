import { Brain, HeartPulse, ShieldCheck } from 'lucide-react';
import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';
import SectionHeader from '@/components/SectionHeader';
import FeatureCard from '@/components/FeatureCard';

export default function AboutPage() {
  return (
    <PageShell title="About NutriScan" subtitle="We make food labels understandable so better decisions become effortless.">
      <section className="page-wrap section-block pt-8">
        <AnimatedReveal className="glass rounded-3xl border border-white/10 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80"
            alt="Healthy meal prep"
            className="w-full h-72 object-cover"
          />
        </AnimatedReveal>
      </section>

      <section className="page-wrap section-block pt-2">
        <AnimatedReveal>
          <SectionHeader
            eyebrow="OUR MISSION"
            title="Turn complex nutrition science into clear daily guidance."
            subtitle="NutriScan blends food composition signals, evidence-based rules, and AI interpretation into a practical score you can act on."
          />
        </AnimatedReveal>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedReveal delay={0.05}>
            <FeatureCard title="Evidence-led" body="Benchmarked logic for sugar, sodium, fats, and processing risk." icon={<ShieldCheck size={18} />} />
          </AnimatedReveal>
          <AnimatedReveal delay={0.1}>
            <FeatureCard title="AI clarity" body="Ingredient-level explanations written for normal people, not researchers." icon={<Brain size={18} />} />
          </AnimatedReveal>
          <AnimatedReveal delay={0.15}>
            <FeatureCard title="Health-first" body="Designed to support better long-term habits, one product at a time." icon={<HeartPulse size={18} />} />
          </AnimatedReveal>
        </div>
      </section>
    </PageShell>
  );
}

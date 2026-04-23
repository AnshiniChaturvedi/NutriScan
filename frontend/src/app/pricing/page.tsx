import Link from 'next/link';
import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';
import SectionHeader from '@/components/SectionHeader';

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    features: ['Daily barcode scans', 'Basic health score', 'Ingredient highlights'],
  },
  {
    name: 'Pro',
    price: '$9/mo',
    features: ['Unlimited scans', 'Advanced risk insights', 'Smart alternatives and history'],
  },
  {
    name: 'Family',
    price: '$19/mo',
    features: ['Up to 5 profiles', 'Shared pantry tracking', 'Priority support'],
  },
];

export default function PricingPage() {
  return (
    <PageShell title="Pricing" subtitle="Simple plans designed for individuals and families improving daily nutrition choices.">
      <section className="page-wrap section-block">
        <AnimatedReveal>
          <SectionHeader eyebrow="PLANS" title="Choose the right plan for your goals." />
        </AnimatedReveal>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier, idx) => (
            <AnimatedReveal key={tier.name} delay={idx * 0.06} className="glass rounded-2xl p-6 border border-white/10">
              <p className="text-[11px] tracking-[0.2em] text-white/70">{tier.name.toUpperCase()}</p>
              <p className="mt-3 text-4xl font-normal">{tier.price}</p>
              <ul className="mt-5 space-y-2 text-sm text-white/75">
                {tier.features.map(f => (
                  <li key={f}>- {f}</li>
                ))}
              </ul>
              <Link href="/signup" className="btn-primary mt-6 inline-block w-full text-center">
                GET STARTED
              </Link>
            </AnimatedReveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

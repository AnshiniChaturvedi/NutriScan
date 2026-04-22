import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';

const faqs = [
  {
    q: 'How does NutriScan score a product?',
    a: 'Scores combine nutrient profile, processing level, and ingredient signals to give a practical health view.',
  },
  {
    q: 'Is NutriScan medical advice?',
    a: 'No. NutriScan provides educational insights and should not replace professional medical consultation.',
  },
  {
    q: 'Can I use image uploads instead of barcode?',
    a: 'Yes, supported flows include barcode scan, manual lookup, and product image upload on scan tools.',
  },
];

export default function FaqPage() {
  return (
    <PageShell title="Frequently Asked Questions" subtitle="Everything you need to know about scans, scores, and recommendations.">
      <section className="page-wrap section-block">
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <AnimatedReveal key={item.q} delay={idx * 0.06} className="glass rounded-2xl border border-white/10 p-6">
              <h3 className="text-xl font-medium">{item.q}</h3>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">{item.a}</p>
            </AnimatedReveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

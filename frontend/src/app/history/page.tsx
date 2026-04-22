import Link from 'next/link';
import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';

const historyItems = [
  { name: 'Whole Grain Cereal', score: 82, date: '2026-04-20', barcode: '1234567890123' },
  { name: 'Protein Snack Bar', score: 68, date: '2026-04-19', barcode: '9876543210987' },
  { name: 'Tomato Pasta Sauce', score: 74, date: '2026-04-18', barcode: '5432167890543' },
];

export default function HistoryPage() {
  return (
    <PageShell title="Scan History" subtitle="Review your recent product scans and jump back into detailed analysis.">
      <section className="page-wrap section-block">
        <div className="space-y-3">
          {historyItems.map((item, idx) => (
            <AnimatedReveal key={item.barcode} delay={idx * 0.05} className="glass rounded-2xl border border-white/10 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <p className="text-xs tracking-[0.16em] text-white/65 mt-1">DATE: {item.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge-pill liquid-glass">SCORE {item.score}</span>
                  <Link href={`/dashboard?barcode=${item.barcode}`} className="btn-secondary">
                    VIEW DETAILS
                  </Link>
                </div>
              </div>
            </AnimatedReveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

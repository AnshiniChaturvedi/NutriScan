'use client';

import dynamic from 'next/dynamic';
import { Scan } from 'lucide-react';
import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="w-9 h-9 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function ScanPage() {
  return (
    <PageShell title="Scan a Product" subtitle="Point your camera at any food product barcode for an instant full health analysis.">
      <section className="page-wrap section-block pt-8">
        <AnimatedReveal className="glass rounded-3xl p-8 border border-white/10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 mb-5">
            <Scan className="text-green-400" size={26} />
          </div>
          <BarcodeScanner />
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'Manual input', 'Image upload'].map(t => (
              <span key={t} className="badge-pill glass text-slate-400">
                {t}
              </span>
            ))}
          </div>
        </AnimatedReveal>
      </section>
    </PageShell>
  );
}

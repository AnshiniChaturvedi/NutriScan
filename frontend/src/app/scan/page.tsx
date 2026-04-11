'use client';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { Scan } from 'lucide-react';

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
    <main className="min-h-screen bg-bg-primary overflow-hidden">
      <Navbar />

      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-10">
        {/* Header */}
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-5">
            <Scan className="text-green-400" size={28} />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">Scan a Product</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
            Use camera scan, type manually, or upload a photo.
          </p>
        </div>

        {/* Scanner widget */}
        <div className="relative z-10 w-full">
          <BarcodeScanner />
        </div>

        {/* Hint chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-8 relative z-10">
          {['Scan barcode', 'Type product name', 'Manual barcode', 'Upload image'].map(t => (
            <span key={t} className="px-3 py-1 rounded-full glass text-slate-500 text-xs border border-white/5">
              {t}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

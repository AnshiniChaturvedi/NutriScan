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

      {/* Ambient glows */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed top-2/3 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      {/* Animated grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(34,197,94,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-10">
        {/* Pulse rings behind scanner */}
        <div className="absolute flex items-center justify-center">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute rounded-full border border-green-500/10"
              style={{
                width:  `${300 + i * 120}px`,
                height: `${300 + i * 120}px`,
                animation: `ping ${1.5 + i * 0.5}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-5 relative">
            <Scan className="text-green-400" size={28} />
            <div className="absolute inset-0 rounded-2xl border border-green-500/30 animate-ping opacity-30" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">Scan a Product</h1>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
            Point your camera at any food product barcode for an instant full health analysis.
          </p>
        </div>

        {/* Scanner widget */}
        <div className="relative z-10 w-full">
          <BarcodeScanner />
        </div>

        {/* Hint chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-8 relative z-10">
          {['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'Manual input', 'Image upload'].map(t => (
            <span key={t} className="px-3 py-1 rounded-full glass text-slate-500 text-xs border border-white/5">
              {t}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

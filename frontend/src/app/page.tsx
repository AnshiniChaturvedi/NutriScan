'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, Menu, Sparkles, Wand2 } from 'lucide-react';
import { ProgramsOverlay } from '@/components/ProgramsOverlay';
import { StaggeredMenu } from '@/components/StaggeredMenu';

const tags = [
  'WHO/UK FSA BENCHMARKS',
  'NOVA CLASSIFICATION',
  'AGE-GROUP IMPACTS',
  'AI INGREDIENT EXPLANATIONS',
  'HEALTHIER SWAPS',
];

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);

  return (
    <main className="min-h-screen w-full text-white overflow-x-hidden font-sans bg-bg-primary">
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        <section className="relative min-h-screen w-full lg:w-[52%] flex items-stretch">
          <div className="liquid-glass-strong absolute inset-4 lg:inset-6 rounded-3xl" />
          <div className="relative flex flex-col w-full px-8 lg:px-12 py-8 lg:py-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="NutriScan logo" width={32} height={32} />
                <span className="text-2xl font-semibold tracking-tighter text-white">nutriscan</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(v => !v)}
                className="liquid-glass px-5 py-3 rounded-full inline-flex items-center gap-3 text-white/90"
              >
                <Menu size={18} />
                <span className="text-[12px] font-medium tracking-[0.22em]">MENU</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center pt-10 pb-6">
              <Image src="/logo.svg" alt="NutriScan logo" width={80} height={80} className="opacity-95" />
              <div className="mt-10">
                <div className="overflow-visible pb-2">
                  <h1 className="text-5xl lg:text-7xl font-medium tracking-tight leading-[1.08]">Reimagining the</h1>
                </div>
                <div className="overflow-visible pb-2">
                  <h1 className="text-5xl lg:text-7xl font-medium tracking-tight leading-[1.08]">
                    <span className="text-white/90">science of</span>{' '}
                    <span className="font-serif italic" style={{ color: 'hsla(140, 70%, 45%, 0.9)' }}>
                      nutrition AI
                    </span>
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push('/scan')}
                className="liquid-glass-strong mt-12 rounded-full px-8 py-4 inline-flex items-center gap-4"
              >
                <span className="w-10 h-10 rounded-full grid place-items-center bg-white/15">
                  <ArrowRight size={18} />
                </span>
                <span className="text-[13px] font-medium tracking-[0.18em] text-white">Scan Your Food</span>
              </button>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {['Instant Food Scanning', 'AI Nutrition Insights', 'Health Tracking'].map(p => (
                  <span key={p} className="liquid-glass rounded-full px-5 py-3 text-[12px] text-white/80 tracking-[0.12em]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="hidden lg:flex relative min-h-screen w-[48%] p-6">
          <div className="liquid-glass absolute inset-6 rounded-3xl opacity-70" />
          <div className="relative flex flex-col w-full p-10">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMenuOpen(v => !v)}
                className="liquid-glass rounded-full px-5 py-3 inline-flex items-center gap-3 text-white/90"
              >
                <Menu size={16} />
                <span className="text-[12px] font-medium tracking-[0.22em]">MENU</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="liquid-glass rounded-full px-5 py-3 inline-flex items-center gap-3 text-white/90"
              >
                <Sparkles size={16} />
                <span className="text-[12px] font-medium tracking-[0.22em]">ACCOUNT</span>
              </button>
            </div>

            <div className="liquid-glass mt-10 rounded-3xl p-8">
              <div className="text-xl font-medium tracking-tight text-white">Join the health ecosystem</div>
              <div className="mt-3 text-[12px] tracking-[0.14em] text-white/70 leading-relaxed">
                Track meals, scan products, and make smarter food decisions daily.
              </div>
            </div>

            <div className="mt-auto liquid-glass rounded-[2.5rem] p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="liquid-glass rounded-3xl p-6">
                  <div className="w-11 h-11 rounded-2xl bg-white/12 grid place-items-center text-white/90">
                    <Wand2 size={18} />
                  </div>
                  <div className="mt-4 text-[14px] font-medium tracking-[0.12em] text-white">Food Analysis</div>
                </div>
                <div className="liquid-glass rounded-3xl p-6">
                  <div className="w-11 h-11 rounded-2xl bg-white/12 grid place-items-center text-white/90">
                    <BookOpen size={18} />
                  </div>
                  <div className="mt-4 text-[14px] font-medium tracking-[0.12em] text-white">Nutrition History</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="relative z-20 pointer-events-auto">
        <section className="relative py-24 px-6 md:px-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="tracking-[0.28em] text-[11px]" style={{ color: 'var(--accent)' }}>
                START HERE
              </p>
              <h2 className="mt-4 text-4xl md:text-6xl font-normal leading-[0.95]">
                Know your food in seconds,
                <span className="block gradient-text">eat with confidence.</span>
              </h2>
              <p className="mt-6 text-[12px] tracking-[0.2em] text-white/70 max-w-xl leading-relaxed">
                Scan labels, decode ingredients, and get clearer health signals designed for everyday decisions.
              </p>
            </div>
            <div className="glass rounded-3xl overflow-hidden border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80"
                alt="Fresh healthy ingredients"
                className="w-full h-64 object-cover"
              />
            </div>
          </div>
        </section>

        <section className="relative py-28 px-6 md:px-16">
          <div className="max-w-6xl mx-auto">
            <p className="tracking-[0.28em] text-[11px]" style={{ color: 'var(--accent)' }}>
              BUILT FOR FOOD + HEALTH
            </p>
            <h2 className="mt-4 text-4xl md:text-6xl font-normal leading-[0.95]">
              Luxury-grade nutrition intelligence,
              <span className="block gradient-text"> made practical.</span>
            </h2>
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
              <SimpleCard title="SUGAR SIGNALS" body="GLYCEMIC IMPACT, ADDED SUGARS, SWEETENERS, AND WHY IT MATTERS." />
              <SimpleCard title="HEART CHECK" body="SATURATED FAT + SODIUM FLAGS WITH CLEAR WHAT TO DO NEXT." />
              <SimpleCard title="CLEAN LABEL" body="NOVA + ADDITIVES WITH INSTANT CLARITY ON ULTRA-PROCESSING." />
            </div>
          </div>
        </section>

        <section className="relative py-28 px-6 md:px-16">
          <div className="max-w-6xl mx-auto">
            <p className="tracking-[0.28em] text-[11px]" style={{ color: 'var(--accent-2)' }}>
              THE EXPERIENCE
            </p>
            <h3 className="mt-4 text-4xl md:text-5xl font-normal leading-[0.95]">
              A report you can feel.
              <span className="block gradient-text-warm"> Not just read.</span>
            </h3>
            <div className="mt-10 flex flex-wrap gap-3">
              {tags.map(t => (
                <span key={t} className="liquid-glass rounded-full px-4 py-2 text-[11px] tracking-[0.22em] text-white/80">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <StaggeredMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onGoHome={() => router.push('/')}
        onGoScan={() => router.push('/scan')}
        onGoDashboard={() => router.push('/dashboard')}
        onGoPricing={() => router.push('/pricing')}
        onGoFaq={() => router.push('/faq')}
      />

      <div className="fixed bottom-8 right-8 z-50 pointer-events-auto">
        <AnimatePresence mode="wait">
          {!isProgramsOpen ? (
            <motion.button
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              type="button"
              onClick={() => setIsProgramsOpen(true)}
              className="px-6 py-3 md:px-12 md:py-5 text-[13px] md:text-[18px] font-normal tracking-[0.15em] bg-white text-black border border-white/10"
            >
              JOIN THE CLUB
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      <ProgramsOverlay isOpen={isProgramsOpen} onClose={() => setIsProgramsOpen(false)} />
    </main>
  );
}

function SimpleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass rounded-3xl p-8 border border-white/10">
      <p className="text-[11px] tracking-[0.28em] text-white/70">SIGNAL</p>
      <h4 className="mt-4 text-2xl md:text-3xl font-normal">{title}</h4>
      <p className="mt-5 text-[11px] tracking-[0.22em] text-white/70 leading-relaxed">{body}</p>
    </div>
  );
}

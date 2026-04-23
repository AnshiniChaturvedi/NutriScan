'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Menu, Sparkles, Wand2 } from 'lucide-react';
import ChatAssistant from '@/components/ChatAssistant';
import { StaggeredMenu } from '@/components/StaggeredMenu';
import AnimatedReveal from '@/components/AnimatedReveal';

const tags = [
  'WHO/UK FSA BENCHMARKS',
  'NOVA CLASSIFICATION',
  'AGE-GROUP IMPACTS',
  'AI INGREDIENT EXPLANATIONS',
  'HEALTHIER SWAPS',
];

const builtKeywordCards = [
  {
    title: 'SUGAR SIGNALS',
    body: 'GLYCEMIC IMPACT, ADDED SUGARS, SWEETENERS, AND WHY IT MATTERS.',
    image:
      'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'HEART CHECK',
    body: 'SATURATED FAT + SODIUM FLAGS WITH CLEAR WHAT TO DO NEXT.',
    image:
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'CLEAN LABEL',
    body: 'NOVA + ADDITIVES WITH INSTANT CLARITY ON ULTRA-PROCESSING.',
    image:
      'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80',
  },
];

const experienceKeywordCards = [
  {
    keyword: 'WHO/UK FSA BENCHMARKS',
    body: 'Benchmarked nutrition scores designed for trustworthy label interpretation.',
    image:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80',
  },
  {
    keyword: 'NOVA CLASSIFICATION',
    body: 'Understand processing levels instantly with direct ultra-processed food flags.',
    image:
      'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    keyword: 'AGE-GROUP IMPACTS',
    body: 'Get relevance for kids, teens, adults, and seniors in one quick glance.',
    image:
      'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=80',
  },
  {
    keyword: 'AI INGREDIENT EXPLANATIONS',
    body: 'Translate complex ingredients into plain language and practical action.',
    image:
      'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&q=80',
  },
  {
    keyword: 'HEALTHIER SWAPS',
    body: 'Discover cleaner alternatives and smarter choices for each product category.',
    image:
      'https://images.unsplash.com/photo-1467453678174-768ec283a940?auto=format&fit=crop&w=1200&q=80',
  },
  {
    keyword: 'PERSONAL HEALTH FIT',
    body: 'Context-aware guidance matched to your health goals and daily food patterns.',
    image:
      'https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <div className="h-11 w-[118px]" aria-hidden="true" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center pt-10 pb-6">
              <div>
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

            <div className="liquid-glass mt-6 rounded-3xl overflow-hidden border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80"
                alt="Healthy meal ingredients"
                className="w-full h-44 object-cover"
              />
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
            <AnimatedReveal>
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
            </AnimatedReveal>
            <AnimatedReveal delay={0.08} className="glass rounded-3xl overflow-hidden border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=80"
                alt="Fresh healthy ingredients"
                className="w-full h-64 object-cover"
              />
            </AnimatedReveal>
          </div>
        </section>

        <section className="relative py-28 px-6 md:px-16">
          <AnimatedReveal className="max-w-6xl mx-auto">
            <p className="tracking-[0.28em] text-[11px]" style={{ color: 'var(--accent)' }}>
              BUILT FOR FOOD + HEALTH
            </p>
            <h2 className="mt-4 text-4xl md:text-6xl font-normal leading-[0.95]">
              Luxury-grade nutrition intelligence,
              <span className="block gradient-text"> made practical.</span>
            </h2>
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
              {builtKeywordCards.map(card => (
                <SimpleCard key={card.title} title={card.title} body={card.body} image={card.image} />
              ))}
            </div>
          </AnimatedReveal>
        </section>

        <section className="relative py-28 px-6 md:px-16">
          <AnimatedReveal className="max-w-6xl mx-auto">
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

            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {experienceKeywordCards.map(item => (
                <div
                  key={item.keyword}
                  className="group relative aspect-square rounded-2xl border border-white/10 overflow-hidden glass transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,0,0,0.3)]"
                >
                  <img
                    src={item.image}
                    alt={item.keyword}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.16),transparent_45%)] opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                  <div className="relative h-full p-3 md:p-4 flex flex-col justify-end">
                    <p className="text-[9px] md:text-[10px] tracking-[0.16em] text-[var(--accent)] leading-snug">{item.keyword}</p>
                    <p className="mt-2 text-[10px] md:text-[11px] tracking-[0.04em] text-white/80 leading-snug line-clamp-3">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedReveal>
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

      <ChatAssistant productContext={null} launcherVariant="icon" />
    </main>
  );
}

function SimpleCard({ title, body, image }: { title: string; body: string; image: string }) {
  return (
    <div className="glass lift-hover rounded-3xl border border-white/10 overflow-hidden">
      <img src={image} alt={title} className="w-full h-40 object-cover" />
      <div className="p-8">
        <p className="text-[11px] tracking-[0.28em] text-white/70">SIGNAL</p>
        <h4 className="mt-4 text-2xl md:text-3xl font-normal">{title}</h4>
        <p className="mt-5 text-[11px] tracking-[0.22em] text-white/70 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

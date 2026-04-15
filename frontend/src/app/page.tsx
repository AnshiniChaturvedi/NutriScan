'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ProgramsOverlay } from '@/components/ProgramsOverlay';
import { StaggeredMenu } from '@/components/StaggeredMenu';
import {
  ArrowRight,
  BookOpen,
  Instagram,
  Linkedin,
  Menu,
  Sparkles,
  Twitter,
  Wand2,
} from 'lucide-react';

const VIDEO_URL =
  'https://cdn.coverr.co/videos/coverr-healthy-lifestyle-with-fresh-fruits-4584/1080p.mp4';

const easeHero: [number, number, number, number] = [0.22, 1, 0.36, 1];
const easeFleet: [number, number, number, number] = [0.19, 1, 0.22, 1];

const textVariants = {
  hidden: { opacity: 0, y: 40, transition: { duration: 0.48, ease: easeHero } },
  visible: { opacity: 1, y: 0, transition: { duration: 0.96, ease: easeHero } },
};

type Ripple = {
  el: HTMLDivElement;
  active: boolean;
  age: number;
  x: number;
  y: number;
};

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);

  const lastSpawn = useRef<{ x: number; y: number } | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rippleIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const heroParentVariants = useMemo(
    () => ({
      hidden: {},
      visible: { transition: { staggerChildren: 0.12 } },
      exit: { transition: { staggerChildren: 0.06, staggerDirection: -1 } },
    }),
    []
  );

  useEffect(() => {
    const ripples = ripplesRef.current;
    if (!ripples.length) return;

    const loop = () => {
      for (const r of ripples) {
        if (!r.active) continue;
        r.age += 0.012;
        const size = 20 + r.age * 280;
        const opacity = Math.max(0, 1 - Math.pow(r.age, 1.2));
        r.el.style.width = `${size}px`;
        r.el.style.height = `${size}px`;
        r.el.style.left = `${r.x - size / 2}px`;
        r.el.style.top = `${r.y - size / 2}px`;
        r.el.style.opacity = `${opacity}`;
        if (r.age >= 1) {
          r.active = false;
          r.el.style.opacity = '0';
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const last = lastSpawn.current;
      const x = e.clientX;
      const y = e.clientY;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        if (Math.hypot(dx, dy) <= 25) return;
      }
      lastSpawn.current = { x, y };

      const ripples = ripplesRef.current;
      if (!ripples.length) return;
      const idx = rippleIndexRef.current % ripples.length;
      rippleIndexRef.current += 1;
      const r = ripples[idx];
      r.active = true;
      r.age = 0;
      r.x = x;
      r.y = y;
      r.el.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    if (!isProgramsOpen) return;
    setIsMenuOpen(false);
  }, [isProgramsOpen]);

  const isOverlayOpen = isProgramsOpen;

  return (
    <main className="min-h-screen w-full text-white overflow-x-hidden font-sans">
      {/* z-0: background video */}
      <motion.div
        className="fixed inset-0 z-0"
        animate={{
          filter: isOverlayOpen ? 'blur(100px)' : 'blur(0px)',
          transition: { duration: isOverlayOpen ? 1.56 : 1.3, ease: easeFleet },
        }}
      >
        <video className="w-full h-full object-cover" src={VIDEO_URL} autoPlay loop muted playsInline />
        <div className="absolute inset-0 bg-black/55" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(1100px 700px at 20% 10%, rgba(34,197,94,0.22), transparent 55%), radial-gradient(900px 600px at 80% 20%, rgba(249,115,22,0.18), transparent 55%), radial-gradient(900px 700px at 60% 90%, rgba(167,243,208,0.12), transparent 55%)',
          }}
        />
      </motion.div>

      {/* hidden SVG filter */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <filter id="liquid-trail">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* z-10: hero UI */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel */}
        <section className="relative min-h-screen w-full lg:w-[52%] flex items-stretch">
          <div className="liquid-glass-strong absolute inset-4 lg:inset-6 rounded-3xl" />

          <div className="relative flex flex-col w-full px-8 lg:px-12 py-8 lg:py-10">
            {/* Navbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="NutriScan logo" width={32} height={32} />
                <span className="text-2xl font-semibold tracking-tighter text-white">nutriscan</span>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(v => !v)}
                className="liquid-glass px-5 py-3 rounded-full inline-flex items-center gap-3 text-white/90 hover:scale-[1.03] active:scale-[0.98] transition-transform"
              >
                <Menu size={18} />
                <span className="text-[12px] font-medium tracking-[0.22em]">MENU</span>
              </button>
            </div>

            {/* Hero center */}
            <div className="flex-1 flex flex-col items-center justify-center text-center pt-10 pb-6">
              <Image src="/logo.svg" alt="NutriScan logo" width={80} height={80} className="opacity-95" />

              <div className="mt-10">
                <AnimatePresence mode="wait">
                  {!isOverlayOpen ? (
                    <motion.div key="hero" initial="hidden" animate="visible" exit="hidden" variants={heroParentVariants}>
                      <div className="overflow-hidden">
                        <motion.h1
                          variants={textVariants}
                          className="text-5xl lg:text-7xl font-medium tracking-tight leading-[0.95]"
                        >
                          Reimagining the
                        </motion.h1>
                      </div>
                      <div className="overflow-hidden">
                        <motion.h1
                          variants={textVariants}
                          className="text-5xl lg:text-7xl font-medium tracking-tight leading-[0.95]"
                        >
                          <span className="text-white/90">science of</span>{' '}
                          <span className="font-serif italic" style={{ color: 'hsla(140, 70%, 45%, 0.9)' }}>
                            nutrition AI
                          </span>
                        </motion.h1>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <motion.button
                type="button"
                onClick={() => router.push('/scan')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="liquid-glass-strong mt-12 rounded-full px-8 py-4 inline-flex items-center gap-4"
                style={{ boxShadow: '0 0 50px rgba(34,197,94,0.18), 0 0 35px rgba(249,115,22,0.12)' }}
              >
                <span className="w-10 h-10 rounded-full grid place-items-center bg-white/15">
                  <ArrowRight size={18} />
                </span>
                <span className="text-[13px] font-medium tracking-[0.18em] text-white">Scan Your Food</span>
              </motion.button>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {['Instant Food Scanning', 'AI Nutrition Insights', 'Health Tracking'].map(p => (
                  <span
                    key={p}
                    className="liquid-glass rounded-full px-5 py-3 text-[12px] text-white/80 tracking-[0.12em]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom quote */}
            <div className="mt-auto">
              <div className="text-[11px] tracking-[0.28em] text-white/50">SMART NUTRITION</div>
              <div className="mt-3 text-2xl lg:text-3xl font-medium tracking-tight text-white">
                What you eat defines{' '}
                <span className="font-serif italic text-white/85">how you live.</span>
              </div>
              <div className="mt-5 flex items-center gap-4 text-[11px] tracking-[0.22em] text-white/60">
                <span className="h-px flex-1 bg-white/15" />
                <span>NUTRISCAN AI</span>
                <span className="h-px flex-1 bg-white/15" />
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel (desktop) */}
        <section className="hidden lg:flex relative min-h-screen w-[48%] p-6">
          <div className="liquid-glass absolute inset-6 rounded-3xl opacity-70" />
          <div className="relative flex flex-col w-full p-10">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="liquid-glass rounded-full px-4 py-3 inline-flex items-center gap-3 text-white/80">
                <Twitter size={16} />
                <Linkedin size={16} />
                <Instagram size={16} />
                <span className="w-px h-5 bg-white/15 mx-1" />
                <ArrowRight size={16} />
              </div>

              <button
                type="button"
                onClick={() => setIsProgramsOpen(true)}
                className="liquid-glass rounded-full px-5 py-3 inline-flex items-center gap-3 text-white/90 hover:scale-[1.03] active:scale-[0.98] transition-transform"
              >
                <Sparkles size={16} />
                <span className="text-[12px] font-medium tracking-[0.22em]">ACCOUNT</span>
              </button>
            </div>

            {/* Community card */}
            <TiltSurface className="liquid-glass mt-10 rounded-3xl p-8 overflow-hidden relative">
              <div
                className="absolute -inset-24 opacity-60"
                style={{
                  background:
                    'radial-gradient(420px 280px at 25% 25%, rgba(34,197,94,0.22), transparent 60%), radial-gradient(420px 280px at 75% 60%, rgba(249,115,22,0.16), transparent 60%)',
                }}
              />
              <div className="relative">
              <div className="text-xl font-medium tracking-tight text-white">Join the health ecosystem</div>
              <div className="mt-3 text-[12px] tracking-[0.14em] text-white/70 leading-relaxed">
                Track meals, scan products, and make smarter food decisions daily.
              </div>
              </div>
            </TiltSurface>

            {/* Bottom feature section */}
            <TiltSurface className="mt-auto liquid-glass rounded-[2.5rem] p-8 overflow-hidden relative">
              <div
                className="absolute -inset-24 opacity-55"
                style={{
                  background:
                    'radial-gradient(520px 360px at 30% 30%, rgba(167,243,208,0.12), transparent 60%), radial-gradient(520px 360px at 75% 70%, rgba(34,197,94,0.16), transparent 60%), radial-gradient(520px 360px at 60% 15%, rgba(249,115,22,0.12), transparent 60%)',
                }}
              />
              <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                  <TiltSurface className="liquid-glass rounded-3xl p-6 hover:scale-[1.02] transition-transform">
                  <div className="w-11 h-11 rounded-2xl bg-white/12 grid place-items-center text-white/90">
                    <Wand2 size={18} />
                  </div>
                  <div className="mt-4 text-[14px] font-medium tracking-[0.12em] text-white">Food Analysis</div>
                  </TiltSurface>

                  <TiltSurface className="liquid-glass rounded-3xl p-6 hover:scale-[1.02] transition-transform">
                  <div className="w-11 h-11 rounded-2xl bg-white/12 grid place-items-center text-white/90">
                    <BookOpen size={18} />
                  </div>
                  <div className="mt-4 text-[14px] font-medium tracking-[0.12em] text-white">Nutrition History</div>
                  </TiltSurface>
              </div>

                <TiltSurface className="liquid-glass mt-4 rounded-3xl p-6 flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=60"
                    alt="Healthy meal"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium tracking-[0.12em] text-white">Advanced Food Recognition</div>
                  <div className="mt-2 text-[12px] tracking-[0.14em] text-white/70 leading-relaxed">
                    Identify ingredients and estimate calories instantly—right from the label.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProgramsOpen(true)}
                  className="w-10 h-10 rounded-full bg-white/12 text-white grid place-items-center hover:bg-white/18 transition-colors"
                  aria-label="Open"
                >
                  +
                </button>
                </TiltSurface>
              </div>
            </TiltSurface>
          </div>
        </section>
      </div>

      {/* Scrollable content (long landing) */}
      <div className="relative z-20 pointer-events-auto">
        <section className="min-h-screen" />

        <section className="relative py-28 px-6 md:px-16">
          <SectionWash />
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-8">
              <div>
                <p className="tracking-[0.28em] text-[11px]" style={{ color: 'var(--accent)' }}>
                  BUILT FOR FOOD + HEALTH
                </p>
                <h2 className="mt-4 text-4xl md:text-6xl font-normal leading-[0.95]">
                  Luxury-grade nutrition intelligence,
                  <span className="block gradient-text"> made practical.</span>
                </h2>
              </div>
              <div className="hidden md:block text-right text-[11px] tracking-[0.22em] text-white/70 max-w-sm">
                SCAN, UNDERSTAND, AND UPGRADE YOUR DAILY CHOICES WITH EVIDENCE-LED SIGNALS—NOT NOISE.
              </div>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
              <TiltCard
                title="SUGAR SIGNALS"
                body="GLYCEMIC IMPACT, ADDED SUGARS, SWEETENERS, AND WHY IT MATTERS."
                accent="var(--accent)"
              />
              <TiltCard
                title="HEART CHECK"
                body="SATURATED FAT + SODIUM FLAGS WITH CLEAR ‘WHAT TO DO NEXT’."
                accent="var(--accent-2)"
              />
              <TiltCard
                title="CLEAN LABEL"
                body="NOVA + ADDITIVES—INSTANT CLARITY ON ULTRA-PROCESSING."
                accent="var(--accent-3)"
              />
            </div>
          </div>

          <FloatingParallax />
        </section>

        <section className="relative py-28 px-6 md:px-16">
          <SectionWash variant="warm" />
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="tracking-[0.28em] text-[11px]" style={{ color: 'var(--accent-2)' }}>
                THE EXPERIENCE
              </p>
              <h3 className="mt-4 text-4xl md:text-5xl font-normal leading-[0.95]">
                A report you can feel.
                <span className="block gradient-text-warm"> Not just read.</span>
              </h3>
              <p className="mt-6 text-[12px] tracking-[0.2em] text-white/70 max-w-xl">
                EVERY SCREEN IS DESIGNED TO DRIVE ACTION—CLEAR RISK, CLEAR CONFIDENCE, CLEAR ALTERNATIVES.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                {[
                  'WHO/UK FSA BENCHMARKS',
                  'NOVA CLASSIFICATION',
                  'AGE-GROUP IMPACTS',
                  'AI INGREDIENT EXPLANATIONS',
                  'HEALTHIER SWAPS',
                ].map(t => (
                  <span
                    key={t}
                    className="liquid-glass rounded-full px-4 py-2 text-[11px] tracking-[0.22em] text-white/80 hover:scale-[1.02] transition-transform"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-12 flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/scan')}
                  className="liquid-glass-strong px-7 py-4 text-[12px] tracking-[0.22em] text-white hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(249,115,22,0.12))' }}
                >
                  START SCANNING
                </button>
                <button
                  type="button"
                  onClick={() => setIsProgramsOpen(true)}
                  className="liquid-glass px-7 py-4 text-[12px] tracking-[0.22em] text-white/90 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  SEE PROGRAMS
                </button>
              </div>
            </div>

            <div className="relative">
              <ThreeDStack />
            </div>
          </div>
        </section>

        <section className="relative py-28 px-6 md:px-16">
          <SectionWash />
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div>
                <p className="tracking-[0.28em] text-[11px]" style={{ color: 'var(--accent)' }}>
                  TRUST SIGNALS
                </p>
                <h3 className="mt-4 text-4xl md:text-5xl font-normal leading-[0.95]">
                  Designed for decisions.
                </h3>
              </div>
              <div className="text-[11px] tracking-[0.22em] text-white/70 max-w-sm">
                SIMPLE METRICS, BEAUTIFUL VISUALS, AND NO GUILT—JUST GUIDANCE.
              </div>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DepthCard kpi="0–100" label="HEALTH SCORE" glow="var(--accent)" />
              <DepthCard kpi="NOVA" label="PROCESSING LEVEL" glow="var(--accent-2)" />
              <DepthCard kpi="RISKS" label="DISEASE SIGNALS" glow="var(--accent-3)" />
              <DepthCard kpi="AGE" label="AGE-GROUP IMPACTS" glow="var(--accent-2)" />
              <DepthCard kpi="AI" label="INGREDIENT EXPLAINER" glow="var(--accent)" />
              <DepthCard kpi="SWAPS" label="SMARTER ALTERNATIVES" glow="var(--accent-3)" />
            </div>
          </div>
        </section>

        <section className="relative py-28 px-6 md:px-16">
          <SectionWash variant="cta" />
          <div className="max-w-6xl mx-auto">
            <TiltSurface className="liquid-glass-strong rounded-3xl p-10 md:p-14 overflow-hidden relative">
              <div
                className="absolute -inset-32 opacity-70"
                style={{
                  background:
                    'radial-gradient(600px 400px at 30% 20%, rgba(34,197,94,0.22), transparent 60%), radial-gradient(600px 420px at 70% 60%, rgba(249,115,22,0.20), transparent 60%), radial-gradient(600px 420px at 40% 90%, rgba(167,243,208,0.14), transparent 60%)',
                }}
              />
              <div className="relative">
                <p className="tracking-[0.28em] text-[11px] text-white/80">JOIN THE CLUB</p>
                <h3 className="mt-4 text-4xl md:text-6xl font-normal leading-[0.95]">
                  Eat with clarity.
                  <span className="block gradient-text"> Live with confidence.</span>
                </h3>
                <p className="mt-6 text-[12px] tracking-[0.2em] text-white/70 max-w-2xl">
                  NOT MEDICAL ADVICE. JUST BEAUTIFULLY ORGANIZED, EVIDENCE-LED SIGNALS—DELIVERED FAST.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => router.push('/scan')}
                    className="liquid-glass-strong px-8 py-5 text-[12px] tracking-[0.22em] text-white hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(249,115,22,0.14))' }}
                  >
                    SCAN A PRODUCT
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProgramsOpen(true)}
                    className="liquid-glass px-8 py-5 text-[12px] tracking-[0.22em] text-white/90 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    OPEN PROGRAMS
                  </button>
                </div>
              </div>
            </TiltSurface>

            <footer className="mt-12 text-center text-[11px] tracking-[0.22em] text-white/50">
              © {new Date().getFullYear()} NUTRISCAN · FOR INFORMATIONAL PURPOSES ONLY
            </footer>
          </div>
        </section>
      </div>

      {/* z-30: ripple trail */}
      <div className="fixed inset-0 z-30 pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            ref={el => {
              if (!el) return;
              if (ripplesRef.current.some(r => r.el === el)) return;
              el.style.position = 'absolute';
              el.style.borderRadius = '9999px';
              el.style.opacity = '0';
              el.style.width = '20px';
              el.style.height = '20px';
              el.style.left = '0px';
              el.style.top = '0px';
              el.style.willChange = 'transform, opacity, width, height, left, top';
              (el.style as any).backdropFilter = 'url(#liquid-trail) blur(1px)';
              el.style.boxShadow =
                'inset 0 0 30px rgba(255,255,255,0.1), 0 0 15px rgba(34,197,94,0.16), 0 0 18px rgba(249,115,22,0.10)';
              ripplesRef.current.push({ el, active: false, age: 0, x: 0, y: 0 });
            }}
          />
        ))}
      </div>

      {/* z-40: navigation menu */}
      <StaggeredMenu
        isOpen={isMenuOpen}
        onToggle={() => setIsMenuOpen(v => !v)}
        onClose={() => setIsMenuOpen(false)}
        onGoHome={() => router.push('/')}
        onGoScan={() => router.push('/scan')}
      />

      {/* z-50: join button */}
      <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
        <AnimatePresence mode="wait">
          {!isOverlayOpen ? (
            <motion.div
              key="join"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={textVariants}
              className={[
                'pointer-events-auto',
                isMenuOpen ? 'hidden md:block' : '',
              ].join(' ')}
              style={{
                transform: isMenuOpen
                  ? 'translateX(calc(-1 * clamp(260px, 38vw, 420px)))'
                  : 'translateX(0px)',
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsProgramsOpen(true)}
                className={[
                  'px-6 py-3 text-[13px] md:px-12 md:py-5 md:text-[18px] font-normal tracking-[0.15em]',
                  'backdrop-blur-md border border-white/10',
                  isMenuOpen
                    ? 'text-black hover:bg-white'
                    : 'bg-white text-black',
                ].join(' ')}
                style={{
                  background: isMenuOpen ? 'var(--accent)' : undefined,
                }}
              >
                JOIN THE CLUB
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* z-[110]/z-[120]: overlay */}
      <ProgramsOverlay isOpen={isProgramsOpen} onClose={() => setIsProgramsOpen(false)} />
    </main>
  );
}

function TiltCard({ title, body, accent }: { title: string; body: string; accent: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useTransform(y, [-60, 60], [10, -10]);
  const ry = useTransform(x, [-60, 60], [-10, 10]);

  return (
    <motion.div
      onMouseMove={e => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        x.set(e.clientX - (r.left + r.width / 2));
        y.set(e.clientY - (r.top + r.height / 2));
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 overflow-hidden"
    >
      <div
        className="absolute -inset-20 opacity-50"
        style={{
          background: `radial-gradient(420px 260px at 30% 30%, ${accent}, transparent 60%)`,
        }}
      />
      <div className="relative" style={{ transform: 'translateZ(28px)' }}>
        <p className="text-[11px] tracking-[0.28em] text-white/70">SIGNAL</p>
        <h4 className="mt-4 text-2xl md:text-3xl font-normal">{title}</h4>
        <p className="mt-5 text-[11px] tracking-[0.22em] text-white/70 leading-relaxed">{body}</p>
      </div>
      <div
        className="absolute right-6 top-6 w-10 h-10 rounded-full"
        style={{
          background: accent,
          boxShadow: `0 0 40px ${accent}`,
          transform: 'translateZ(18px)',
          opacity: 0.9,
        }}
      />
    </motion.div>
  );
}

function TiltSurface({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useTransform(y, [-70, 70], [9, -9]);
  const ry = useTransform(x, [-70, 70], [-9, 9]);

  return (
    <motion.div
      onMouseMove={e => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        x.set(e.clientX - (r.left + r.width / 2));
        y.set(e.clientY - (r.top + r.height / 2));
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      className={className}
    >
      <div style={{ transform: 'translateZ(16px)' }}>{children}</div>
    </motion.div>
  );
}

function FloatingParallax() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x1 = useTransform(mx, [-300, 300], [-20, 20]);
  const y1 = useTransform(my, [-300, 300], [-16, 16]);
  const x2 = useTransform(mx, [-300, 300], [26, -26]);
  const y2 = useTransform(my, [-300, 300], [18, -18]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX - window.innerWidth / 2);
      my.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mx, my]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        style={{ x: x1, y: y1 }}
        className="absolute left-[6%] top-[12%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 text-[10px] tracking-[0.22em] text-white/70"
      >
        NOVA • SUGAR • SODIUM
      </motion.div>
      <motion.div
        style={{ x: x2, y: y2 }}
        className="absolute right-[8%] top-[18%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 text-[10px] tracking-[0.22em] text-white/70"
      >
        AI INGREDIENT LENS
      </motion.div>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-[14%] bottom-[18%] w-28 h-28 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl"
        style={{ boxShadow: '0 0 70px rgba(0,229,255,0.22)' }}
      />
    </div>
  );
}

function ThreeDStack() {
  return (
    <div className="relative h-[420px] md:h-[520px]">
      <Card3D
        className="absolute left-0 top-10 w-[78%] md:w-[70%]"
        title="SCAN"
        body="POINT • CAPTURE • IDENTIFY"
        glow="rgba(0,229,255,0.35)"
        rotate={-8}
      />
      <Card3D
        className="absolute right-0 top-28 w-[82%] md:w-[72%]"
        title="ANALYSE"
        body="RISK • NOVA • INGREDIENTS"
        glow="rgba(255,183,3,0.32)"
        rotate={10}
      />
      <Card3D
        className="absolute left-[10%] bottom-0 w-[84%] md:w-[74%]"
        title="UPGRADE"
        body="SMARTER SWAPS • GUIDANCE"
        glow="rgba(255,45,146,0.28)"
        rotate={-4}
      />
    </div>
  );
}

function Card3D({
  className,
  title,
  body,
  glow,
  rotate,
}: {
  className: string;
  title: string;
  body: string;
  glow: string;
  rotate: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.7, ease: easeHero }}
      className={[
        className,
        'rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 overflow-hidden',
      ].join(' ')}
      style={{
        transform: `perspective(1200px) rotateY(${rotate}deg) rotateX(${rotate / -2}deg)`,
        boxShadow: `0 30px 120px rgba(0,0,0,0.35)`,
      }}
    >
      <div className="absolute -inset-24 opacity-70" style={{ background: `radial-gradient(520px 360px at 30% 30%, ${glow}, transparent 60%)` }} />
      <div className="relative">
        <p className="text-[11px] tracking-[0.28em] text-white/70">STEP</p>
        <h4 className="mt-4 text-3xl md:text-4xl font-normal">{title}</h4>
        <p className="mt-5 text-[11px] tracking-[0.22em] text-white/70 leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

function DepthCard({ kpi, label, glow }: { kpi: string; label: string; glow: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useTransform(y, [-70, 70], [10, -10]);
  const ry = useTransform(x, [-70, 70], [-10, 10]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.6, ease: easeHero }}
      onMouseMove={e => {
        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        x.set(e.clientX - (r.left + r.width / 2));
        y.set(e.clientY - (r.top + r.height / 2));
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: 'preserve-3d',
        boxShadow: '0 30px 90px rgba(0,0,0,0.25)',
      }}
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 relative overflow-hidden"
    >
      <div
        className="absolute -inset-24 opacity-55"
        style={{ background: `radial-gradient(420px 280px at 30% 30%, ${glow}, transparent 60%)` }}
      />
      <div className="relative" style={{ transform: 'translateZ(22px)' }}>
        <div className="text-5xl md:text-6xl font-normal" style={{ textShadow: `0 0 24px ${glow}` }}>
          {kpi}
        </div>
        <div className="mt-3 text-[11px] tracking-[0.28em] text-white/70">{label}</div>
      </div>
      <div
        className="absolute right-7 top-7 w-9 h-9 rounded-full"
        style={{
          background: glow,
          opacity: 0.18,
          transform: 'translateZ(14px)',
        }}
      />
    </motion.div>
  );
}

function SectionWash({ variant = 'cool' }: { variant?: 'cool' | 'warm' | 'cta' }) {
  const bg =
    variant === 'cta'
      ? 'radial-gradient(900px 600px at 30% 20%, rgba(34,197,94,0.18), transparent 60%), radial-gradient(900px 650px at 70% 70%, rgba(249,115,22,0.14), transparent 60%), radial-gradient(900px 650px at 40% 90%, rgba(167,243,208,0.10), transparent 60%)'
      : variant === 'warm'
        ? 'radial-gradient(900px 600px at 20% 20%, rgba(249,115,22,0.16), transparent 60%), radial-gradient(900px 650px at 80% 25%, rgba(34,197,94,0.14), transparent 60%), radial-gradient(900px 650px at 55% 85%, rgba(167,243,208,0.10), transparent 60%)'
        : 'radial-gradient(900px 600px at 20% 15%, rgba(34,197,94,0.16), transparent 60%), radial-gradient(900px 650px at 75% 30%, rgba(167,243,208,0.11), transparent 60%), radial-gradient(900px 650px at 60% 90%, rgba(249,115,22,0.10), transparent 60%)';

  return <div className="pointer-events-none absolute inset-0 -z-10 opacity-80" style={{ background: bg }} />;
}

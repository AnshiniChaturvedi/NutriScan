'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { Scan, Brain, Activity, Zap, Users, BarChart2, Dna, Sparkles, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';

const HeroScene = dynamic(() => import('@/components/HeroScene'), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger = { show: { transition: { staggerChildren: 0.12 } } };

function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(count, to, { duration: 1.8, ease: 'easeOut' });
    return ctrl.stop;
  }, [inView, count, to]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

function FeatureCard({ icon, title, desc, color = 'green' }: { icon: React.ReactNode; title: string; desc: string; color?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useTransform(y, [-40, 40], [6, -6]);
  const ry = useTransform(x, [-40, 40], [-6, 6]);

  const borderClass =
    color === 'blue' ? 'hover:border-blue-500/40' : color === 'purple' ? 'hover:border-purple-500/40' : 'hover:border-green-500/40';
  const bgClass =
    color === 'blue' ? 'bg-blue-500/10 text-blue-400' : color === 'purple' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400';

  return (
    <motion.div
      variants={fadeUp}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={`glass rounded-2xl p-6 flex flex-col gap-4 border border-white/5 ${borderClass} transition-colors duration-300 cursor-default`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>{icon}</div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StepCard({ num, title, desc, accent }: { num: string; title: string; desc: string; accent: string }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col items-center text-center gap-4">
      <div className={`w-16 h-16 rounded-2xl ${accent} flex items-center justify-center text-white text-2xl font-extrabold shadow-glow relative`}>
        {num}
        <div className="absolute inset-0 rounded-2xl animate-ping opacity-10 bg-white" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed max-w-xs">{desc}</p>
    </motion.div>
  );
}

function StatBadge({ to, suffix, label }: { to: number | null; suffix?: string; label: string }) {
  return (
    <div className="glass rounded-xl px-6 py-4 text-center border border-white/5">
      <p className="text-2xl font-extrabold gradient-text">{to !== null ? <AnimatedCounter to={to} suffix={suffix} /> : suffix}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function FloatingBadge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute glass rounded-xl px-3 py-2 text-xs font-medium text-slate-300 border border-white/10 pointer-events-none ${className}`}
    >
      {children}
    </motion.div>
  );
}

const MARQUEE_ITEMS = [
  'Diabetes Risk',
  'NOVA 4 Watch',
  'Heart Health',
  'Sugar Alert',
  'High Fibre',
  'Hypertension',
  'Obesity Risk',
  'Age-Group Safe',
  'Clean Label',
  'AI Analysis',
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="w-full overflow-hidden py-4 border-y border-white/5 bg-white/[0.015]">
      <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} className="flex gap-8 whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Sparkles size={12} className="text-green-500" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const featRef = useRef(null);
  const stepsRef = useRef(null);
  const featInView = useInView(featRef, { once: true, margin: '-80px' });
  const stepsInView = useInView(stepsRef, { once: true, margin: '-80px' });

  return (
    <main className="min-h-screen bg-bg-primary overflow-x-hidden">
      <Navbar />

      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="absolute inset-0 z-0">
          <HeroScene />
        </div>
        <div className="absolute inset-0 bg-radial-hero pointer-events-none z-[1]" />

        <div className="absolute inset-0 z-[2] pointer-events-none hidden lg:block">
          <FloatingBadge className="top-1/3 left-[8%]">DNA Analysis</FloatingBadge>
          <FloatingBadge className="top-1/4 right-[10%]">9M+ Products</FloatingBadge>
          <FloatingBadge className="bottom-1/3 left-[12%]">Disease Risk</FloatingBadge>
          <FloatingBadge className="bottom-1/4 right-[8%]">Gemini AI</FloatingBadge>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/40 text-green-400 text-sm font-semibold"
          >
            <Zap size={13} className="animate-pulse" />
            AI-Powered Food Intelligence
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-8xl font-extrabold leading-tight tracking-tight"
          >
            <span className="text-white">Scan your food.</span>
            <br />
            <span className="gradient-text">Know the truth.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl leading-relaxed"
          >
            Scan any product barcode for an instant health score, disease-risk breakdown, age-group impacts, and AI ingredient analysis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/scan"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-black font-bold text-base hover:shadow-glow hover:scale-105 transition-all duration-200"
            >
              <Scan size={18} />
              Start Scanning
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mt-4"
          >
            <StatBadge to={9} suffix="M+" label="Products in database" />
            <StatBadge to={6} suffix="" label="Disease risks tracked" />
            <StatBadge to={5} suffix="" label="Age groups analysed" />
            <StatBadge to={null} suffix="NOVA" label="Processing level" />
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-600"
        >
          <div className="w-5 h-9 rounded-full border border-slate-700 flex items-start justify-center pt-2">
            <div className="w-1 h-2.5 bg-slate-500 rounded-full" />
          </div>
        </motion.div>
      </section>

      <Marquee />

      <section id="features" className="py-28 px-4 relative">
        <div className="section-glow-green absolute inset-0 pointer-events-none" />
        <div className="max-w-6xl mx-auto" ref={featRef}>
          <motion.div variants={stagger} initial="hidden" animate={featInView ? 'show' : 'hidden'} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Dna size={12} /> What we analyse
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-white">
              Comprehensive food intelligence
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400 mt-4 max-w-xl mx-auto">
              Every scan gives you six layers of evidence-based analysis in under 3 seconds.
            </motion.p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={featInView ? 'show' : 'hidden'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard color="green" icon={<Activity size={22} />} title="Health Score 0–100" desc="WHO and UK FSA nutritional benchmarks for sugar, fat, salt, fibre, and NOVA level." />
            <FeatureCard color="blue" icon={<Brain size={22} />} title="Disease Risk Analysis" desc="ML-powered risk scores for diabetes, heart disease, obesity, and hypertension." />
            <FeatureCard color="purple" icon={<Sparkles size={22} />} title="Gemini AI Ingredients" desc="AI reads ingredient lists and explains red flags in plain language." />
            <FeatureCard color="green" icon={<Users size={22} />} title="Age Group Impacts" desc="See how foods impact infants, children, adults, and seniors differently." />
            <FeatureCard color="blue" icon={<BarChart2 size={22} />} title="NOVA Processing Level" desc="Instantly classify products by food processing intensity." />
            <FeatureCard color="purple" icon={<TrendingUp size={22} />} title="Smarter Alternatives" desc="Get healthier alternatives from database matches." />
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="py-28 px-4 relative overflow-hidden">
        <div className="section-glow-blue absolute inset-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto" ref={stepsRef}>
          <motion.div variants={stagger} initial="hidden" animate={stepsInView ? 'show' : 'hidden'} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Zap size={12} /> Simple as 1-2-3
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold text-white">
              How NutriScan works
            </motion.h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={stepsInView ? 'show' : 'hidden'} className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <StepCard num="1" accent="bg-gradient-to-br from-green-500 to-emerald-400" title="Scan a barcode" desc="Use your camera or type a barcode." />
            <StepCard num="2" accent="bg-gradient-to-br from-blue-500 to-cyan-400" title="AI analyses it" desc="Models process nutritional data, ingredients, and NOVA." />
            <StepCard num="3" accent="bg-gradient-to-br from-purple-500 to-pink-400" title="Get your report" desc="View score, risks, guidance, and alternatives." />
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 via-blue-500/10 to-purple-500/20 rounded-3xl blur-2xl" />
          <div className="relative glass rounded-3xl p-12 text-center border border-white/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold mb-6">
              <Sparkles size={11} /> Free and Instant
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Ready to eat smarter?</h2>
            <p className="text-slate-400 mb-8 text-lg">Scan your first product and get results in seconds.</p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-black font-bold text-lg hover:shadow-glow hover:scale-105 transition-all duration-200"
            >
              <Scan size={20} />
              Scan a Product Now
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-10 px-4 text-center text-slate-600 text-sm">
        <p>© {new Date().getFullYear()} NutriScan AI · Built with Next.js, FastAPI & Gemini</p>
        <p className="mt-1 text-xs text-slate-700">For informational purposes only — not a substitute for medical or dietary advice.</p>
      </footer>
    </main>
  );
}

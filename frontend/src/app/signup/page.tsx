import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Lock, Mail, User } from 'lucide-react';
import PageShell from '@/components/PageShell';
import AnimatedReveal from '@/components/AnimatedReveal';

export default function SignupPage() {
  return (
    <PageShell title="Create Account" subtitle="Join NutriScan and unlock personalized food intelligence from day one.">
      <section className="page-wrap section-block pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatedReveal className="liquid-glass-strong rounded-3xl p-8 md:p-10">
            <h2 className="text-4xl md:text-5xl font-normal tracking-tight">Create your account</h2>
            <p className="mt-4 text-sm text-white/70 max-w-md">
              Build healthier habits with nutrition scoring, ingredient intelligence, and smarter alternatives.
            </p>
            <div className="mt-7 rounded-2xl overflow-hidden border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80"
                alt="Healthy grocery ingredients"
                className="w-full h-56 object-cover"
              />
            </div>
            <div className="mt-6 space-y-3 text-sm text-white/80">
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-300" />
                Personalized nutrition insights
              </div>
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-300" />
                Smarter alternatives for every product
              </div>
            </div>
          </AnimatedReveal>

          <AnimatedReveal delay={0.1} className="glass rounded-3xl p-8 md:p-10 border border-white/10">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="NutriScan logo" width={30} height={30} />
              <h3 className="text-2xl font-medium">Sign up</h3>
            </div>
            <form className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs tracking-[0.18em] text-white/65">FULL NAME</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
                  <User size={16} className="text-white/60" />
                  <input type="text" placeholder="Your name" className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none" />
                </div>
              </label>
              <label className="block">
                <span className="text-xs tracking-[0.18em] text-white/65">EMAIL</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
                  <Mail size={16} className="text-white/60" />
                  <input type="email" placeholder="you@example.com" className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none" />
                </div>
              </label>
              <label className="block">
                <span className="text-xs tracking-[0.18em] text-white/65">PASSWORD</span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
                  <Lock size={16} className="text-white/60" />
                  <input type="password" placeholder="Create a password" className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none" />
                </div>
              </label>
              <button type="submit" className="btn-primary w-full">
                CREATE ACCOUNT
              </button>
            </form>
            <p className="mt-5 text-sm text-white/70">
              Already have an account?{' '}
              <Link href="/login" className="text-green-300 hover:text-green-200 transition-colors">
                Login
              </Link>
            </p>
          </AnimatedReveal>
        </div>
      </section>
    </PageShell>
  );
}

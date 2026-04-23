'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, User } from 'lucide-react';

type AuthMode = 'login' | 'signup';

type AuthValues = {
  name?: string;
  email: string;
  password: string;
};

type AuthPanelProps = {
  mode: AuthMode;
  onSubmit: (values: AuthValues) => Promise<void>;
  title: string;
  subtitle: string;
  primaryLabel: string;
  switchLabel: string;
  switchHref: string;
};

const panelVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function AuthPanel({
  mode,
  onSubmit,
  title,
  subtitle,
  primaryLabel,
  switchLabel,
  switchHref,
}: AuthPanelProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: mode === 'signup' ? name.trim() : undefined,
        email: email.trim(),
        password,
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Authentication failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="show"
      className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.16),_transparent_28%)]" />
      <div className="relative z-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-400/80">NutriScan AI</p>
          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Full name</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus-within:border-green-400/40">
                <User size={16} className="text-slate-500" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  placeholder="Shikhar Verma"
                  autoComplete="name"
                  required
                />
              </div>
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus-within:border-green-400/40">
              <Mail size={16} className="text-slate-500" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Password</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus-within:border-green-400/40">
              <Lock size={16} className="text-slate-500" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                placeholder="At least 8 characters"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>
          </label>

          {mode === 'signup' && (
            <label className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Confirm password</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus-within:border-green-400/40">
                <Lock size={16} className="text-slate-500" />
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  placeholder="Repeat password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </label>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 px-5 py-3.5 text-sm font-bold text-black transition-transform duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Please wait...' : primaryLabel}
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
          <span>{mode === 'login' ? 'New here?' : 'Already have an account?'}</span>
          <Link href={switchHref} className="font-semibold text-white transition-colors hover:text-green-300">
            {switchLabel}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
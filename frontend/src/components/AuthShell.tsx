'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, Sparkles, ScanSearch, Database } from 'lucide-react';

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-primary px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_22%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center gap-10 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              <ShieldCheck size={14} className="text-green-400" />
              Secure accounts + saved history
            </Link>
            <h2 className="mt-6 text-5xl font-black leading-tight text-white">
              Keep every scan tied to a real account.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
              Sign in to store searches, revisit previous nutrition checks, and keep your food analysis history available across devices.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: <ScanSearch size={18} />,
                  title: 'Search history',
                  text: 'Every signed-in scan is stored in SQLite for later review.',
                },
                {
                  icon: <Database size={18} />,
                  title: 'Persistent storage',
                  text: 'Users and searches are saved on the backend, not only in the browser.',
                },
                {
                  icon: <ShieldCheck size={18} />,
                  title: 'Token-based auth',
                  text: 'Secure cookies keep the session available without exposing tokens to the UI.',
                },
                {
                  icon: <Sparkles size={18} />,
                  title: 'Fast access',
                  text: 'Jump back into scans, recommendations, and dashboard views instantly.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="w-full max-w-xl">{children}</div>
      </div>
    </main>
  );
}
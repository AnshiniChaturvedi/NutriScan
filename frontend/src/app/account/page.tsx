'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarClock, LogOut, Search, User } from 'lucide-react';

import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { getSearchHistory } from '@/lib/auth';
import type { SearchHistoryItem } from '@/lib/types';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=/account');
      return;
    }

    if (!user) {
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      const items = await getSearchHistory(30);
      if (!cancelled) {
        setHistory(items);
        setHistoryLoading(false);
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-bg-primary">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-28 text-center text-slate-400">Loading your account...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary">
      <Navbar />

      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-400/80">Account</p>
            <h1 className="mt-2 text-4xl font-extrabold text-white">Your saved activity</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Manage your NutriScan session and review the searches that have been stored in the backend database.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/');
              router.refresh();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-white/20 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="glass rounded-3xl border border-white/5 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">
                  <User size={28} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Signed in as</p>
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Searches saved</p>
                  <p className="mt-2 text-3xl font-extrabold text-white">{user.search_count}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Joined</p>
                  <p className="mt-2 text-sm font-semibold text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/scan" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 px-4 py-2 text-sm font-bold text-black">
                  <Search size={16} />
                  Start a scan
                </Link>
                <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300">
                  Home
                </Link>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl border border-white/5 p-6">
            <div className="mb-5 flex items-center gap-3">
              <CalendarClock size={18} className="text-green-400" />
              <h2 className="text-xl font-bold text-white">Recent searches</h2>
            </div>

            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
                No saved searches yet. Sign in and run a scan or product search to populate this list.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.query}</p>
                        <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">{item.query_type.replace(/_/g, ' ')}</p>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                      {item.product_name && <span className="rounded-full border border-white/10 px-2.5 py-1">{item.product_name}</span>}
                      {item.barcode && <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono">{item.barcode}</span>}
                      {(() => {
                        const summary = item.result_summary as Record<string, unknown> | undefined;
                        const healthScore = summary && typeof summary['health_score'] === 'number' ? summary['health_score'] : null;
                        return healthScore !== null ? (
                          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-green-300">Score {healthScore}</span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
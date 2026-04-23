'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Loader2, Send, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotPage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I am your NutriScan assistant. Ask me about nutrition, ingredients, or healthier swaps.',
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, productContext: null }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer ?? 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <main className="min-h-screen bg-bg-primary text-white px-4 md:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="liquid-glass rounded-full px-4 py-2 inline-flex items-center gap-2 text-white/90"
          >
            <ArrowLeft size={16} />
            <span className="text-[12px] tracking-[0.12em]">BACK</span>
          </button>
          <div className="inline-flex items-center gap-2 text-white/75 text-[12px] tracking-[0.14em]">
            <Bot size={14} />
            CHAT ASSISTANT
          </div>
        </div>

        <section className="glass rounded-3xl border border-white/10 overflow-hidden min-h-[76vh] flex flex-col">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-black/20">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
              <Bot size={18} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">NutriScan Assistant</p>
              <p className="text-white/60 text-xs">Ask anything about food and health</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === 'assistant' ? 'bg-green-500/20' : 'bg-blue-500/20'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot size={13} className="text-green-400" />
                  ) : (
                    <User size={13} className="text-blue-400" />
                  )}
                </div>
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-sm max-w-[85%] leading-relaxed ${
                    msg.role === 'assistant' ? 'bg-white/10 text-white/85' : 'bg-green-500/15 text-green-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Bot size={13} className="text-green-400" />
                </div>
                <div className="px-3.5 py-2.5 rounded-xl bg-white/10 flex items-center gap-2">
                  <Loader2 size={13} className="text-white/70 animate-spin" />
                  <span className="text-white/70 text-xs">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-end gap-2 bg-black/25 rounded-xl px-3 py-2.5 border border-white/10">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/45 resize-none outline-none max-h-24"
              />
              <button
                type="button"
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-lg bg-green-500 text-black flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:bg-green-400 transition-colors"
              >
                <Send size={15} strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-xs text-white/45 text-center mt-2">Powered by Gemini AI</p>
          </div>
        </section>
      </div>
    </main>
  );
}

'use client';

import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';

interface IngredientAnalysisProps {
  markdown: string | null;
}

export default function IngredientAnalysis({ markdown }: IngredientAnalysisProps) {
  if (!markdown) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 flex flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        <FlaskConical size={16} className="text-slate-500" />
        <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest">
          AI Ingredient Analysis
        </h2>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium border border-purple-500/20">
          Powered by Gemini
        </span>
      </div>

      <div className="markdown-content text-slate-300 text-sm">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </motion.div>
  );
}

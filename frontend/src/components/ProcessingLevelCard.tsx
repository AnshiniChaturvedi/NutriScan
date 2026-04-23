'use client';

import { motion } from 'framer-motion';
import { novaColor } from '@/lib/api';
import { ProcessingLevel } from '@/lib/types';
import { Layers } from 'lucide-react';

interface ProcessingLevelCardProps {
  data: ProcessingLevel;
}

const NOVA_ICONS = ['🌿', '🥫', '🏭', '⚠️'];

export default function ProcessingLevelCard({ data }: ProcessingLevelCardProps) {
  const novaNum = parseInt(data.nova_group ?? '0', 10) || 0;
  const color   = novaColor(String(novaNum));
  const icon    = NOVA_ICONS[(novaNum - 1) % 4] ?? '❓';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass rounded-2xl p-6 flex flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-slate-500" />
        <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest">
          Processing Level
        </h2>
      </div>

      {/* NOVA badge row */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: `${color}18`, border: `1.5px solid ${color}40` }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}20`, color }}
            >
              NOVA {novaNum || '?'}
            </span>
          </div>
          <p className="text-white font-semibold text-base leading-tight">{data.label}</p>
        </div>
      </div>

      {/* 4-step NOVA ladder */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            className="flex-1 h-2 rounded-full transition-all duration-500"
            style={{
              backgroundColor: n <= novaNum ? novaColor(String(n)) : 'rgba(255,255,255,0.05)',
              opacity: n <= novaNum ? 1 : 0.4,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>Unprocessed</span>
        <span>Ultra-processed</span>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed">{data.description}</p>

      {data.health_note && (
        <div
          className="text-xs rounded-xl px-4 py-3 leading-relaxed"
          style={{ backgroundColor: `${color}10`, color: `${color}cc`, border: `1px solid ${color}25` }}
        >
          {data.health_note}
        </div>
      )}

      {data.source && (
        <p className="text-xs text-slate-700">Source: {data.source}</p>
      )}
    </motion.div>
  );
}

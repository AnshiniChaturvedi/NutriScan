'use client';

import { motion } from 'framer-motion';
import { healthScoreColor, healthScoreLabel } from '@/lib/api';

interface HealthScoreGaugeProps {
  score: number;
}

export default function HealthScoreGauge({ score }: HealthScoreGaugeProps) {
  const r            = 80;
  const cx           = 100;
  const cy           = 100;
  const circumference = 2 * Math.PI * r;         // ~502.65
  const arcLength    = circumference * (270 / 360); // ~376.99 (270° arc)
  const gap          = circumference - arcLength;   // ~125.66

  const clampedScore = Math.max(0, Math.min(100, score));
  const color        = healthScoreColor(clampedScore);
  const label        = healthScoreLabel(clampedScore);

  // dashoffset = arcLength means "show 0"; dashoffset = 0 means "show all 270°"
  const targetOffset = arcLength * (1 - clampedScore / 100);

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center gap-4">
      <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest">Health Score</h2>

      <div className="relative w-52 h-52">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full -rotate-0"
          aria-label={`Health score: ${clampedScore}`}
        >
          {/* Background track — grey arc (270°) */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gap}`}
            transform={`rotate(135 ${cx} ${cy})`}
          />

          {/* Score arc — animated */}
          <motion.circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gap}`}
            transform={`rotate(135 ${cx} ${cy})`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
          />

          {/* Glow dot at arc end */}
          <motion.circle
            cx={cx + r}
            cy={cy}
            r={6}
            fill={color}
            opacity={0.85}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: 1.2 }}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
            }}
          />
        </svg>

        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-extrabold text-white tabular-nums"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {clampedScore}
          </motion.span>
          <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Label badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-4 py-1.5 rounded-full text-sm font-semibold"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {label}
      </motion.div>

      <p className="text-slate-500 text-xs text-center max-w-[200px]">
        Based on WHO & UK FSA nutritional thresholds
      </p>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { riskColor, riskLabel } from '@/lib/api';
import { DiseaseRisk } from '@/lib/types';

interface DiseaseRiskPanelProps {
  risks: Record<string, DiseaseRisk>;
}

const DISEASE_LABELS: Record<string, { label: string; icon: string }> = {
  diabetes:      { label: 'Type 2 Diabetes',   icon: '🩸' },
  heart_disease: { label: 'Heart Disease',      icon: '❤️' },
  obesity:       { label: 'Obesity',            icon: '⚖️' },
  hypertension:  { label: 'Hypertension',       icon: '💊' },
  liver_disease: { label: 'Liver Disease',      icon: '🫀' },
  cancer:        { label: 'Cancer Risk',        icon: '🔬' },
};

interface RiskBarProps {
  name: string;
  data: DiseaseRisk;
}

function RiskBar({ name, data }: RiskBarProps) {
  const meta  = DISEASE_LABELS[name] ?? { label: name.replace(/_/g, ' '), icon: '⚠️' };
  const pct   = Math.round(data.risk * 100);
  const color = riskColor(data.risk);
  const label = riskLabel(data.risk);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="text-base">{meta.icon}</span>
          {meta.label}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {label}
          </span>
          <span className="font-bold tabular-nums text-white w-9 text-right">{pct}%</span>
        </div>
      </div>

      {/* Bar track */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full relative"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
      </div>

      {/* Confidence line */}
      <p className="text-xs text-slate-600">
        Confidence: {Math.round(data.confidence * 100)}%
      </p>
    </motion.div>
  );
}

export default function DiseaseRiskPanel({ risks }: DiseaseRiskPanelProps) {
  const entries = Object.entries(risks);

  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-5">
      <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest">
        Disease Risk Indicators
      </h2>

      <motion.div
        className="flex flex-col gap-5"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        initial="hidden"
        animate="show"
      >
        {entries.length === 0 ? (
          <p className="text-slate-500 text-sm">No risk data available.</p>
        ) : (
          entries.map(([name, data]) => (
            <RiskBar key={name} name={name} data={data} />
          ))
        )}
      </motion.div>

      <p className="text-xs text-slate-700 border-t border-white/5 pt-3">
        Estimates based on nutritional composition. Not a medical diagnosis.
      </p>
    </div>
  );
}

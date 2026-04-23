'use client';

import { motion } from 'framer-motion';
import { nutrientColor } from '@/lib/api';

interface NutritionPanelProps {
  nutriments: Record<string, number>;
}

interface NutrientDef {
  key:   string;
  label: string;
  unit:  string;
  max:   number;   // used for progress bar (100% = max)
  thresh: { low: number; high: number };
  description: string;
}

const NUTRIENTS: NutrientDef[] = [
  {
    key: 'energy_kcal',
    label: 'Calories',
    unit: 'kcal',
    max: 500,
    thresh: { low: 100, high: 450 },
    description: 'per 100 g',
  },
  {
    key: 'sugar_100g',
    label: 'Sugars',
    unit: 'g',
    max: 30,
    thresh: { low: 5, high: 22.5 },
    description: 'FSA: low <5 g, high >22.5 g',
  },
  {
    key: 'fat_100g',
    label: 'Total Fat',
    unit: 'g',
    max: 25,
    thresh: { low: 3, high: 17.5 },
    description: 'FSA: low <3 g, high >17.5 g',
  },
  {
    key: 'saturated_fat_100g',
    label: 'Sat. Fat',
    unit: 'g',
    max: 12,
    thresh: { low: 1.5, high: 5 },
    description: 'FSA: low <1.5 g, high >5 g',
  },
  {
    key: 'salt_100g',
    label: 'Salt',
    unit: 'g',
    max: 2,
    thresh: { low: 0.3, high: 1.5 },
    description: 'FSA: low <0.3 g, high >1.5 g',
  },
  {
    key: 'fiber_100g',
    label: 'Fibre',
    unit: 'g',
    max: 10,
    thresh: { low: 3, high: 6 },
    description: 'Goal: ≥6 g (protective)',
  },
];

function NutrientCard({ def, value }: { def: NutrientDef; value: number | undefined }) {
  const v     = value ?? 0;
  const color = nutrientColor(def.key, v);
  const pct   = Math.min(100, (v / def.max) * 100);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className="glass rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-300 text-sm font-medium">{def.label}</p>
          <p className="text-xs text-slate-600 mt-0.5">{def.description}</p>
        </div>
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color }}
        >
          {v.toFixed(1)}
          <span className="text-xs font-normal text-slate-500 ml-0.5">{def.unit}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </motion.div>
  );
}

export default function NutritionPanel({ nutriments }: NutritionPanelProps) {
  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-5">
      <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest">
        Nutritional Values <span className="text-slate-600 text-xs normal-case tracking-normal ml-1">per 100 g</span>
      </h2>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden"
        animate="show"
      >
        {NUTRIENTS.map(def => (
          <NutrientCard key={def.key} def={def} value={nutriments[def.key]} />
        ))}
      </motion.div>

      {/* Additives count */}
      {nutriments['additives_count'] !== undefined && (
        <div className="flex items-center gap-3 pt-1 border-t border-white/5">
          <span className="text-slate-500 text-sm">Additives detected</span>
          <span
            className="ml-auto text-sm font-bold tabular-nums"
            style={{ color: nutriments['additives_count'] > 4 ? '#ef4444' : nutriments['additives_count'] > 1 ? '#f97316' : '#22c55e' }}
          >
            {nutriments['additives_count']}
          </span>
        </div>
      )}
    </div>
  );
}

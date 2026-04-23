'use client';

import { motion } from 'framer-motion';
import { ageLevelColor } from '@/lib/api';
import { AgeGroupImpact } from '@/lib/types';
import { Users } from 'lucide-react';

interface AgeGroupImpactGridProps {
  impacts: Record<string, AgeGroupImpact>;
}

const AGE_ICONS: Record<string, string> = {
  infant:      '👶',
  child:       '🧒',
  young_adult: '🧑',
  adult:       '🧔',
  elderly:     '👴',
};

const RISK_LABEL: Record<string, string> = {
  low:       'Low Risk',
  moderate:  'Moderate',
  high:      'High Risk',
  very_high: 'Very High',
};

export default function AgeGroupImpactGrid({ impacts }: AgeGroupImpactGridProps) {
  const entries = Object.entries(impacts);

  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-slate-500" />
        <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest">
          Age Group Impacts
        </h2>
      </div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
      >
        {entries.map(([key, impact]) => {
          const color = ageLevelColor(impact.risk_level);
          const icon  = AGE_ICONS[key] ?? '🧑';

          return (
            <motion.div
              key={key}
              variants={{ hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1 } }}
              className="rounded-xl p-4 flex flex-col gap-3 border"
              style={{
                backgroundColor: `${color}08`,
                borderColor: `${color}25`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {RISK_LABEL[impact.risk_level] ?? impact.risk_level}
                </span>
              </div>
              <p className="text-white text-sm font-medium capitalize">
                {impact.label ?? key.replace(/_/g, ' ')}
              </p>
              <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                {impact.notes}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

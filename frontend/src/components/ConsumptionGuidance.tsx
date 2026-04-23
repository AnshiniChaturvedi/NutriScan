'use client';

import { motion } from 'framer-motion';
import { ConsumptionDisclaimer } from '@/lib/types';
import { Clock, AlertTriangle, Info, BookOpen } from 'lucide-react';

interface ConsumptionGuidanceProps {
  data: ConsumptionDisclaimer;
}

export default function ConsumptionGuidance({ data }: ConsumptionGuidanceProps) {
  const hasWarnings = data.specific_warnings && data.specific_warnings.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass rounded-2xl p-6 flex flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-slate-500" />
        <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest">
          Consumption Guidance
        </h2>
      </div>

      {/* Recommended Frequency */}
      <div className="flex items-start gap-3 rounded-xl p-4 bg-green-500/5 border border-green-500/15">
        <Clock size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1">
            Recommended Frequency
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">{data.recommended_frequency}</p>
        </div>
      </div>

      {/* General Guidance */}
      <div className="flex items-start gap-3 rounded-xl p-4 bg-blue-500/5 border border-blue-500/15">
        <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">
            General Guidance
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">{data.general_guidance}</p>
        </div>
      </div>

      {/* Specific Warnings */}
      {hasWarnings && (
        <div className="flex items-start gap-3 rounded-xl p-4 bg-orange-500/5 border border-orange-500/15">
          <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">
              Specific Warnings
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">{data.specific_warnings}</p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {data.disclaimer && (
        <p className="text-xs text-slate-700 border-t border-white/5 pt-4 leading-relaxed">
          ℹ️ {data.disclaimer}
        </p>
      )}
    </motion.div>
  );
}

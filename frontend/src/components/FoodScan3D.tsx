'use client';

import { motion } from 'framer-motion';

export default function FoodScan3D() {
  return (
    <div className="h-[420px] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(34,197,94,0.14),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.12),transparent_50%)]" />

      <div className="absolute inset-0 px-8 py-7 flex flex-col justify-between pointer-events-none">
        <div className="flex items-center justify-between text-[10px] tracking-[0.2em] text-white/65">
          <span>NUTRISCAN LIVE</span>
          <span>SCAN MODE: ACTIVE</span>
        </div>
        <div className="flex items-center justify-between text-[10px] tracking-[0.18em] text-white/60">
          <span>PRODUCT: WHOLE GRAIN BAR</span>
          <span>CONFIDENCE: 97%</span>
        </div>
      </div>

      <div className="absolute inset-0 grid place-items-center" style={{ perspective: '1100px' }}>
        <motion.div
          initial={{ rotateY: -18, rotateX: 8 }}
          animate={{ rotateY: [-18, -8, -18], rotateX: [8, 4, 8] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* protein bar pack */}
          <div className="relative w-[290px] h-[130px]" style={{ transformStyle: 'preserve-3d' }}>
            <div
              className="absolute inset-0 rounded-xl border border-white/15 bg-gradient-to-r from-[#0f172a] via-[#1f2937] to-[#0b1220] shadow-[0_28px_60px_rgba(0,0,0,0.45)] overflow-hidden"
              style={{ transform: 'translateZ(22px)' }}
            >
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-b from-emerald-400/35 to-cyan-300/20" />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.2em] text-white/80 [writing-mode:vertical-rl]">
                PROTEIN
              </div>
              <div className="absolute left-20 top-4 text-[10px] tracking-[0.2em] text-white/70">CHOCOLATE OATS BAR</div>
              <div className="absolute left-20 right-5 top-9 h-[2px] bg-white/15" />
              <div className="absolute left-20 right-5 bottom-4 h-6 flex items-end gap-[2px]">
                {Array.from({ length: 28 }).map((_, i) => (
                  <span key={i} className="bg-white/70" style={{ width: 2, height: i % 3 === 0 ? 24 : 16 }} />
                ))}
              </div>
            </div>

            {/* right side */}
            <div
              className="absolute top-0 bottom-0 right-0 w-6 rounded-r-xl border border-white/10 bg-gradient-to-b from-[#0f172a] to-[#0b1220]"
              style={{ transform: 'rotateY(90deg) translateZ(284px)', transformOrigin: 'right center' }}
            />

            {/* top side */}
            <div
              className="absolute left-0 right-0 top-0 h-6 rounded-t-xl border border-white/10 bg-[#1e293b]"
              style={{ transform: 'rotateX(90deg) translateZ(22px)', transformOrigin: 'top center' }}
            />
          </div>

          {/* scanning beam */}
          <motion.div
            animate={{ y: [-65, 65, -65], opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[3px] rounded-full bg-cyan-300 shadow-[0_0_26px_rgba(34,211,238,0.9)]"
          />

          {/* scan frame */}
          <motion.div
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[180px] rounded-2xl border border-cyan-300/60"
          />

          {/* corner brackets for cleaner scan framing */}
          <div className="absolute left-1/2 top-1/2 -translate-x-[170px] -translate-y-[90px] w-7 h-7 border-l-2 border-t-2 border-cyan-300/80" />
          <div className="absolute left-1/2 top-1/2 translate-x-[143px] -translate-y-[90px] w-7 h-7 border-r-2 border-t-2 border-cyan-300/80" />
          <div className="absolute left-1/2 top-1/2 -translate-x-[170px] translate-y-[63px] w-7 h-7 border-l-2 border-b-2 border-cyan-300/80" />
          <div className="absolute left-1/2 top-1/2 translate-x-[143px] translate-y-[63px] w-7 h-7 border-r-2 border-b-2 border-cyan-300/80" />
        </motion.div>
      </div>

      {/* bowl + ingredient readout beside bowl */}
      <div className="absolute right-6 bottom-6 flex items-end gap-4">
        <div className="relative w-[92px] h-[52px] rounded-b-[42px] rounded-t-[22px] border border-white/20 bg-gradient-to-b from-white/20 to-white/5">
          <div className="absolute inset-x-2 top-2 h-4 rounded-full bg-emerald-300/25" />
        </div>
        <div className="space-y-2">
          {['Whole oats', 'Pea protein', 'Cocoa', 'Sea salt'].map(item => (
            <span key={item} className="block px-3 py-1 rounded-full text-[10px] tracking-[0.12em] text-white/80 border border-white/15 bg-white/5">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

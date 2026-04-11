'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

type Program = {
  title: string;
  specs: string[];
  videoSrc: string;
};

const easeFleet: [number, number, number, number] = [0.19, 1, 0.22, 1];

export function ProgramsOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const programs: Program[] = useMemo(
    () => [
      {
        title: 'GLYCEMIC GUARD',
        specs: [
          'TARGET: STABLE BLOOD SUGAR',
          'FOCUS: LOW-GI SWAPS + FIBRE',
          'DURATION: 28 DAYS',
          'FOR: CRAVINGS + ENERGY CRASHES',
        ],
        videoSrc:
          'https://pikaso.cdnpk.net/private/production/3822101633/802e6e4b-2153-4936-95ba-399380192202-0.mp4?token=exp=1775520000~hmac=4f96eccd6cbb48c06e27b5136096f4ab7708b3780ce5e55a845a605c79afc4ff',
      },
      {
        title: 'HEART LENS',
        specs: [
          'TARGET: CARDIOMETABOLIC HEALTH',
          'FOCUS: SALT/FAT FLAGS + PORTIONS',
          'DURATION: 24 DAYS',
          'FOR: BP + LDL SUPPORT',
        ],
        videoSrc:
          'https://pikaso.cdnpk.net/private/production/3822101633/802e6e4b-2153-4936-95ba-399380192202-0.mp4?token=exp=1775520000~hmac=4f96eccd6cbb48c06e27b5136096f4ab7708b3780ce5e55a845a605c79afc4ff',
      },
      {
        title: 'CLEAN LABEL',
        specs: [
          'TARGET: FEWER ULTRA-PROCESSED PICKS',
          'FOCUS: NOVA + ADDITIVE FLAGS',
          'DURATION: 32 DAYS',
          'FOR: GUT + INFLAMMATION SUPPORT',
        ],
        videoSrc:
          'https://pikaso.cdnpk.net/private/production/3822101633/802e6e4b-2153-4936-95ba-399380192202-0.mp4?token=exp=1775520000~hmac=4f96eccd6cbb48c06e27b5136096f4ab7708b3780ce5e55a845a605c79afc4ff',
      },
    ],
    []
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-[110] bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            onClick={onClose}
          />

          <motion.div className="fixed inset-0 z-[110] p-0">
            <div className="h-full w-full flex flex-col lg:flex-row border border-white/20">
              {programs.map((p, idx) => (
                <motion.div
                  key={p.title}
                  initial={{ x: '100vw' }}
                  animate={{
                    x: 0,
                    transition: { duration: 1.56, ease: easeFleet, delay: idx * 0.08 },
                  }}
                  exit={{
                    x: '100vw',
                    transition: { duration: 1.1, ease: easeFleet, delay: (programs.length - 1 - idx) * 0.05 },
                  }}
                  className="relative flex-1 border-t lg:border-t-0 lg:border-l border-white/20"
                  style={{ height: '85vh' }}
                >
                  <ProgramPanel program={p} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          <button
            type="button"
            onClick={onClose}
            className="fixed top-8 right-8 z-[120] mix-blend-difference uppercase tracking-widest text-[12px] text-white"
          >
            Close
          </button>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ProgramPanel({ program }: { program: Program }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={program.videoSrc}
        muted
        loop
        playsInline
        onMouseEnter={e => e.currentTarget.play()}
        onMouseLeave={e => {
          e.currentTarget.pause();
          e.currentTarget.currentTime = 0;
        }}
      />

      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <div className="overflow-hidden">
          <motion.h3
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            className="uppercase text-3xl md:text-4xl tracking-tight text-white"
          >
            {program.title}
          </motion.h3>
        </div>

        <div className="mt-4 space-y-2">
          {program.specs.map(line => (
            <div key={line} className="overflow-hidden">
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
                className="uppercase text-[11px] md:text-[12px] tracking-[0.22em] text-white/80"
              >
                {line}
              </motion.p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


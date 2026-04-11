'use client';

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import './StaggeredMenu.css';

type MenuItem = {
  label: string;
  action: () => void;
};

export function StaggeredMenu({
  isOpen,
  onToggle,
  onClose,
  onGoHome,
  onGoScan,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onGoHome: () => void;
  onGoScan: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const menuTextWrapRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);

  const tl = useRef<gsap.core.Timeline | null>(null);

  const items: MenuItem[] = useMemo(
    () => [
      { label: 'Home', action: () => (onClose(), onGoHome()) },
      { label: 'Scan', action: () => (onClose(), onGoScan()) },
    ],
    [onClose, onGoHome, onGoScan]
  );

  useEffect(() => {
    const root = rootRef.current;
    const layers = layersRef.current;
    const panel = panelRef.current;
    const itemsEl = itemsRef.current;
    const menuTextWrap = menuTextWrapRef.current;
    const plus = plusRef.current;
    if (!root || !layers || !panel || !itemsEl || !menuTextWrap || !plus) return;

    gsap.set([layers, panel], { xPercent: 100 });
    gsap.set(panel, { boxShadow: '0 30px 80px rgba(0,0,0,0.45)' });
    gsap.set(itemsEl.querySelectorAll('[data-menu-item]'), { yPercent: 140, rotate: 10, opacity: 1 });

    tl.current?.kill();
    tl.current = gsap
      .timeline({ paused: true })
      .to(menuTextWrap, { yPercent: -50, duration: 0.6, ease: 'power3.inOut' }, 0)
      .to(plus, { rotate: 225, duration: 0.6, ease: 'power3.inOut' }, 0)
      .to(
        layers.querySelectorAll('[data-layer]'),
        { xPercent: 0, duration: 0.9, ease: 'power3.inOut', stagger: 0.06 },
        0
      )
      .to(panel, { xPercent: 0, duration: 0.9, ease: 'power3.inOut' }, 0.12)
      .to(
        itemsEl.querySelectorAll('[data-menu-item]'),
        { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: 0.06 },
        0.35
      );

    return () => {
      tl.current?.kill();
      tl.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tl.current) return;
    if (isOpen) tl.current.play();
    else tl.current.reverse();
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div ref={rootRef} className="fixed inset-0 z-40 pointer-events-none">
      {/* Click outside to close */}
      <button
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ background: 'transparent' }}
      />

      {/* Toggle button */}
      <div className="absolute top-6 right-6 pointer-events-auto">
        <button
          type="button"
          onClick={onToggle}
          className={[
            'staggered-menu__toggle',
            isOpen ? 'staggered-menu__toggle--shifted' : '',
            'relative flex items-center gap-3 rounded-2xl px-5 py-4 backdrop-blur-[120px] bg-white/5 border border-white/10',
            'uppercase tracking-[0.3em] text-[11px] text-white select-none',
          ].join(' ')}
        >
          <div className="h-[14px] overflow-hidden">
            <div ref={menuTextWrapRef} className="flex flex-col">
              <span className="h-[14px] leading-[14px]">Menu</span>
              <span className="h-[14px] leading-[14px]">Close</span>
            </div>
          </div>
          <div
            ref={plusRef}
            className="w-5 h-5 grid place-items-center text-white/90"
            style={{ transformOrigin: '50% 50%' }}
          >
            <span className="block w-3.5 h-[1px] bg-white/90" />
            <span className="block w-[1px] h-3.5 bg-white/90 -mt-[7px]" />
          </div>
        </button>
      </div>

      {/* Slide layers + main panel */}
      <div className="absolute top-0 right-0 h-full flex pointer-events-none">
        <div ref={layersRef} className="absolute top-0 right-0 h-full w-full">
          <div data-layer className="absolute top-0 right-0 h-full w-[140%] opacity-30" style={{ background: 'var(--accent)' }} />
          <div data-layer className="absolute top-0 right-0 h-full w-[140%] opacity-30" style={{ background: 'var(--accent-2)' }} />
          <div data-layer className="absolute top-0 right-0 h-full w-[140%] opacity-30" style={{ background: 'var(--accent-3)' }} />
        </div>

        <aside
          ref={panelRef}
          className="staggered-menu__panel relative h-full bg-white text-black pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="h-full flex flex-col px-8 pt-28 pb-10">
            <div ref={itemsRef} className="staggered-menu__items flex flex-col gap-6">
              {items.map(item => (
                <button
                  key={item.label}
                  data-menu-item
                  type="button"
                  onClick={item.action}
                  className="staggered-menu__item text-left uppercase text-[3.5rem] leading-[1] tracking-tight font-normal"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-auto pt-10 border-t border-black/10">
              <p className="uppercase tracking-[0.28em] text-[11px]" style={{ color: 'var(--accent)' }}>
                Socials
              </p>
              <div className="mt-4 flex gap-6 uppercase tracking-[0.22em] text-[12px]">
                <a className="staggered-menu__social-link" href="#" onClick={e => e.preventDefault()}>
                  Instagram
                </a>
                <a className="staggered-menu__social-link" href="#" onClick={e => e.preventDefault()}>
                  Facebook
                </a>
                <a className="staggered-menu__social-link" href="#" onClick={e => e.preventDefault()}>
                  Twitter
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


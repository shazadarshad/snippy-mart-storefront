import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Desktop-only smooth scroll. Disabled on touch / reduced-motion so phones
 * stay native-snappy and never feel sticky mid-scroll.
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Touch / coarse pointer → native scroll (biggest anti-jank win on mobile)
    const isCoarse =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0);

    if (prefersReduced || isCoarse) {
      return;
    }

    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const syncLock = () => {
      const locked =
        document.body.style.overflow === 'hidden' ||
        document.body.hasAttribute('data-scroll-locked');
      if (locked) lenis.stop();
      else lenis.start();
    };

    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    });
    syncLock();

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      observer.disconnect();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  }, []);
};

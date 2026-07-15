import { useEffect } from 'react';

/**
 * Smooth scroll disabled site-wide.
 *
 * Lenis applied transforms on the document that could leave pages blank/black
 * after client-side route changes (nav links worked only after full reload).
 * Native browser scroll is reliable on mobile + desktop.
 */
export const useSmoothScroll = () => {
  useEffect(() => {
    // Ensure any previous Lenis instance is gone after hot reload / old builds
    const w = window as unknown as { lenis?: { destroy?: () => void } };
    try {
      w.lenis?.destroy?.();
    } catch {
      /* ignore */
    }
    delete w.lenis;

    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);
};

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Unlock scroll + jump to top on every client-side route change. */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Mobile nav / dialogs sometimes leave overflow:hidden stuck after SPA nav
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
    document.body.removeAttribute('data-scroll-locked');

    const lenis = (
      window as unknown as {
        lenis?: { scrollTo: (y: number, o?: { immediate?: boolean }) => void; start?: () => void };
      }
    ).lenis;

    if (lenis) {
      try {
        lenis.start?.();
        lenis.scrollTo(0, { immediate: true });
      } catch {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;

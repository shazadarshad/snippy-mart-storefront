import { useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Thin top bar on route change — CSS only, no framer-motion. */
const TopProgressBar = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Skip flash on first paint / back-forward restore
    if (navType === 'POP') return;

    setActive(true);
    const done = window.setTimeout(() => setActive(false), 280);
    return () => window.clearTimeout(done);
  }, [location.pathname, navType]);

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-[2px] z-[10000] pointer-events-none overflow-hidden',
        !active && 'opacity-0'
      )}
      aria-hidden
    >
      <div
        className={cn(
          'h-full w-full origin-left bg-gradient-to-r from-primary via-cyan-400 to-accent shadow-[0_0_8px_hsl(var(--primary)/0.45)]',
          active ? 'animate-route-progress' : 'scale-x-0'
        )}
      />
    </div>
  );
};

export default TopProgressBar;

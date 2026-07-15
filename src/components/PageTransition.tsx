import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Instant page shell — exit animations + y-shift felt like lag on mobile.
 * Keep a tiny CSS fade only when user allows motion.
 */
const PageTransition = ({ children }: PageTransitionProps) => {
  return <div className="page-enter">{children}</div>;
};

export default PageTransition;

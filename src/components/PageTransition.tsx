import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Page shell only — no opacity/animation.
 * Fade animations caused full black / blank screens on client-side
 * navigation when the animation got stuck at near-zero opacity.
 */
const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {children}
    </div>
  );
};

export default PageTransition;

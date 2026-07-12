import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  className?: string;
  align?: 'center' | 'left';
}

const PageHero = ({
  eyebrow,
  title,
  description,
  children,
  className,
  align = 'center',
}: PageHeroProps) => {
  return (
    <section className={cn('relative overflow-hidden pt-24 sm:pt-28 pb-10 sm:pb-14', className)}>
      <div className="absolute inset-0 page-mesh pointer-events-none" />
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div
          className={cn(
            'max-w-3xl',
            align === 'center' ? 'mx-auto text-center' : 'text-left'
          )}
        >
          {eyebrow && <p className="page-eyebrow mb-4">{eyebrow}</p>}
          <h1 className="page-title mb-4">{title}</h1>
          {description && (
            <p className={cn('page-lead', align === 'center' && 'mx-auto')}>{description}</p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </section>
  );
};

export default PageHero;

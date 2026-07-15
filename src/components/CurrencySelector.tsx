import { useCurrency, CURRENCIES, type CurrencyCode } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const OPTIONS: CurrencyCode[] = ['LKR', 'USD'];

export const CurrencySelector = ({ className }: { className?: string }) => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border/60 bg-secondary/50 p-0.5',
        className
      )}
      role="group"
      aria-label="Currency"
    >
      {OPTIONS.map((code) => {
        const active = currency === code;
        const c = CURRENCIES[code];
        return (
          <Button
            key={code}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrency(code)}
            className={cn(
              'h-8 px-2.5 rounded-full text-xs font-bold tracking-wide transition-all',
              active
                ? 'bg-background text-foreground shadow-sm hover:bg-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
            )}
            aria-pressed={active}
          >
            <span className="mr-1" aria-hidden>
              {c.flag}
            </span>
            {code}
          </Button>
        );
      })}
    </div>
  );
};

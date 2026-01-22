import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useCurrency, CURRENCIES, type Currency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

const CurrencySelector = () => {
    const { currency, currencyInfo, setCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code: Currency) => {
        setCurrency(code);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm font-medium"
            >
                <span className="text-base">{currencyInfo.flag}</span>
                <span className="hidden sm:inline">{currency}</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 z-50 rounded-xl bg-card border border-border shadow-2xl overflow-hidden animate-fade-in">
                    <ul className="py-1">
                        {Object.values(CURRENCIES).map((curr) => (
                            <li key={curr.code}>
                                <button
                                    onClick={() => handleSelect(curr.code)}
                                    className={cn(
                                        'w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left',
                                        currency === curr.code
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-secondary'
                                    )}
                                >
                                    <span className="text-lg">{curr.flag}</span>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{curr.code}</p>
                                        <p className="text-xs text-muted-foreground">{curr.name}</p>
                                    </div>
                                    {currency === curr.code && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CurrencySelector;

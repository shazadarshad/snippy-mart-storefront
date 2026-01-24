import { useCurrency, CURRENCIES } from '@/hooks/useCurrency';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CurrencySelector = ({ className }: { className?: string }) => {
    const { currency, setCurrency, isLoading } = useCurrency();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "flex items-center gap-2 h-9 px-3 rounded-full hover:bg-secondary/80 transition-all",
                        className
                    )}
                    disabled={isLoading}
                >
                    <Globe className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider">{currency}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1 bg-card/95 backdrop-blur-md border-border rounded-xl shadow-2xl">
                {Object.values(CURRENCIES).map((c) => (
                    <DropdownMenuItem
                        key={c.code}
                        className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                            currency === c.code ? "bg-primary/10 text-primary" : "hover:bg-secondary/50"
                        )}
                        onClick={() => setCurrency(c.code)}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{c.flag || '🌐'}</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase">{c.code}</span>
                                <span className="text-[10px] opacity-70 leading-none">{c.name}</span>
                            </div>
                        </div>
                        {currency === c.code && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

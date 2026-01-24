import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useSearchAutocomplete } from '@/hooks/useSearchAutocomplete';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface SearchAutocompleteProps {
    onSelectProduct: (product: Product) => void;
    placeholder?: string;
    className?: string;
    compact?: boolean;
}

const SearchAutocomplete = ({
    onSelectProduct,
    placeholder = 'Search products...',
    className,
    compact = false,
}: SearchAutocompleteProps) => {
    const { formatPrice } = useCurrency();
    const { data: products = [] } = useProducts();
    const { query, results, search, clearSearch, hasResults, isSearching } = useSearchAutocomplete({
        products,
        maxResults: 5,
    });

    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        search(e.target.value);
        setIsOpen(true);
        setSelectedIndex(-1);
    };

    const handleSelectProduct = (product: Product) => {
        onSelectProduct(product);
        clearSearch();
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!hasResults) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    handleSelectProduct(results[selectedIndex].item);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <div className="relative">
                <Search className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
                    compact ? 'w-4 h-4' : 'w-5 h-5'
                )} />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => hasResults && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        'bg-card border-border',
                        compact ? 'pl-9 h-10' : 'pl-11 h-12'
                    )}
                />
                {query && (
                    <button
                        onClick={() => { clearSearch(); setIsOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-card border border-border shadow-2xl overflow-hidden animate-fade-in">
                    {isSearching ? (
                        <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Searching...</span>
                        </div>
                    ) : hasResults ? (
                        <ul className="max-h-80 overflow-y-auto">
                            {results.map((result, index) => (
                                <li key={result.item.id}>
                                    <button
                                        onClick={() => handleSelectProduct(result.item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            'w-full p-3 flex items-center gap-3 text-left transition-colors',
                                            selectedIndex === index ? 'bg-secondary' : 'hover:bg-secondary/50'
                                        )}
                                    >
                                        <img
                                            src={result.item.image_url}
                                            alt={result.item.name}
                                            className="w-12 h-12 rounded-lg object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">{result.item.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                    {result.item.category}
                                                </span>
                                                <span className="text-sm font-bold text-foreground">
                                                    {formatPrice(result.item.price)}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">
                            <p>No products found for "{query}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchAutocomplete;
